import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Handle auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  try {
    if (event === 'SIGNED_IN' && session) {
      console.log('User signed in:', session.user.id);
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  } catch (error) {
    console.error('Auth state change error:', error);
  }
});

// Test the connection and log the result
supabase.from('podcasts').select('count', { count: 'exact' })
  .then(({ error }) => {
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful');
    }
  })
  .catch(err => {
    console.error('Failed to connect to Supabase:', err);
  });