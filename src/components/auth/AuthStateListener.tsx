import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AuthStateListenerProps {
  queryClient: QueryClient;
  session: any;
  children: React.ReactNode;
}

export const AuthStateListener = ({ queryClient, session, children }: AuthStateListenerProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const prefetchCommonData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Authentication error. Please try signing in again.');
          return;
        }
        
        if (!session) {
          console.log('No active session found');
          return;
        }

        console.log('Prefetching data for user:', session.user.id);

        await queryClient.prefetchQuery({
          queryKey: ['profile', session.user.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Profile fetch error:', error);
              toast.error('Failed to load profile data');
              throw error;
            }
            return data;
          },
        });

        await queryClient.prefetchQuery({
          queryKey: ['folders'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('folders')
              .select('*')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false });
            
            if (error) {
              console.error('Folders fetch error:', error);
              toast.error('Failed to load folders');
              throw error;
            }
            return data;
          },
        });

        await queryClient.prefetchQuery({
          queryKey: ['recent-lessons'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('lessons')
              .select('*')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (error) {
              console.error('Lessons fetch error:', error);
              toast.error('Failed to load recent lessons');
              throw error;
            }
            return data;
          },
        });
      } catch (error) {
        console.error('Error in prefetchCommonData:', error);
        toast.error('Failed to load initial data');
      }
    };

    const setupAuthListener = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isSubscribed) return;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth state changed:', event, session?.user?.id);
        }
        
        if (event === 'SIGNED_IN') {
          prefetchCommonData();
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      });

      if (isSubscribed) {
        setIsInitialized(true);
        if (session) {
          prefetchCommonData();
        }
      }

      return () => {
        subscription.unsubscribe();
        isSubscribed = false;
      };
    };

    setupAuthListener();

    return () => {
      isSubscribed = false;
    };
  }, [session, queryClient]);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};