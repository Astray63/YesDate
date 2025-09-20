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

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Generate invitation code
  generateInvitationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  // Join partner with invitation code
  async joinPartner(invitationCode: string, userId: string) {
    // Find user with this invitation code
    const { data: partner, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('invitation_code', invitationCode)
      .single();

    if (findError) throw new Error('Code d\'invitation invalide');

    // Update both users to link them as partners
    const { error: updateError1 } = await supabase
      .from('profiles')
      .update({ partner_id: partner.id })
      .eq('id', userId);

    const { error: updateError2 } = await supabase
      .from('profiles')
      .update({ partner_id: userId })
      .eq('id', partner.id);

    if (updateError1 || updateError2) {
      throw new Error('Erreur lors de la liaison des partenaires');
    }

    return partner;
  },
};