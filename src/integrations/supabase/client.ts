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
    if (event === 'SIGNED_OUT' || !session) {
      console.error('Supabase connection error: No session');
    } else {
      console.log('Supabase connection successful');
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }
});

// Test the connection and log the result
const testConnection = async () => {
  try {
    const { error } = await supabase.from('podcasts').select('count', { count: 'exact' });
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful');
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }
};

// Run the test connection
testConnection();