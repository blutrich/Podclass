import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/app");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary opacity-30 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-8 right-0 w-72 h-72 bg-secondary opacity-30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent opacity-30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-lg border border-muted shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <img
            src="/lovable-uploads/a59d2566-d0c1-43a9-a1a7-4b4c3d6f9f81.png"
            alt="Logo"
            className="w-12 h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground">
            Sign in to continue your learning journey
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'rgb(29, 185, 84)',
                  brandAccent: 'rgb(25, 160, 72)',
                  inputBackground: 'rgb(40, 40, 40)',
                  inputText: 'rgb(255, 255, 255)',
                  inputPlaceholder: 'rgb(167, 167, 167)',
                  defaultButtonBackground: 'rgb(29, 185, 84)',
                  defaultButtonBackgroundHover: 'rgb(25, 160, 72)'
                }
              }
            },
            className: {
              container: 'w-full',
              button: 'w-full bg-primary hover:opacity-90 text-primary-foreground font-medium',
              input: 'bg-secondary border-muted text-foreground',
              label: 'text-foreground',
              anchor: 'text-primary hover:text-primary/80',
            }
          }}
          providers={[]}
          redirectTo={`${window.location.origin}/app`}
        />
      </Card>
    </div>
  );
};

export default AuthPage;
