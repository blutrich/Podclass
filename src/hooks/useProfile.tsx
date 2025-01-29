import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSessionContext } from '@supabase/auth-helpers-react';

export interface UserProfile {
  id: string;
  email: string | null;
  preferences: any;
  subscription_status: string;
  lessons_remaining: number;
  industry: string | null;
  interests: string[] | null;
  created_at: string;
}

export function useProfile() {
  const { session, isLoading: isLoadingSession } = useSessionContext();

  return useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!session?.user?.id) {
        console.log('No session or user ID available');
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error in profile query:', error);
        throw error;
      }
    },
    enabled: !!session?.user?.id && !isLoadingSession,
    retry: 1,
  });
}