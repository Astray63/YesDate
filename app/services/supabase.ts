import { createClient } from '@supabase/supabase-js';
import { customStorage } from '../utils/storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: customStorage,
    storageKey: 'yesdate-auth-token',
    flowType: 'pkce',
    debug: false, // Réduire les logs de debug
  },
  global: {
    headers: {
      'X-Client-Info': 'yesdate-app@1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth functions
export const authService = {
  // Sign up
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile with fixed room code
  async getUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return profile;
  },

  // Get current user with profile
  async getCurrentUserWithProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const profile = await this.getUserProfile(user.id);
    return { user, profile };
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Generate a fixed room code (6 characters, alphanumeric uppercase)
  generateFixedRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  // Create a new room
  async createRoom(creatorId: string) {
    // Get the creator's fixed room code
    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('fixed_room_code')
      .eq('id', creatorId)
      .single();

    if (profileError) throw profileError;

    // Create room with the creator's fixed code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        room_code: creatorProfile.fixed_room_code,
        creator_id: creatorId,
        status: 'waiting'
      })
      .select()
      .single();

    if (roomError) throw roomError;
    return room;
  },

  // Join a room using fixed room code
  async joinRoom(roomCode: string, memberId: string) {
    // First, get the room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (roomError) throw new Error('Room non trouvée');

    // Check if room is waiting for a member
    if (room.status !== 'waiting') {
      throw new Error('Room déjà complète ou inactive');
    }

    // Update room with member
    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({ 
        member_id: memberId,
        status: 'active'
      })
      .eq('id', room.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedRoom;
  },

  // Get room by code
  async getRoomByCode(roomCode: string) {
    const { data: room, error } = await supabase
      .from('room_details')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (error) throw error;
    return room;
  },

  // Save quiz responses
  async saveQuizResponses(roomId: string, userId: string, answers: any) {
    try {

      // Now check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // User doesn't exist in profiles, create the profile first
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: currentUser.user_metadata?.full_name || 'Utilisateur',
              fixed_room_code: this.generateFixedRoomCode(),
              updated_at: new Date().toISOString()
            });

          if (createProfileError) {
            console.error('Error creating user profile:', createProfileError);
          }
        }
      }

      // Now save the quiz response
      const { data, error } = await supabase
        .from('quiz_responses')
        .upsert({
          room_id: roomId,
          user_id: userId,
          answers: answers
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in saveQuizResponses:', error);
      throw error;
    }
  },

  // Save swipe
  async saveSwipe(roomId: string, userId: string, dateIdeaId: number, direction: string) {
    try {

      // Now save the swipe
      const { data, error } = await supabase
        .from('swipes')
        .insert({
          room_id: roomId,
          user_id: userId,
          date_idea_id: dateIdeaId,
          direction: direction
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in saveSwipe:', error);
      throw error;
    }
  },

  // Get user's swipes in a room
  async getUserSwipes(roomId: string, userId: string) {
    const { data: swipes, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
    return swipes;
  },

  // Calculate and get matches for a room
  async calculateRoomMatches(roomId: string) {
    // Call the PostgreSQL function
    const { data, error } = await supabase
      .rpc('calculate_room_matches', { p_room_id: roomId });

    if (error) throw error;

    // Get the calculated matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('room_id', roomId);

    if (matchesError) throw matchesError;
    return matches;
  },

  // Get matches for a room
  async getRoomMatches(roomId: string) {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('room_id', roomId)
      .order('match_score', { ascending: false });

    if (error) throw error;
    return matches;
  },

  // Reset room data (quiz responses, swipes, and matches)
  async resetRoom(roomId: string) {
    try {
      // Delete quiz responses for the room
      const { error: quizError } = await supabase
        .from('quiz_responses')
        .delete()
        .eq('room_id', roomId);

      if (quizError) throw quizError;

      // Delete swipes for the room
      const { error: swipesError } = await supabase
        .from('swipes')
        .delete()
        .eq('room_id', roomId);

      if (swipesError) throw swipesError;

      // Delete matches for the room
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .eq('room_id', roomId);

      if (matchesError) throw matchesError;

      // Reset room status to 'waiting' and remove member to allow fresh start
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'waiting',
          member_id: null
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      return { success: true, message: 'Room reset successfully' };
    } catch (error) {
      console.error('Error resetting room:', error);
      throw error;
    }
  },

  // Check if user has an existing room (completed or active) and reset it if needed
  async getOrCreateUserRoom(userId: string) {
    try {
      // First check if user has any room as creator
      const { data: existingRoom, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', userId)
        .single();

      if (existingRoom && !roomError) {
        // If room exists and is completed, reset it
        if (existingRoom.status === 'completed') {
          await this.resetRoom(existingRoom.id);
          return { ...existingRoom, status: 'waiting', member_id: null };
        }
        // If room is waiting or active, return it as is
        return existingRoom;
      }

      // If no room exists, create a new one
      return await this.createRoom(userId);
    } catch (error) {
      // If no room found, create a new one
      return await this.createRoom(userId);
    }
  },

  // Check if user has an active room
  async getUserActiveRoom(userId: string) {
    try {
      // Check if user is creator of an active room
      const { data: creatorRoom, error: creatorError } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', userId)
        .in('status', ['waiting', 'active'])
        .single();

      if (creatorRoom && !creatorError) {
        return creatorRoom;
      }

      // Check if user is member of an active room
      const { data: memberRoom, error: memberError } = await supabase
        .from('rooms')
        .select('*')
        .eq('member_id', userId)
        .in('status', ['waiting', 'active'])
        .single();

      if (memberRoom && !memberError) {
        return memberRoom;
      }

      return null;
    } catch (error) {
      console.error('Error checking user active room:', error);
      return null;
    }
  },

  // User Date Todos functions
  // Add a date to user's todo list
  async addUserDateTodo(userId: string, dateIdeaId: string) {
    try {
      // Now add the date todo (auth.users reference handled by DB)
      const { data, error } = await supabase
        .from('user_date_todos')
        .insert({
          user_id: userId,
          date_idea_id: dateIdeaId,
          status: 'todo'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addUserDateTodo:', error);
      throw error;
    }
  },

  // Get user's date todos
  async getUserDateTodos(userId: string) {
    const { data: todos, error } = await supabase
      .from('user_date_todos_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return todos;
  },

  // Update date todo status
  async updateDateTodoStatus(todoId: string, status: 'todo' | 'planned' | 'completed', plannedDate?: string, notes?: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (plannedDate) {
      updateData.planned_date = plannedDate;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('user_date_todos')
      .update(updateData)
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a date todo
  async deleteDateTodo(todoId: string) {
    const { error } = await supabase
      .from('user_date_todos')
      .delete()
      .eq('id', todoId);

    if (error) throw error;
    return { success: true };
  },

  // Check if date is already in user's todos
  async isDateInUserTodos(userId: string, dateIdeaId: string) {
    const { data, error } = await supabase
      .from('user_date_todos')
      .select('id')
      .eq('user_id', userId)
      .eq('date_idea_id', dateIdeaId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found
      return false;
    }

    if (error) throw error;
    return true;
  },

  // Check if both partners have completed quiz in a room
  async getRoomQuizResponses(roomId: string) {
    try {
      const { data: responses, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;

      // Get user profiles separately to avoid join issues
      const responsesWithProfiles = await Promise.all(
        (responses || []).map(async (response) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', response.user_id)
            .single();
          
          return {
            ...response,
            profiles: profile
          };
        })
      );

      // Check if we have exactly 2 responses (both partners)
      if (responsesWithProfiles.length === 2) {
        return {
          bothCompleted: true,
          user1Response: responsesWithProfiles[0],
          user2Response: responsesWithProfiles[1]
        };
      } else if (responsesWithProfiles.length === 1) {
        return {
          bothCompleted: false,
          completedBy: responsesWithProfiles[0].user_id,
          waitingFor: 'partner'
        };
      } else {
        return {
          bothCompleted: false,
          waitingFor: 'both'
        };
      }
    } catch (error) {
      console.error('Error checking room quiz responses:', error);
      return {
        bothCompleted: false,
        waitingFor: 'error'
      };
    }
  },

  // Generate date suggestions for room when both partners have completed quiz
  async generateRoomDateSuggestions(roomId: string) {
    try {
      // First get both quiz responses
      const quizStatus = await this.getRoomQuizResponses(roomId);
      
      if (!quizStatus.bothCompleted) {
        throw new Error('Les deux partenaires n\'ont pas encore complété le quiz');
      }

      // Get room details
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Prepare data for API call with type checking
      const user1Answers = quizStatus.bothCompleted && quizStatus.user1Response ? quizStatus.user1Response.answers : {};
      const user2Answers = quizStatus.bothCompleted && quizStatus.user2Response ? quizStatus.user2Response.answers : {};
      
      const requestData = {
        user1Answers,
        user2Answers,
        roomId: roomId
      };

      // Call the backend API (you'll need to implement this call in your app)
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/api/dates/generate-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des suggestions');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result.dates;
    } catch (error) {
      console.error('Error generating room date suggestions:', error);
      throw error;
    }
  },

  // ==========================================
  // NOUVELLES FONCTIONS MODE SOLO
  // ==========================================

  // Save solo swipe
  async saveSoloSwipe(userId: string, dateIdeaId: string, direction: 'left' | 'right', city?: string) {
    try {
      const { data, error } = await supabase
        .from('user_solo_swipes')
        .insert({
          user_id: userId,
          date_idea_id: dateIdeaId,
          direction: direction,
          city: city
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in saveSoloSwipe:', error);
      throw error;
    }
  },

  // Get personalized date suggestions for solo mode
  async getPersonalizedDateSuggestions(userId: string, city?: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .rpc('get_personalized_date_suggestions', {
          p_user_id: userId,
          p_city: city,
          p_limit: limit
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting personalized suggestions:', error);
      throw error;
    }
  },

  // Get all date ideas with filters
  async getDateIdeas(filters?: {
    city?: string,
    category?: string,
    cost?: string,
    location_type?: string,
    difficulty?: string
  }) {
    try {
      let query = supabase
        .from('date_ideas')
        .select('*')
        .eq('is_active', true);

      if (filters?.city) {
        query = query.or(`city.eq.${filters.city},city.is.null`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.cost) {
        query = query.eq('cost', filters.cost);
      }
      if (filters?.location_type) {
        query = query.eq('location_type', filters.location_type);
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting date ideas:', error);
      return [];
    }
  },

  // Get user statistics
  async getUserStats(userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats', { p_user_id: userId });

      if (error) throw error;
      return data?.[0] || {
        total_swipes: 0,
        right_swipes: 0,
        left_swipes: 0,
        todos_count: 0,
        completed_todos: 0,
        planned_todos: 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_swipes: 0,
        right_swipes: 0,
        left_swipes: 0,
        todos_count: 0,
        completed_todos: 0,
        planned_todos: 0
      };
    }
  },

  // Get user's solo swipes history
  async getUserSoloSwipes(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_solo_swipes_with_details')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user solo swipes:', error);
      return [];
    }
  },

  // Check if user has already swiped on a date idea
  async hasUserSwipedDateIdea(userId: string, dateIdeaId: string) {
    try {
      const { data, error } = await supabase
        .from('user_solo_swipes')
        .select('direction')
        .eq('user_id', userId)
        .eq('date_idea_id', dateIdeaId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found
        return { hasSwiped: false, direction: null };
      }

      if (error) throw error;
      return { hasSwiped: true, direction: data.direction };
    } catch (error) {
      console.error('Error checking user swipe:', error);
      return { hasSwiped: false, direction: null };
    }
  },

  // Generate date suggestions using AI (for solo mode)
  async generateAIDateSuggestions(answers: any, city: string, count: number = 20) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/api/dates/generate-solo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          city,
          count
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des suggestions IA');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result.dates;
    } catch (error) {
      console.error('Error generating AI date suggestions:', error);
      // Fallback to database suggestions
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        return this.getPersonalizedDateSuggestions(currentUser.id, city, count);
      }
      return [];
    }
  },
};
