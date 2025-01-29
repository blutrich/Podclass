import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Book, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: {
            role,
            industry,
            interests,
          },
        })
        .eq("id", user.id);

      if (!error) {
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="p-6">
            <div className="mb-8 flex justify-between">
              {[1, 2, 3].map((number) => (
                <div
                  key={number}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    step >= number ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {step > number ? <CheckCircle className="h-5 w-5" /> : number}
                </div>
              ))}
            </div>

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">What's your role?</h2>
                <RadioGroup value={role} onValueChange={setRole}>
                  <div className="grid gap-4">
                    {["Executive", "Manager", "Individual Contributor", "Entrepreneur"].map((option) => (
                      <Label
                        key={option}
                        className={`flex cursor-pointer items-center rounded-lg border p-4 hover:bg-muted ${
                          role === option ? "border-primary" : ""
                        }`}
                      >
                        <RadioGroupItem value={option} className="sr-only" />
                        <Briefcase className="mr-3 h-5 w-5" />
                        {option}
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">Select your industry</h2>
                <RadioGroup value={industry} onValueChange={setIndustry}>
                  <div className="grid gap-4">
                    {["Healthcare", "Technology", "Finance", "Education", "Other"].map((option) => (
                      <Label
                        key={option}
                        className={`flex cursor-pointer items-center rounded-lg border p-4 hover:bg-muted ${
                          industry === option ? "border-primary" : ""
                        }`}
                      >
                        <RadioGroupItem value={option} className="sr-only" />
                        <Users className="mr-3 h-5 w-5" />
                        {option}
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">What topics interest you?</h2>
                <div className="grid gap-4">
                  {[
                    "Leadership",
                    "Innovation",
                    "Professional Development",
                    "Industry Trends",
                    "Best Practices",
                  ].map((topic) => (
                    <Label
                      key={topic}
                      className={`flex cursor-pointer items-center rounded-lg border p-4 hover:bg-muted ${
                        interests.includes(topic) ? "border-primary" : ""
                      }`}
                      onClick={() => {
                        setInterests((prev) =>
                          prev.includes(topic)
                            ? prev.filter((t) => t !== topic)
                            : [...prev, topic]
                        );
                      }}
                    >
                      <Book className="mr-3 h-5 w-5" />
                      {topic}
                    </Label>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="mt-8">
              <Button
                className="w-full"
                onClick={step < 3 ? handleNext : handleComplete}
                disabled={
                  (step === 1 && !role) ||
                  (step === 2 && !industry) ||
                  (step === 3 && interests.length === 0)
                }
              >
                {step < 3 ? "Continue" : "Complete Setup"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};