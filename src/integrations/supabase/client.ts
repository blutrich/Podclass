import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'podclass-web'
    }
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
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('podcasts').select('count', { count: 'exact' });
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful');
    }

    // Test Edge Function access
    const { data: functionData, error: functionError } = await supabase.functions.invoke('transcribe-episode', {
      body: { test: true }
    });
    
    if (functionError) {
      console.error('Edge Function test error:', {
        message: functionError.message,
        name: functionError.name,
        status: functionError?.status,
        details: functionError
      });
    } else {
      console.log('Edge Function test successful:', functionData);
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }
};

testConnection();