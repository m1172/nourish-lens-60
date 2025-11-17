import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ThumbsUp, Heart, Target, Check } from 'lucide-react';

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
    weekly_goal_kg: 0.5,
    daily_calorie_goal: '2000',
    daily_steps_goal: '10000',
    daily_water_goal_ml: '2000',
    add_burned_calories: false,
    health_conditions: [] as string[],
    program_steps: [] as string[],
  });

  const totalSteps = 15;
  const [customizingProgress, setCustomizingProgress] = useState(0);
  const progress = ((step + 1) / totalSteps) * 100;

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Simulate customizing progress
  useEffect(() => {
    if (step === 12) {
      setCustomizingProgress(0);
      const interval = setInterval(() => {
        setCustomizingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => next(), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);

  const submit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const genderMap: Record<string, string> = {
        Male: 'male',
        Female: 'female',
      };
      const activityMap: Record<string, string> = {
        'Mostly inactive': 'inactive',
        'Lightly active': 'lightly_active',
        Active: 'moderately_active',
        'Very active': 'very_active',
      };

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        gender: genderMap[form.gender],
        age: form.age,
        height_cm: form.height_cm,
        current_weight_kg: form.current_weight_kg,
        starting_weight_kg: form.current_weight_kg,
        goal_weight_kg: form.goal_weight_kg,
        activity_level: activityMap[form.activity_level] || 'inactive',
        daily_calorie_goal: calculateCalories(form.weekly_goal_kg),
        daily_steps_goal: parseInt(String(form.daily_steps_goal)),
        daily_water_goal_ml: parseInt(String(form.daily_water_goal_ml)),
        add_burned_calories: form.add_burned_calories,
      });

      if (error) throw error;

      toast({ title: 'Profile created', description: 'Welcome!' });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create profile';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getHealthyWeightRange = (height: number) => {
    const heightInMeters = height / 100;
    const minHealthyBMI = 18.5;
    const maxHealthyBMI = 24.9;
    return {
      min: Math.round(minHealthyBMI * heightInMeters * heightInMeters),
      max: Math.round(maxHealthyBMI * heightInMeters * heightInMeters),
    };
  };

  const targetWeightBMI = calculateBMI(form.goal_weight_kg, form.height_cm);
  const isTargetHealthy = targetWeightBMI >= 18.5 && targetWeightBMI <= 24.9;
  const healthyRange = getHealthyWeightRange(form.height_cm);

  const calculateWeeklyGoal = (sliderValue: number) => {
    // 0-33% = 0.5kg, 34-66% = 0.8kg, 67-100% = 1kg
    if (sliderValue <= 33) return 0.5;
    if (sliderValue <= 66) return 0.8;
    return 1;
  };

  const calculateCalories = (weeklyGoal: number) => {
    // Basic calorie calculation based on weekly goal
    const baseCalories = 2000;
    const deficit = (weeklyGoal * 7700) / 7; // 7700 calories per kg
    return Math.round(baseCalories - deficit);
  };

  const calculateTimeToGoal = () => {
    const totalWeightLoss = form.current_weight_kg - form.goal_weight_kg;
    const weeks = Math.ceil(totalWeightLoss / form.weekly_goal_kg);
    return weeks;
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return !!form.goal;
      case 3:
        return !!form.gender;
      case 4:
        return form.age > 0;
      case 5:
        return form.height_cm > 0;
      case 6:
        return !!form.activity_level;
      case 8:
        return form.current_weight_kg > 0;
      case 9:
        return (
          form.goal_weight_kg > 0 &&
          form.goal_weight_kg < form.current_weight_kg
        );
      default:
        return true;
    }
  };

  return (
    <div className='inset-0 bg-background flex flex-col'>
      {/* Progress Bar */}
      {step > 0 && (
        <div className='absolute top-0 left-0 right-0 h-1 bg-muted'>
          <div
            className='h-full bg-primary transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Back Button */}
      {step > 0 && (
        <button
          onClick={back}
          className='absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors z-10'
        >
          <ArrowLeft className='w-6 h-6' />
        </button>
      )}

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='min-h-full flex items-center justify-center p-6'>
          <div className='w-full max-w-lg'>
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className='text-center space-y-8'>
                <h1 className='text-4xl font-bold'>
                  Wel<span className='text-primary'>mi</span>
                </h1>

                <div className='py-12'>
                  <ThumbsUp className='w-24 h-24 mx-auto text-primary mb-8' />
                  <h2 className='text-3xl font-bold text-primary mb-4'>
                    Starting out is the hardest part - and you've already done
                    it!
                  </h2>
                </div>

                <div className='space-y-4'>
                  <h3 className='text-2xl font-bold'>
                    Let's personalize your journey together
                  </h3>
                  <Button onClick={next} className='w-full h-14 text-lg'>
                    Continue
                  </Button>
                  <button
                    onClick={() => navigate('/auth')}
                    className='text-sm text-muted-foreground'
                  >
                    I already have an account{' '}
                    <span className='font-semibold text-foreground'>
                      Sign In
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Goal */}
            {step === 1 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>What's your goal?</h2>
                  <p className='text-muted-foreground'>
                    Help us understand your motivation
                  </p>
                </div>

                <div className='space-y-3'>
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
                      <span className='text-2xl'>{goal.emoji}</span>
                      <span className='text-lg font-medium'>{goal.label}</span>
                      <div
                        className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          form.goal === goal.label
                            ? 'border-primary'
                            : 'border-border'
                        }`}
                      >
                        {form.goal === goal.label && (
                          <div className='w-3 h-3 rounded-full bg-primary' />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className='pt-4'>
                  <Button
                    onClick={next}
                    disabled={!canContinue()}
                    className='w-full h-14 text-lg'
                  >
                    Continue
                  </Button>
                  <p className='text-xs text-center text-muted-foreground mt-4'>
                    By continuing, you agree to our{' '}
                    <span className='underline'>Terms of Use</span> and{' '}
                    <span className='underline'>Privacy Policy</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Support Screen */}
            {step === 2 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    Support that actually works
                  </h2>
                  <p className='text-muted-foreground'>
                    Your nutritionist is always here to keep you on track
                  </p>
                </div>

                <div className='bg-card p-6 rounded-2xl'>
                  <svg viewBox='0 0 400 200' className='w-full h-48'>
                    <text
                      x='10'
                      y='20'
                      className='text-xs fill-muted-foreground'
                    >
                      Result
                    </text>
                    <text
                      x='350'
                      y='195'
                      className='text-xs fill-muted-foreground'
                    >
                      Time
                    </text>

                    <path
                      d='M 20 150 Q 100 180, 150 100 T 380 40'
                      fill='none'
                      stroke='hsl(var(--primary))'
                      strokeWidth='3'
                    />
                    <circle cx='380' cy='40' r='5' fill='hsl(var(--primary))' />
                    <text
                      x='280'
                      y='30'
                      className='text-xs font-medium fill-primary'
                    >
                      With a nutritionist
                    </text>

                    <path
                      d='M 20 150 Q 100 180, 150 140 T 380 120'
                      fill='none'
                      stroke='hsl(var(--muted-foreground))'
                      strokeWidth='2'
                      opacity='0.5'
                    />
                    <circle
                      cx='380'
                      cy='120'
                      r='4'
                      fill='hsl(var(--muted-foreground))'
                    />
                    <text
                      x='300'
                      y='135'
                      className='text-xs fill-muted-foreground'
                    >
                      On your own
                    </text>
                  </svg>
                </div>

                <p className='text-center text-sm text-muted-foreground px-4'>
                  People who follow a plan with a nutritionist's support see
                  lasting progress
                </p>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 3: Gender */}
            {step === 3 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What's your gender?
                  </h2>
                  <p className='text-muted-foreground'>
                    Your metabolism is unique and it can vary by gender
                  </p>
                </div>

                <div className='space-y-3'>
                  {[
                    { emoji: '🤵', label: 'Male' },
                    { emoji: '👩', label: 'Female' },
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
                      <span className='text-2xl'>{gender.emoji}</span>
                      <span className='text-lg font-medium'>
                        {gender.label}
                      </span>
                      <div
                        className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          form.gender === gender.label
                            ? 'border-primary'
                            : 'border-border'
                        }`}
                      >
                        {form.gender === gender.label && (
                          <div className='w-3 h-3 rounded-full bg-primary' />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={next}
                  disabled={!canContinue()}
                  className='w-full h-14 text-lg'
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 4: Age */}
            {step === 4 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>How old are you?</h2>
                  <p className='text-muted-foreground'>
                    Metabolism can change with age
                  </p>
                </div>

                <div className='flex flex-col items-center justify-center py-8'>
                  <div className='relative w-full max-w-xs h-48 overflow-hidden'>
                    {[
                      form.age - 2,
                      form.age - 1,
                      form.age,
                      form.age + 1,
                      form.age + 2,
                    ].map((age, idx) => (
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
                    <div className='absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none' />
                    <div className='absolute top-1/2 -translate-y-1/2 inset-x-0 h-16 bg-primary/10 rounded-xl border-2 border-primary/20' />
                  </div>

                  <input
                    type='range'
                    min='18'
                    max='100'
                    value={form.age}
                    onChange={(e) =>
                      setForm({ ...form, age: parseInt(e.target.value) })
                    }
                    className='w-full max-w-xs mt-4'
                  />
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 5: Height */}
            {step === 5 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What's your height?
                  </h2>
                  <p className='text-muted-foreground'>
                    Your height helps shape your body proportions
                  </p>
                </div>

                <div className='flex flex-col items-center justify-center py-8'>
                  <div className='flex gap-2 mb-6'>
                    <button className='px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium'>
                      cm
                    </button>
                    <button className='px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium'>
                      ft
                    </button>
                  </div>

                  <div className='relative w-full h-64 flex items-center justify-center'>
                    <div className='text-7xl font-bold'>
                      {form.height_cm}
                      <span className='text-3xl text-muted-foreground ml-2'>
                        cm
                      </span>
                    </div>
                  </div>

                  <input
                    type='range'
                    min='140'
                    max='220'
                    value={form.height_cm}
                    onChange={(e) =>
                      setForm({ ...form, height_cm: parseInt(e.target.value) })
                    }
                    className='w-full max-w-xs'
                  />
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {step === 6 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What's your weight?
                  </h2>
                  <p className='text-muted-foreground'>
                    This is where your journey begins
                  </p>
                </div>

                <div className='flex flex-col items-center justify-center py-8'>
                  <div className='flex gap-2 mb-6'>
                    <button className='px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium'>
                      kg
                    </button>
                    <button className='px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium'>
                      lbs
                    </button>
                  </div>

                  <div className='relative w-full h-64 flex items-center justify-center'>
                    <div className='text-7xl font-bold'>
                      {form.current_weight_kg}
                      <span className='text-3xl text-muted-foreground ml-2'>
                        kg
                      </span>
                    </div>
                  </div>

                  <input
                    type='range'
                    min='40'
                    max='200'
                    value={form.current_weight_kg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        current_weight_kg: parseFloat(e.target.value),
                        goal_weight_kg: Math.min(
                          form.goal_weight_kg,
                          parseFloat(e.target.value)
                        ),
                      })
                    }
                    className='w-full max-w-xs'
                  />
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {step === 7 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What's your activity level?
                  </h2>
                  <p className='text-muted-foreground'>
                    This helps us calculate your daily needs
                  </p>
                </div>

                <div className='space-y-3'>
                  {[
                    {
                      emoji: '🧘',
                      label: 'Mostly inactive',
                      desc: 'I have a desk job',
                    },
                    {
                      emoji: '🚶',
                      label: 'Lightly active',
                      desc: 'I move a bit during the day',
                    },
                    {
                      emoji: '🏃',
                      label: 'Active',
                      desc: 'I include workouts',
                    },
                    {
                      emoji: '🏋️',
                      label: 'Very active',
                      desc: 'I am active most of the day',
                    },
                  ].map((level) => (
                    <button
                      key={level.label}
                      onClick={() =>
                        setForm({ ...form, activity_level: level.label })
                      }
                      className={`w-full p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                        form.activity_level === level.label
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className='text-2xl'>{level.emoji}</span>
                      <div className='flex-1 text-left'>
                        <div className='text-lg font-medium'>{level.label}</div>
                        <div className='text-sm text-muted-foreground'>
                          {level.desc}
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          form.activity_level === level.label
                            ? 'border-primary'
                            : 'border-border'
                        }`}
                      >
                        {form.activity_level === level.label && (
                          <div className='w-3 h-3 rounded-full bg-primary' />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={next}
                  disabled={!canContinue()}
                  className='w-full h-14 text-lg'
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 8: Health Conditions */}
            {step === 8 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What should we take into account?
                  </h2>
                  <p className='text-muted-foreground'>
                    We keep your health needs in mind
                  </p>
                </div>

                <div className='space-y-3'>
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
                        const conditions = form.health_conditions.includes(
                          condition.label
                        )
                          ? form.health_conditions.filter(
                              (c) => c !== condition.label
                            )
                          : [...form.health_conditions, condition.label];
                        setForm({ ...form, health_conditions: conditions });
                      }}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        form.health_conditions.includes(condition.label)
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className='text-2xl'>{condition.emoji}</span>
                      <span className='text-lg font-medium'>
                        {condition.label}
                      </span>
                      <div
                        className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          form.health_conditions.includes(condition.label)
                            ? 'border-primary'
                            : 'border-border'
                        }`}
                      >
                        {form.health_conditions.includes(condition.label) && (
                          <div className='w-3 h-3 rounded-full bg-primary' />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  No health conditions
                </Button>
              </div>
            )}

            {/* Step 8: Weight */}

            {/* Step 9: Target Weight */}
            {step === 9 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What's your target weight?
                  </h2>
                  <p className='text-muted-foreground'>
                    Let's set a goal you can achieve
                  </p>
                </div>

                <div className='flex flex-col items-center justify-center py-8'>
                  <div className='relative w-full h-48 flex items-center justify-center mb-8'>
                    <div className='text-7xl font-bold'>
                      {form.goal_weight_kg.toFixed(1)}
                      <span className='text-3xl text-muted-foreground ml-2'>
                        kg
                      </span>
                    </div>
                    <div className='absolute top-0 right-8 text-4xl text-muted-foreground'>
                      {form.current_weight_kg}
                    </div>
                  </div>

                  {/* Visual slider representation */}
                  <div className='w-full max-w-xs mb-4 relative h-12'>
                    <div className='absolute inset-x-0 flex justify-between text-xs text-muted-foreground'>
                      {Array.from({ length: 11 }, (_, i) => {
                        const weight = Math.round(
                          form.current_weight_kg - 10 + i
                        );
                        return (
                          <div key={i} className='flex flex-col items-center'>
                            <div
                              className={`h-2 w-px bg-border ${
                                i === 0 || i === 10 ? 'h-4' : ''
                              }`}
                            />
                            {(i === 0 || i === 5 || i === 10) && (
                              <span className='mt-1'>{weight}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className='absolute top-0 h-12 bg-primary/20 rounded-l'
                      style={{
                        left: 0,
                        right: `${
                          ((form.current_weight_kg - form.goal_weight_kg) /
                            20) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className='absolute top-1/2 -translate-y-1/2 w-1 h-16 bg-primary rounded-full'
                      style={{
                        left: `${
                          ((form.goal_weight_kg -
                            (form.current_weight_kg - 10)) /
                            20) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <input
                    type='range'
                    min={form.current_weight_kg - 50}
                    max={form.current_weight_kg}
                    step='0.1'
                    value={form.goal_weight_kg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        goal_weight_kg: parseFloat(e.target.value),
                      })
                    }
                    className='w-full max-w-xs'
                  />
                </div>

                {/* BMI Feedback */}
                <div
                  className={`p-4 rounded-2xl flex gap-3 ${
                    isTargetHealthy
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-orange-500/10 border border-orange-500/20'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                      isTargetHealthy ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                  >
                    {isTargetHealthy ? (
                      <Check className='w-4 h-4 text-white' />
                    ) : (
                      <span className='text-white text-sm font-bold'>!</span>
                    )}
                  </div>
                  <div className='flex-1'>
                    <h3
                      className={`font-semibold mb-1 ${
                        isTargetHealthy ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {isTargetHealthy
                        ? `A healthy target is about ${Math.round(
                            (healthyRange.min + healthyRange.max) / 2
                          )} kg`
                        : 'Outside healthy range'}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {isTargetHealthy
                        ? 'This puts you in a healthy BMI range. It can boost your energy and lower health risks'
                        : 'Adjusting your weight to be within the healthy range could be supportive for your health and energy levels.'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={next}
                  disabled={!canContinue()}
                  className='w-full h-14 text-lg'
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 10: Weekly Pace */}
            {step === 10 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    Pick a pace that works for you
                  </h2>
                </div>

                <div className='flex flex-col items-center justify-center py-8'>
                  <p className='text-muted-foreground mb-4'>
                    Expected progress per week
                  </p>

                  <div className='text-7xl font-bold mb-8'>
                    {form.weekly_goal_kg.toFixed(1)}
                    <span className='text-3xl text-muted-foreground ml-2'>
                      kg
                    </span>
                  </div>

                  <div className='w-full max-w-xs relative mb-8'>
                    <input
                      type='range'
                      min='0'
                      max='100'
                      value={
                        form.weekly_goal_kg === 0.5
                          ? 16
                          : form.weekly_goal_kg === 0.8
                          ? 50
                          : 84
                      }
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setForm({
                          ...form,
                          weekly_goal_kg: calculateWeeklyGoal(val),
                        });
                      }}
                      className='w-full'
                    />
                    <div className='flex justify-between text-xs text-muted-foreground mt-2'>
                      <span>Easy</span>
                      <span>Balanced</span>
                      <span>Strict</span>
                    </div>
                  </div>
                </div>

                <div className='p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex gap-3'>
                  <Check className='w-6 h-6 text-green-500 flex-shrink-0' />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-green-600 mb-1'>
                      Reach your goal by{' '}
                      {new Date(
                        Date.now() +
                          calculateTimeToGoal() * 7 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Daily calorie goal –{' '}
                      {calculateCalories(form.weekly_goal_kg)} kcal. It's
                      balanced, sustainable, and supports your long term success
                      goals.
                    </p>
                  </div>
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 11: Program Steps */}
            {step === 11 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    Pick your program steps
                  </h2>
                  <p className='text-muted-foreground'>
                    Each one will support your goal in different ways!
                  </p>
                </div>

                <div className='space-y-3'>
                  {[
                    {
                      emoji: '📖',
                      label: 'Log your meals',
                      desc: 'Create long-term healthy habits',
                    },
                    {
                      emoji: '👨‍⚕️',
                      label: 'Work with a nutritionist',
                      desc: 'Learn to make better eating decisions',
                    },
                    {
                      emoji: '🥘',
                      label: 'Cook healthy meals',
                      desc: 'Adds variety of recipes you can pick from',
                    },
                    {
                      emoji: '🏃',
                      label: 'Move more during the day',
                      desc: 'Boosts energy and gives you more flexibility with your calories',
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        const steps = form.program_steps.includes(item.label)
                          ? form.program_steps.filter((s) => s !== item.label)
                          : [...form.program_steps, item.label];
                        setForm({ ...form, program_steps: steps });
                      }}
                      className={`w-full p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                        form.program_steps.includes(item.label)
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className='text-2xl'>{item.emoji}</span>
                      <div className='flex-1 text-left'>
                        <div className='text-lg font-medium'>{item.label}</div>
                        <div className='text-sm text-muted-foreground'>
                          {item.desc}
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          form.program_steps.includes(item.label)
                            ? 'border-primary'
                            : 'border-border'
                        }`}
                      >
                        {form.program_steps.includes(item.label) && (
                          <div className='w-3 h-3 rounded-full bg-primary' />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={next}
                  disabled={form.program_steps.length === 0}
                  className='w-full h-14 text-lg'
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 12: Customizing */}
            {step === 12 && (
              <div className='space-y-8'>
                <h2 className='text-3xl font-bold text-center'>
                  Customizing your program
                </h2>

                <div className='space-y-6 py-8'>
                  {[
                    {
                      label: 'Analyzing profile',
                      detail: `${form.height_cm} cm, ${form.current_weight_kg} kg`,
                    },
                    {
                      label: 'Metabolism Insights',
                      detail: `${calculateCalories(form.weekly_goal_kg)} kcal`,
                    },
                    {
                      label: 'Generating meal plan',
                      detail: 'Balanced',
                    },
                    {
                      label: 'Health condition',
                      detail:
                        form.health_conditions.length > 0
                          ? 'Taken into account'
                          : 'None',
                    },
                  ].map((item, idx) => (
                    <div key={item.label} className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-muted-foreground'>
                          {item.label}:
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>{item.detail}</span>
                          {customizingProgress > idx * 25 && (
                            <Check className='w-5 h-5 text-primary' />
                          )}
                        </div>
                      </div>
                      <div className='h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-primary transition-all duration-300'
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, (customizingProgress - idx * 25) * 4)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 13: Timeline */}
            {step === 13 && (
              <div className='space-y-8'>
                <h2 className='text-3xl font-bold text-center'>
                  See what's ahead
                </h2>

                <div className='space-y-6 py-4'>
                  {[
                    {
                      icon: '●',
                      title: `Today – ${new Date().toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })} – ${form.current_weight_kg} kg`,
                      desc: `You want to lose ${(
                        form.current_weight_kg - form.goal_weight_kg
                      ).toFixed(0)} kg`,
                      color: 'text-primary',
                    },
                    {
                      icon: '●',
                      title: `In 1 week – ${new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })} – ${(
                        form.current_weight_kg - form.weekly_goal_kg
                      ).toFixed(0)} kg`,
                      desc: "You'll see your first results — around 1 kg down. This is the first win that comes from fixing habits and building a healthier relationship with food",
                      color: 'text-primary',
                    },
                    {
                      icon: '🎯',
                      title: `In ${Math.ceil(
                        (form.current_weight_kg - form.goal_weight_kg) /
                          form.weekly_goal_kg /
                          4
                      )} months – ${new Date(
                        Date.now() +
                          calculateTimeToGoal() * 7 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })} – ${form.goal_weight_kg} kg`,
                      desc: `You'll reach your goal of losing ${(
                        form.current_weight_kg - form.goal_weight_kg
                      ).toFixed(
                        0
                      )} kg. You'll feel better, more energetic, and proud of how far you've come.`,
                      color: 'text-primary',
                    },
                  ].map((milestone, idx) => (
                    <div key={idx} className='flex gap-4'>
                      <div className='flex flex-col items-center'>
                        <div
                          className={`text-2xl ${milestone.color} flex-shrink-0`}
                        >
                          {milestone.icon}
                        </div>
                        {idx < 2 && (
                          <div className='w-0.5 h-full bg-border mt-2' />
                        )}
                      </div>
                      <div className='flex-1 pb-6'>
                        <h3 className='font-semibold mb-2'>
                          {milestone.title}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          {milestone.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 14: Disclaimer */}
            {step === 14 && (
              <div className='space-y-8 text-center'>
                <Heart
                  className='w-24 h-24 mx-auto text-primary'
                  fill='currentColor'
                />

                <div className='space-y-4'>
                  <h2 className='text-3xl font-bold'>Guiding you with care</h2>

                  <p className='text-muted-foreground px-4'>
                    Welmi provides personalized eating recommendations, adapting
                    to your individual health profile and dietary needs.
                  </p>

                  <p className='text-sm text-muted-foreground px-4'>
                    However, our app is not a substitute for professional
                    medical advice. Before starting any new diet or if you have
                    any health concerns, always consult a qualified healthcare
                    professional.
                  </p>
                </div>

                <Button
                  onClick={submit}
                  disabled={loading}
                  className='w-full h-14 text-lg'
                >
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
