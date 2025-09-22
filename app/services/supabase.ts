import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
  },

  // Save swipe
  async saveSwipe(roomId: string, userId: string, dateIdeaId: number, direction: string) {
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

      // Reset room status to 'active' to allow restarting the process
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'active'
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      return { success: true, message: 'Room reset successfully' };
    } catch (error) {
      console.error('Error resetting room:', error);
      throw error;
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
};
