import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
// BottomNav moved to App layout
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Progress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    setProfile(profileData);

    const { data: logsData } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('logged_at', { ascending: false })
      .limit(1);
    setWeightLogs(logsData || []);
  };

  const currentWeight =
    profile?.current_weight_kg || weightLogs[0]?.weight_kg || 0;
  const goalWeight = profile?.goal_weight_kg || 0;
  const startWeight = profile?.starting_weight_kg || currentWeight;

  const bmi =
    currentWeight && profile?.height_cm
      ? Number(
          (currentWeight / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
        )
      : 0;

  const bmiStatus =
    bmi < 18.5
      ? 'Underweight'
      : bmi < 25
      ? 'Normal'
      : bmi < 30
      ? 'Overweight'
      : 'Obese';
  const bmiColor =
    bmi < 18.5
      ? 'text-blue-500'
      : bmi < 25
      ? 'text-success'
      : bmi < 30
      ? 'text-accent'
      : 'text-destructive';

  return (
    <div className='min-h-screen bg-background pb-20'>
      <div className='max-w-screen-sm mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 bg-card border-b border-border'>
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className='h-6 w-6' />
          </button>
          <h1 className='text-lg font-semibold'>
            Last entry, {format(new Date(), 'dd MMMM')}
          </h1>
          <button onClick={() => navigate('/settings')}>
            <Settings className='h-6 w-6' />
          </button>
        </div>

        {/* Weight Progress Circle */}
        <div className='p-6'>
          <div className='flex items-center justify-center mb-6'>
            <div className='text-center mr-8'>
              <div className='text-2xl font-bold'>{startWeight} kg</div>
              <div className='text-sm text-muted-foreground'>Start</div>
            </div>

            <div className='relative w-48 h-48'>
              <svg className='w-full h-full -rotate-90'>
                <circle
                  cx='96'
                  cy='96'
                  r='88'
                  fill='none'
                  stroke='hsl(var(--muted))'
                  strokeWidth='12'
                />
                <circle
                  cx='96'
                  cy='96'
                  r='88'
                  fill='none'
                  stroke='hsl(var(--primary))'
                  strokeWidth='12'
                  strokeDasharray={`${
                    ((startWeight - currentWeight) /
                      (startWeight - goalWeight)) *
                    553
                  } 553`}
                  className='transition-all duration-500'
                />
              </svg>
              <div className='absolute inset-0 flex flex-col items-center justify-center'>
                <div className='text-4xl font-bold'>{currentWeight} kg</div>
                <div className='text-sm text-muted-foreground'>
                  Current weight
                </div>
              </div>
            </div>

            <div className='text-center ml-8'>
              <div className='text-2xl font-bold'>{goalWeight} kg</div>
              <div className='text-sm text-muted-foreground'>Goal</div>
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className='px-6 space-y-4'>
          <Card className='p-6'>
            <h2 className='text-xl font-bold mb-4'>Plan</h2>
            <p className='text-sm text-muted-foreground mb-4'>
              Your metabolism burns {profile?.daily_calorie_goal + 500 || 2253}{' '}
              kcal and your daily calorie goal is{' '}
              {profile?.daily_calorie_goal || 1753} kcal. With this 500 kcal
              deficit, you can expect to lose about 1 kg per week, reaching your
              goal by 23 November 2025
            </p>
            <p className='text-sm text-muted-foreground'>
              To stay on track, make sure to log your meals in your food diary
              every day
            </p>
          </Card>

          <Card className='p-6'>
            <div className='flex items-start justify-between mb-4'>
              <h2 className='text-xl font-bold'>Body Mass Index</h2>
              <span className={`text-sm font-medium ${bmiColor}`}>
                Need attention ⚖️
              </span>
            </div>

            <div className='text-4xl font-bold mb-4'>{bmi}</div>

            <div className='relative h-2 bg-muted rounded-full mb-2'>
              <div
                className='absolute h-full bg-gradient-to-r from-blue-500 via-success via-accent to-destructive rounded-full'
                style={{ width: '100%' }}
              />
              <div
                className='absolute w-1 h-4 bg-foreground rounded -top-1'
                style={{
                  left: `${Math.min(
                    Math.max(((Number(bmi) - 15) / 25) * 100, 0),
                    100
                  )}%`,
                }}
              />
            </div>

            <div className='flex justify-between text-xs text-muted-foreground mb-4'>
              <span>22</span>
              <span>25</span>
            </div>

            <p className='text-sm text-muted-foreground'>
              According to the World Health Organization, reducing BMI to the
              normal range lowers the risk of chronic diseases and improves
              overall well-being
            </p>
          </Card>

          <Button size='lg' className='w-full'>
            Log measurements
          </Button>
        </div>

        {/* BottomNav rendered globally in App.tsx */}
      </div>
    </div>
  );
}
