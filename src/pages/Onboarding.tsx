import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ThumbsUp, Heart } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    goal: '',
    gender: '',
    age: 25,
    height_cm: 170,
    current_weight_kg: 70,
    goal_weight_kg: 65,
    activity_level: '',
    weekly_goal_kg: '0.5',
    daily_calorie_goal: '2000',
    daily_steps_goal: '10000',
    daily_water_goal_ml: '2000',
    add_burned_calories: false,
    health_conditions: [] as string[],
  });

  const totalSteps = 10;
  const progress = ((step + 1) / totalSteps) * 100;

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const genderMap: Record<string, string> = {
        'Male': 'male',
        'Female': 'female',
        'Other': 'other',
      };
      const activityMap: Record<string, string> = {
        'Mostly inactive': 'inactive',
        'Lightly active': 'lightly_active',
        'Active': 'moderately_active',
        'Very active': 'very_active',
      };

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        gender: genderMap[form.gender] || 'other',
        age: form.age,
        height_cm: form.height_cm,
        current_weight_kg: form.current_weight_kg,
        starting_weight_kg: form.current_weight_kg,
        goal_weight_kg: form.goal_weight_kg,
        activity_level: activityMap[form.activity_level] || 'inactive',
        weekly_goal_kg: form.weekly_goal_kg,
        daily_calorie_goal: parseInt(String(form.daily_calorie_goal)),
        daily_steps_goal: parseInt(String(form.daily_steps_goal)),
        daily_water_goal_ml: parseInt(String(form.daily_water_goal_ml)),
        add_burned_calories: form.add_burned_calories,
      });

      if (error) throw error;

      toast({ title: 'Profile created', description: 'Welcome!' });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1: return !!form.goal;
      case 3: return !!form.gender;
      case 4: return form.age > 0;
      case 5: return form.height_cm > 0;
      case 6: return form.current_weight_kg > 0;
      case 7: return !!form.activity_level;
      default: return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Back Button */}
      {step > 0 && (
        <button
          onClick={back}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-8">
                <h1 className="text-4xl font-bold">Wel<span className="text-primary">mi</span></h1>
                
                <div className="py-12">
                  <ThumbsUp className="w-24 h-24 mx-auto text-primary mb-8" />
                  <h2 className="text-3xl font-bold text-primary mb-4">
                    Starting out is the hardest part - and you've already done it!
                  </h2>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Let's personalize your journey together</h3>
                  <Button onClick={next} className="w-full h-14 text-lg">
                    Continue
                  </Button>
                  <button 
                    onClick={() => navigate('/auth')}
                    className="text-sm text-muted-foreground"
                  >
                    I already have an account <span className="font-semibold text-foreground">Sign In</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Goal */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">What's your goal?</h2>
                  <p className="text-muted-foreground">Help us understand your motivation</p>
                </div>

                <div className="space-y-3">
                  {[
                    { emoji: '🌱', label: 'Lose weight' },
                    { emoji: '🏃', label: 'Get healthier' },
                    { emoji: '💪', label: 'Look better' },
                    { emoji: '🍎', label: 'Have more energy' },
                  ].map((goal) => (
                    <button
                      key={goal.label}
                      onClick={() => setForm({ ...form, goal: goal.label })}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        form.goal === goal.label
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{goal.emoji}</span>
                      <span className="text-lg font-medium">{goal.label}</span>
                      <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        form.goal === goal.label ? 'border-primary' : 'border-border'
                      }`}>
                        {form.goal === goal.label && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <Button onClick={next} disabled={!canContinue()} className="w-full h-14 text-lg">
                    Continue
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By continuing, you agree to our <span className="underline">Terms of Use</span> and <span className="underline">Privacy Policy</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Support Screen */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">Support that actually works</h2>
                  <p className="text-muted-foreground">Your nutritionist is always here to keep you on track</p>
                </div>

                <div className="bg-card p-6 rounded-2xl">
                  <svg viewBox="0 0 400 200" className="w-full h-48">
                    <text x="10" y="20" className="text-xs fill-muted-foreground">Result</text>
                    <text x="350" y="195" className="text-xs fill-muted-foreground">Time</text>
                    
                    <path
                      d="M 20 150 Q 100 180, 150 100 T 380 40"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                    />
                    <circle cx="380" cy="40" r="5" fill="hsl(var(--primary))" />
                    <text x="280" y="30" className="text-xs font-medium fill-primary">With a nutritionist</text>
                    
                    <path
                      d="M 20 150 Q 100 180, 150 140 T 380 120"
                      fill="none"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                    <circle cx="380" cy="120" r="4" fill="hsl(var(--muted-foreground))" />
                    <text x="300" y="135" className="text-xs fill-muted-foreground">On your own</text>
                  </svg>
                </div>

                <p className="text-center text-sm text-muted-foreground px-4">
                  People who follow a plan with a nutritionist's support see lasting progress
                </p>

                <Button onClick={next} className="w-full h-14 text-lg">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 3: Gender */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">What's your gender?</h2>
                  <p className="text-muted-foreground">Your metabolism is unique and it can vary by gender</p>
                </div>

                <div className="space-y-3">
                  {[
                    { emoji: '🤵', label: 'Male' },
                    { emoji: '👩', label: 'Female' },
                    { emoji: '🧑', label: 'Other' },
                  ].map((gender) => (
                    <button
                      key={gender.label}
                      onClick={() => setForm({ ...form, gender: gender.label })}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        form.gender === gender.label
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{gender.emoji}</span>
                      <span className="text-lg font-medium">{gender.label}</span>
                      <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        form.gender === gender.label ? 'border-primary' : 'border-border'
                      }`}>
                        {form.gender === gender.label && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button onClick={next} disabled={!canContinue()} className="w-full h-14 text-lg">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 4: Age */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">How old are you?</h2>
                  <p className="text-muted-foreground">Metabolism can change with age</p>
                </div>

                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-full max-w-xs h-48 overflow-hidden">
                    {[form.age - 2, form.age - 1, form.age, form.age + 1, form.age + 2].map((age, idx) => (
                      <div
                        key={age}
                        className={`absolute inset-x-0 flex items-center justify-center transition-all ${
                          idx === 2
                            ? 'text-6xl font-bold'
                            : idx === 1 || idx === 3
                            ? 'text-4xl text-muted-foreground/50'
                            : 'text-2xl text-muted-foreground/30'
                        }`}
                        style={{
                          top: `${idx * 48}px`,
                        }}
                      >
                        {age}
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-16 bg-primary/10 rounded-xl border-2 border-primary/20" />
                  </div>
                  
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })}
                    className="w-full max-w-xs mt-4"
                  />
                </div>

                <Button onClick={next} className="w-full h-14 text-lg">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 5: Height */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">What's your height?</h2>
                  <p className="text-muted-foreground">Your height helps shape your body proportions</p>
                </div>

                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex gap-2 mb-6">
                    <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium">
                      cm
                    </button>
                    <button className="px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium">
                      ft
                    </button>
                  </div>

                  <div className="relative w-full h-64 flex items-center justify-center">
                    <div className="text-7xl font-bold">{form.height_cm}<span className="text-3xl text-muted-foreground ml-2">cm</span></div>
                  </div>

                  <input
                    type="range"
                    min="140"
                    max="220"
                    value={form.height_cm}
                    onChange={(e) => setForm({ ...form, height_cm: parseInt(e.target.value) })}
                    className="w-full max-w-xs"
                  />
                </div>

                <Button onClick={next} className="w-full h-14 text-lg">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 6: Weight */}
            {step === 6 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">What's your weight?</h2>
                  <p className="text-muted-foreground">This is where your journey begins</p>
                </div>

                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex gap-2 mb-6">
                    <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium">
                      kg
                    </button>
                    <button className="px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium">
                      lbs
                    </button>
                  </div>

                  <div className="relative w-full h-64 flex items-center justify-center">
                    <div className="text-7xl font-bold">{form.current_weight_kg}<span className="text-3xl text-muted-foreground ml-2">kg</span></div>
                  </div>

                  <input
                    type="range"
                    min="40"
                    max="200"
                    value={form.current_weight_kg}
                    onChange={(e) => setForm({ ...form, current_weight_kg: parseFloat(e.target.value), goal_weight_kg: Math.min(form.goal_weight_kg, parseFloat(e.target.value)) })}
                    className="w-full max-w-xs"
                  />
                </div>

                <Button onClick={next} className="w-full h-14 text-lg">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 7: Activity Level */}
            {step === 7 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">What's your activity level?</h2>
                  <p className="text-muted-foreground">This helps us calculate your daily needs</p>
                </div>

                <div className="space-y-3">
                  {[
                    { emoji: '🧘', label: 'Mostly inactive', desc: 'I have a desk job' },
                    { emoji: '🚶', label: 'Lightly active', desc: 'I move a bit during the day' },
                    { emoji: '🏃', label: 'Active', desc: 'I include workouts' },
                    { emoji: '🏋️', label: 'Very active', desc: 'I am active most of the day' },
                  ].map((level) => (
                    <button
                      key={level.label}
                      onClick={() => setForm({ ...form, activity_level: level.label })}
                      className={`w-full p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                        form.activity_level === level.label
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{level.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="text-lg font-medium">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.desc}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        form.activity_level === level.label ? 'border-primary' : 'border-border'
                      }`}>
                        {form.activity_level === level.label && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button onClick={next} disabled={!canContinue()} className="w-full h-14 text-lg">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 8: Health Conditions */}
            {step === 8 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">What should we take into account?</h2>
                  <p className="text-muted-foreground">We keep your health needs in mind</p>
                </div>

                <div className="space-y-3">
                  {[
                    { emoji: '🤢', label: 'Gastric Disease' },
                    { emoji: '🩸', label: 'High Cholesterol' },
                    { emoji: '🦋', label: 'Thyroid Disease' },
                    { emoji: '💉', label: 'Diabetes' },
                    { emoji: '💊', label: 'GLP-1 Therapy' },
                  ].map((condition) => (
                    <button
                      key={condition.label}
                      onClick={() => {
                        const conditions = form.health_conditions.includes(condition.label)
                          ? form.health_conditions.filter(c => c !== condition.label)
                          : [...form.health_conditions, condition.label];
                        setForm({ ...form, health_conditions: conditions });
                      }}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        form.health_conditions.includes(condition.label)
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{condition.emoji}</span>
                      <span className="text-lg font-medium">{condition.label}</span>
                      <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        form.health_conditions.includes(condition.label) ? 'border-primary' : 'border-border'
                      }`}>
                        {form.health_conditions.includes(condition.label) && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button onClick={next} className="w-full h-14 text-lg">
                  No health conditions
                </Button>
              </div>
            )}

            {/* Step 9: Disclaimer */}
            {step === 9 && (
              <div className="space-y-8 text-center">
                <Heart className="w-24 h-24 mx-auto text-primary" fill="currentColor" />
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Guiding you with care</h2>
                  
                  <p className="text-muted-foreground px-4">
                    Welmi provides personalized eating recommendations, adapting to your individual health profile and dietary needs.
                  </p>
                  
                  <p className="text-sm text-muted-foreground px-4">
                    However, our app is not a substitute for professional medical advice. Before starting any new diet or if you have any health concerns, always consult a qualified healthcare professional.
                  </p>
                </div>

                <Button onClick={submit} disabled={loading} className="w-full h-14 text-lg">
                  {loading ? 'Setting up...' : 'Okay, got it'}
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
