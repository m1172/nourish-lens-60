import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ThumbsUp, Heart, Check } from 'lucide-react';
import { Picker, RulerPicker } from '@/components/ui/picker';
import CustomizingStep from '@/components/onboarding/CustomizingStep';

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
    goal_weight_kg: 70,
    activity_level: '',
    weekly_goal_kg: 0.5,
    daily_calorie_goal: 2000,
    daily_steps_goal: 10000,
    daily_water_goal_ml: 2000,
    add_burned_calories: false,
    health_conditions: [] as string[],
    program_steps: [] as string[],
  });

  const [progressCheckDay, setProgressCheckDay] = useState(7);

  const totalSteps = 19; // Updated to include new steps
  const progress = ((step + 1) / totalSteps) * 100;

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Support graph animation refs & helpers (Step 2)
  const withRef = useRef<SVGPathElement | null>(null);
  const withoutRef = useRef<SVGPathElement | null>(null);
  const [graphAnimating, setGraphAnimating] = useState(false);

  const getGraphPaths = (goal: string) => {
    // Returns two path strings (with nutritionist, on your own) tuned per goal
    switch (goal) {
      case 'Lose weight':
        return {
          withPath: 'M 20 150 Q 100 180, 150 100 T 380 40',
          withoutPath: 'M 20 150 Q 120 160, 200 140 T 380 120',
        };
      case 'Get healthier':
        return {
          withPath: 'M 20 150 Q 140 140, 250 110 T 380 60',
          withoutPath: 'M 20 150 Q 120 160, 200 140 T 380 120',
        };
      case 'Look better':
      case 'Have more energy':
      default:
        return {
          withPath: 'M 20 150 Q 110 160, 200 120 T 380 80',
          withoutPath: 'M 20 150 Q 110 170, 200 150 T 380 120',
        };
    }
  };

  // Animate the SVG paths when entering step 2 (staggered, slower reveal)
  useEffect(() => {
    let rafId1: number | null = null;
    let rafId2: number | null = null;
    if (step === 2) {
      const w = withRef.current;
      const wo = withoutRef.current;

      // Ensure path strokeDasharray is set
      if (w) {
        const len = w.getTotalLength();
        w.style.strokeDasharray = String(len);
        w.style.strokeDashoffset = String(len);
      }
      if (wo) {
        const len = wo.getTotalLength();
        wo.style.strokeDasharray = String(len);
        wo.style.strokeDashoffset = String(len);
      }

      setGraphAnimating(true);

      const duration1 = 1400; // ms (with nutritionist - faster)
      const duration2 = 2600; // ms (on your own - slower)
      const delay1 = 200;
      const delay2 = 600;
      const start = performance.now();

      const animate1 = (t: number) => {
        if (!w) return;
        const elapsed = t - start - delay1;
        const progress = Math.min(1, Math.max(0, elapsed / duration1));
        const len = w.getTotalLength();
        w.style.strokeDashoffset = String(len * (1 - progress));
        if (progress < 1) rafId1 = requestAnimationFrame(animate1);
      };

      const animate2 = (t: number) => {
        if (!wo) return;
        const elapsed = t - start - delay2;
        const progress = Math.min(1, Math.max(0, elapsed / duration2));
        const len = wo.getTotalLength();
        wo.style.strokeDashoffset = String(len * (1 - progress));
        if (progress < 1) rafId2 = requestAnimationFrame(animate2);
        else setGraphAnimating(false);
      };

      rafId1 = requestAnimationFrame(animate1);
      rafId2 = requestAnimationFrame(animate2);
    }

    return () => {
      if (rafId1) cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      setGraphAnimating(false);
    };
    // we intentionally depend on step and goal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.goal]);

  const calculateCalories = (weeklyGoal: number) => {
    const baseBmr = calculateBMR();
    const activityFactor = getActivityFactor(form.activity_level);
    const tdee = baseBmr * activityFactor || 2000;

    if (weeklyGoal <= 0) {
      return Math.round(tdee);
    }

    const rawDeficit = (weeklyGoal * 7700) / 7; // 7700 kcal / kg
    const maxDeficit = Math.min(tdee * 0.25, 1000); // cap at 25% of TDEE or 1000 cal max
    const safeDeficit = Math.min(rawDeficit, maxDeficit);
    const targetCalories = tdee - safeDeficit;

    // Gender-specific minimum calories
    const minCalories = form.gender === 'Female' ? 1200 : 1500;
    return Math.max(minCalories, Math.round(targetCalories));
  };

  const calculateBMR = () => {
    // Mifflin-St Jeor
    const weight = form.current_weight_kg || 70;
    const height = form.height_cm || 170;
    const age = form.age || 30;
    const gender = form.gender || 'Male';

    const s = gender === 'Male' ? 5 : -161;
    return 10 * weight + 6.25 * height - 5 * age + s;
  };

  const getActivityFactor = (level: string) => {
    switch (level) {
      case 'Mostly inactive':
        return 1.2;
      case 'Lightly active':
        return 1.375;
      case 'Active':
        return 1.55;
      case 'Very active':
        return 1.725;
      default:
        return 1.2;
    }
  };

  const getSafeWeeklyGoalMax = () => {
    // Estimate safe max weekly loss based on TDEE and a 25% max deficit
    const baseBmr = calculateBMR();
    const activityFactor = getActivityFactor(form.activity_level);
    const tdee = baseBmr * activityFactor || 2000;
    const maxDailyDeficit = tdee * 0.5;
    const maxWeeklyKg = (maxDailyDeficit * 7) / 7700;
    const baseMax = Math.max(0.1, Math.min(1.5, maxWeeklyKg));
    return Number(baseMax.toFixed(1));
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    if (!heightInMeters) return 0;
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

  const calculateTimeToGoal = () => {
    const totalWeightLoss = Math.max(
      0,
      form.current_weight_kg - form.goal_weight_kg
    );
    if (totalWeightLoss === 0 || form.weekly_goal_kg <= 0) return 0;
    return Math.ceil(totalWeightLoss / form.weekly_goal_kg);
  };

  const canContinue = () => {
    switch (step) {
      case 1: // goal
        return !!form.goal;
      case 3: // gender
        return !!form.gender;
      case 4: // age
        return form.age >= 18 && form.age <= 100;
      case 5: // height
        return form.height_cm >= 120 && form.height_cm <= 230;
      case 6: // current weight
        return form.current_weight_kg >= 40 && form.current_weight_kg <= 250;
      case 7: // activity level
        return !!form.activity_level;
      case 9: // target weight
        return (
          form.goal_weight_kg > 0 &&
          form.goal_weight_kg < form.current_weight_kg
        );

      default:
        return true;
    }
  };

  const targetWeightBMI = calculateBMI(form.goal_weight_kg, form.height_cm);
  const isTargetHealthy = targetWeightBMI >= 18.5 && targetWeightBMI <= 24.9;
  const healthyRange = getHealthyWeightRange(form.height_cm);
  const maxRecommendedWeeklyLoss = getSafeWeeklyGoalMax();
  const isWeeklyGoalAggressive = form.weekly_goal_kg > maxRecommendedWeeklyLoss;
  const isWeeklyGoalValid = form.weekly_goal_kg > 0 && !isWeeklyGoalAggressive;

  // ---------- Effects ----------

  // When weekly_goal_kg changes, keep daily_calorie_goal in sync
  useEffect(() => {
    const newCalories = calculateCalories(form.weekly_goal_kg);
    setForm((prev) => ({
      ...prev,
      daily_calorie_goal: newCalories,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.weekly_goal_kg,
    form.gender,
    form.age,
    form.height_cm,
    form.current_weight_kg,
    form.activity_level,
  ]);

  // Auto-adjust water goal when weight changes (simple heuristic)
  useEffect(() => {
    if (form.current_weight_kg > 0) {
      const ml = Math.round(form.current_weight_kg * 30); // 30 ml / kg
      setForm((prev) => ({
        ...prev,
        daily_water_goal_ml: ml,
      }));
    }
  }, [form.current_weight_kg]);

  const submit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in or create an account to continue.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

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

      const dailyCalories = calculateCalories(form.weekly_goal_kg);

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        gender: genderMap[form.gender],
        age: form.age,
        height_cm: form.height_cm,
        current_weight_kg: form.current_weight_kg,
        starting_weight_kg: form.current_weight_kg,
        goal_weight_kg: form.goal_weight_kg,
        activity_level: activityMap[form.activity_level] || 'inactive',
        daily_calorie_goal: dailyCalories,
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

  // ---------- UI ----------

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
          className='p-2 mt-2 ml-2 hover:bg-muted transition-colors z-10'
        >
          <ArrowLeft className='w-6 h-6' />
        </button>
      )}

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='min-h-full flex items-center justify-center p-4'>
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
                    onClick={() => {
                      console.log('Navigating to /auth');
                      navigate('/auth');
                    }}
                    className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                  >
                    I already have an account{' '}
                    <span className='font-semibold text-primary underline'>
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

                    {/* Render goal-aware paths */}
                    {(() => {
                      const { withPath, withoutPath } = getGraphPaths(
                        form.goal
                      );
                      return (
                        <>
                          <path
                            ref={withRef}
                            d={withPath}
                            fill='none'
                            stroke='hsl(var(--primary))'
                            strokeWidth='3'
                            strokeLinecap='round'
                            style={{ transition: 'stroke-opacity 200ms' }}
                          />

                          {/* endpoint marker for 'with' */}
                          <circle
                            cx='380'
                            cy='40'
                            r='5'
                            fill='hsl(var(--primary))'
                          />
                          <text
                            x='280'
                            y='30'
                            className='text-xs font-medium fill-primary'
                          >
                            With a nutritionist
                          </text>

                          <path
                            ref={withoutRef}
                            d={withoutPath}
                            fill='none'
                            stroke='hsl(var(--muted-foreground))'
                            strokeWidth='2'
                            opacity='0.6'
                            strokeLinecap='round'
                            style={{ transition: 'stroke-opacity 200ms' }}
                          />

                          {/* endpoint marker for 'without' */}
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
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <p className='text-center text-sm text-muted-foreground px-4'>
                  {form.goal === 'Lose weight' ? (
                    <>
                      A nutritionist helps you lose weight faster and more
                      safely — we'll tailor your plan to your profile.
                    </>
                  ) : (
                    <>
                      Personalized support keeps you consistent and helps you
                      build lasting habits.
                    </>
                  )}
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
                  <Picker
                    value={form.age}
                    onChange={(age) => setForm({ ...form, age })}
                    min={18}
                    max={100}
                  />
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
                  <div className='flex gap-2 mb-8'>
                    <button className='px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/30 transition-all'>
                      cm
                    </button>
                  </div>

                  <Picker
                    value={form.height_cm}
                    onChange={(height_cm) => setForm({ ...form, height_cm })}
                    min={140}
                    max={220}
                    unit='cm'
                  />
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

            {/* Step 6: Current weight */}
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
                  <div className='flex gap-2 mb-8'>
                    <button className='px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/30 transition-all'>
                      kg
                    </button>
                    <button className='px-6 py-2 rounded-full bg-secondary text-muted-foreground font-medium hover:bg-secondary/80 transition-all'>
                      lbs
                    </button>
                  </div>

                  <RulerPicker
                    value={form.current_weight_kg}
                    onChange={(current_weight_kg) =>
                      setForm((prev) => ({
                        ...prev,
                        current_weight_kg,
                        goal_weight_kg: Math.min(
                          prev.goal_weight_kg,
                          current_weight_kg
                        ),
                      }))
                    }
                    min={40}
                    max={200}
                    unit='kg'
                    step={0.1}
                  />
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

            {/* Step 7: Activity level */}
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
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
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

            {/* Step 9: Target Weight */}
            {step === 9 && (
              <div className='space-y-4'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    What's your target weight?
                  </h2>
                  <p className='text-muted-foreground'>
                    Let's set a goal you can achieve
                  </p>
                </div>

                <div className='flex flex-col items-center justify-center '>
                  <div className='mb-4 text-right w-full flex justify-end px-8'>
                    <div className='text-sm text-muted-foreground flex items-center gap-2'>
                      <span>Current: </span>
                      <span className='text-xl font-bold text-primary'>
                        {form.current_weight_kg} kg
                      </span>
                    </div>
                  </div>

                  <RulerPicker
                    value={form.goal_weight_kg}
                    onChange={(goal_weight_kg) =>
                      setForm({ ...form, goal_weight_kg })
                    }
                    min={Math.max(40, form.current_weight_kg - 50)}
                    max={form.current_weight_kg}
                    unit='kg'
                    step={0.1}
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
              <div className='space-y-4'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    Pick a pace that works for you
                  </h2>
                </div>

                <div className='flex flex-col items-center justify-center'>
                  <p className='text-muted-foreground mb-4'>
                    Expected progress per week
                  </p>

                  <div className='text-7xl font-bold mb-2'>
                    {form.weekly_goal_kg.toFixed(1)}
                    <span className='text-3xl text-muted-foreground ml-2'>
                      kg
                    </span>
                  </div>

                  <p className='text-xs text-muted-foreground mb-2'>
                    Recommended max for you:{' '}
                    {maxRecommendedWeeklyLoss.toFixed(1)} kg/week
                  </p>

                  <div className='w-full max-w-xs relative mb-2'>
                    <input
                      type='range'
                      min='1'
                      max='12'
                      step='1'
                      value={Math.round(form.weekly_goal_kg * 10)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setForm({
                          ...form,
                          weekly_goal_kg: val / 10,
                        });
                      }}
                      className='w-full accent-primary'
                    />
                    <div className='flex justify-between text-xs text-muted-foreground mt-2'>
                      <span>Easy</span>
                      <span>Balanced</span>
                      <span>Strict</span>
                    </div>
                  </div>

                  {isWeeklyGoalAggressive && (
                    <p className='text-xs text-orange-600 text-center mt-2 px-4'>
                      This pace is quite aggressive for your profile. Try
                      lowering the slider closer to{' '}
                      {maxRecommendedWeeklyLoss.toFixed(1)} kg/week for safer,
                      more sustainable progress.
                    </p>
                  )}
                </div>

                <div className='p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex gap-3'>
                  <Check className='w-6 h-6 text-green-500 flex-shrink-0' />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-green-600 mb-1'>
                      {calculateTimeToGoal() > 0 ? (
                        <>
                          Reach your goal by{' '}
                          {new Date(
                            Date.now() +
                              calculateTimeToGoal() * 7 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </>
                      ) : (
                        'You are already very close to your goal'
                      )}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Daily calorie goal –{' '}
                      {calculateCalories(form.weekly_goal_kg)} kcal. It's
                      balanced, sustainable, and supports your long-term success
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
              <CustomizingStep
                items={[
                  {
                    label: 'Analyzing profile',
                    detail: `${form.height_cm} cm, ${form.current_weight_kg} kg`,
                  },
                  {
                    label: 'Metabolism Insights',
                    detail: `${calculateCalories(form.weekly_goal_kg)} kcal`,
                  },
                  { label: 'Generating meal plan', detail: 'Balanced' },
                  {
                    label: 'Health condition',
                    detail:
                      form.health_conditions.length > 0
                        ? 'Taken into account'
                        : 'None',
                  },
                ]}
                onComplete={() => next()}
              />
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
                      title: `In ${Math.max(
                        1,
                        Math.ceil(
                          (form.current_weight_kg - form.goal_weight_kg) /
                            (form.weekly_goal_kg || 0.1) /
                            4
                        )
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

            {/* Step 14: Health Permission */}
            {step === 14 && (
              <div className='space-y-8 text-center'>
                <div className='space-y-6'>
                  {/* App Icon */}
                  <div className='flex justify-center mb-8'>
                    <div className='w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg'>
                      <Heart className='w-12 h-12 text-white' fill='white' />
                    </div>
                  </div>

                  {/* Icons Row */}
                  <div className='flex justify-center gap-8 mb-6'>
                    <div className='flex flex-col items-center gap-2'>
                      <div className='w-16 h-16 rounded-2xl bg-card border-2 border-border flex items-center justify-center'>
                        <span className='text-3xl'>👟</span>
                      </div>
                    </div>
                    <div className='flex flex-col items-center gap-2 opacity-50'>
                      <div className='w-4 h-4 rounded-full bg-border' />
                      <div className='w-4 h-4 rounded-full bg-border' />
                      <div className='w-4 h-4 rounded-full bg-border' />
                    </div>
                    <div className='flex flex-col items-center gap-2'>
                      <div className='w-16 h-16 rounded-2xl bg-card border-2 border-border flex items-center justify-center'>
                        <span className='text-3xl'>🥗</span>
                      </div>
                    </div>
                    <div className='flex flex-col items-center gap-2 opacity-50'>
                      <div className='w-4 h-4 rounded-full bg-border' />
                      <div className='w-4 h-4 rounded-full bg-border' />
                      <div className='w-4 h-4 rounded-full bg-border' />
                    </div>
                    <div className='flex flex-col items-center gap-2'>
                      <div className='w-16 h-16 rounded-2xl bg-card border-2 border-border flex items-center justify-center'>
                        <span className='text-3xl'>💧</span>
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className='mb-8'>
                    <div className='w-24 h-24 mx-auto rounded-3xl bg-card border-2 border-border flex items-center justify-center'>
                      <div className='text-3xl font-bold'>
                        Wel<span className='text-primary'>mi</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h2 className='text-3xl font-bold'>
                    Connect to Apple Health
                  </h2>
                  <p className='text-muted-foreground px-4'>
                    Sync your daily activity between Welmi and Apple Health to
                    have the most reliable data
                  </p>
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 15: Burned Calories */}
            {step === 15 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    Let Welmi update your calorie tracker for you
                  </h2>
                </div>

                {/* Activity Cards */}
                <div className='relative h-[400px]'>
                  {/* Walking Card */}
                  <div className='absolute top-0 left-8 w-48 bg-card border-2 border-border rounded-3xl p-6 shadow-lg z-20'>
                    <div className='space-y-4'>
                      <div className='w-20 h-20 bg-background rounded-2xl flex items-center justify-center'>
                        <span className='text-4xl'>👟</span>
                      </div>
                    </div>
                  </div>

                  {/* Walking Calories Bubble */}
                  <div className='absolute top-0 right-4 bg-card border-2 border-border rounded-3xl p-6 shadow-lg z-30'>
                    <div className='text-center space-y-2'>
                      <div className='text-primary text-3xl'>🔥</div>
                      <div className='text-muted-foreground text-sm'>
                        Walking
                      </div>
                      <div className='text-2xl font-bold'>+400 cals</div>
                    </div>
                  </div>

                  {/* Gym Card */}
                  <div className='absolute bottom-8 right-8 w-56 bg-card border-2 border-border rounded-3xl p-6 shadow-lg z-20'>
                    <div className='space-y-4'>
                      <div className='w-24 h-24 bg-background rounded-2xl flex items-center justify-center'>
                        <span className='text-5xl'>🏋️</span>
                      </div>
                    </div>
                  </div>

                  {/* Gym Calories Bubble */}
                  <div className='absolute bottom-0 left-4 bg-card border-2 border-border rounded-3xl p-6 shadow-lg z-30'>
                    <div className='text-center space-y-2'>
                      <div className='text-primary text-3xl'>🔥</div>
                      <div className='text-muted-foreground text-sm'>Gym</div>
                      <div className='text-2xl font-bold'>+200 cals</div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className='flex gap-4'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setForm({ ...form, add_burned_calories: false });
                      next();
                    }}
                    className='flex-1 h-14 text-lg'
                  >
                    No
                  </Button>
                  <Button
                    onClick={() => {
                      setForm({ ...form, add_burned_calories: true });
                      next();
                    }}
                    className='flex-1 h-14 text-lg'
                  >
                    Yes
                  </Button>
                </div>
              </div>
            )}

            {/* Step 16: Progress Check Day */}
            {step === 16 && (
              <div className='space-y-8'>
                <div className='text-center'>
                  <h2 className='text-3xl font-bold mb-2'>
                    Set your first progress check day
                  </h2>
                  <p className='text-muted-foreground'>
                    We'll use your weigh-in to track your progress and make
                    adjustments for you if needed
                  </p>
                </div>

                {/* Day Picker */}
                <div className='py-8'>
                  <Picker
                    min={5}
                    max={13}
                    value={progressCheckDay}
                    onChange={setProgressCheckDay}
                    unit='days'
                  />
                </div>

                {/* Expected Drop Info */}
                <div className='bg-card border-2 border-primary/20 rounded-2xl p-6'>
                  <div className='flex items-start gap-4'>
                    <div className='w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5'>
                      <Check className='w-4 h-4 text-white' />
                    </div>
                    <div className='space-y-2'>
                      <h3 className='font-semibold text-lg'>
                        Expected drop: {form.weekly_goal_kg} kg
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        You will notice changes in how you feel as your body
                        adjusts to healthier habits. This is a normal response to
                        positive lifestyle changes.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={next} className='w-full h-14 text-lg'>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 17: Sign-in Options */}
            {step === 17 && (
              <div className='space-y-8 text-center'>
                {/* Background Food Images Grid (decorative) */}
                <div className='relative h-[300px] -mx-4 mb-8'>
                  <div className='absolute inset-0 grid grid-cols-2 gap-4 opacity-50'>
                    <div className='bg-card rounded-3xl' />
                    <div className='bg-card rounded-3xl' />
                    <div className='bg-card rounded-3xl' />
                    <div className='bg-card rounded-3xl' />
                  </div>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='bg-background/95 backdrop-blur-sm rounded-3xl p-8 max-w-sm'>
                      <h2 className='text-3xl font-bold mb-2'>
                        You're almost there!
                      </h2>
                      <p className='text-muted-foreground'>
                        Use your account to keep your personalization at your
                        fingertips
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <Button
                    variant='outline'
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'apple',
                          options: {
                            redirectTo: `${window.location.origin}/`,
                          },
                        });
                        if (error) throw error;
                      } catch (err) {
                        toast({
                          title: 'Error',
                          description: 'Apple sign-in not configured yet',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className='w-full h-14 text-lg'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
                    </svg>
                    Continue with Apple
                  </Button>

                  <Button
                    variant='outline'
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/`,
                          },
                        });
                        if (error) throw error;
                      } catch (err) {
                        toast({
                          title: 'Error',
                          description: 'Google sign-in not configured yet. Please configure in Lovable Cloud settings.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className='w-full h-14 text-lg'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      viewBox='0 0 24 24'
                    >
                      <path
                        fill='#4285F4'
                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      />
                      <path
                        fill='#34A853'
                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      />
                      <path
                        fill='#FBBC05'
                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      />
                      <path
                        fill='#EA4335'
                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <Button onClick={next} variant='ghost' className='w-full'>
                    Continue with Email
                  </Button>
                </div>
              </div>
            )}

            {/* Step 18: Disclaimer */}
            {step === 18 && (
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
