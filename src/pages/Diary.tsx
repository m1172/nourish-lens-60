import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
// BottomNav moved to App layout
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Flame,
  Wheat,
  Drumstick,
  Droplet,
  Footprints,
  CheckCircle2,
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Diary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [profile, setProfile] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
    steps: 0,
  });
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadDailyData();
    }
  }, [user, currentDate]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    setProfile(data);
  };

  const loadDailyData = async () => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Load meals for the day
    const { data: mealsData } = await supabase
      .from('meals')
      .select(
        `
        *,
        meal_items (
          calories,
          protein,
          carbs,
          fats
        )
      `
      )
      .eq('user_id', user?.id)
      .gte('logged_at', dayStart.toISOString())
      .lt('logged_at', dayEnd.toISOString())
      .order('logged_at', { ascending: false });

    setMeals(mealsData || []);

    // Calculate totals
    const totals = (mealsData || []).reduce(
      (acc, meal) => {
        meal.meal_items?.forEach((item: any) => {
          acc.calories += item.calories || 0;
          acc.protein += item.protein || 0;
          acc.carbs += item.carbs || 0;
          acc.fats += item.fats || 0;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Load water logs
    const { data: waterData } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user?.id)
      .gte('logged_at', dayStart.toISOString())
      .lt('logged_at', dayEnd.toISOString());

    const totalWater =
      waterData?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;

    // Load step logs
    const { data: stepsData } = await supabase
      .from('step_logs')
      .select('steps')
      .eq('user_id', user?.id)
      .gte('logged_at', dayStart.toISOString())
      .lt('logged_at', dayEnd.toISOString());

    const totalSteps = stepsData?.reduce((sum, log) => sum + log.steps, 0) || 0;

    setDailyStats({
      ...totals,
      water: totalWater,
      steps: totalSteps,
    });
  };

  const caloriesLeft =
    (profile?.daily_calorie_goal || 2000) - dailyStats.calories;
  const stepsGoal = profile?.daily_steps_goal || 10000;
  const waterGoal = profile?.daily_water_goal_ml || 3000;
  const stepsProgress = Math.min((dailyStats.steps / stepsGoal) * 100, 100);
  const waterProgress = Math.min((dailyStats.water / waterGoal) * 100, 100);

  const addWater = async (amount: number) => {
    await supabase.from('water_logs').insert({
      user_id: user?.id,
      amount_ml: amount,
      logged_at: new Date().toISOString(),
    });
    loadDailyData();
  };

  return (
    <div className='min-h-screen bg-background pb-20'>
      <div className='max-w-screen-sm mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 bg-card border-b border-border'>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
              )
            }
          >
            <ChevronLeft className='h-6 w-6' />
          </button>
          <h1 className='text-lg font-semibold'>
            {format(currentDate, 'dd MMMM')}
          </h1>
          <button onClick={() => navigate('/settings')}>
            <Settings className='h-6 w-6' />
          </button>
        </div>

        {/* Main Circle */}
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='text-center flex-1'>
              <div className='text-2xl font-bold'>{dailyStats.calories}</div>
              <div className='text-sm text-muted-foreground'>Eaten</div>
            </div>

            <div className='relative w-48 h-48 mx-4'>
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
                    (dailyStats.calories /
                      (profile?.daily_calorie_goal || 2000)) *
                    553
                  } 553`}
                  className='transition-all duration-500'
                />
              </svg>
              <div className='absolute inset-0 flex flex-col items-center justify-center'>
                <div className='text-4xl font-bold'>
                  {Math.max(0, caloriesLeft)}
                </div>
                <div className='text-sm text-muted-foreground'>kcal left</div>
              </div>
            </div>

            <div className='text-center flex-1'>
              <div className='text-2xl font-bold'>563</div>
              <div className='text-sm text-muted-foreground'>Burned</div>
            </div>
          </div>

          {/* Macros */}
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Wheat className='h-4 w-4 text-nutrition-carbs' />
                <span className='text-sm font-medium'>Carbs</span>
              </div>
              <div className='text-lg font-bold'>
                {Math.round(dailyStats.carbs)} /{' '}
                {profile?.daily_carbs_goal || 175}
              </div>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Drumstick className='h-4 w-4 text-nutrition-protein' />
                <span className='text-sm font-medium'>Protein</span>
              </div>
              <div className='text-lg font-bold'>
                {Math.round(dailyStats.protein)} /{' '}
                {profile?.daily_protein_goal || 131}
              </div>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Droplet className='h-4 w-4 text-nutrition-fats' />
                <span className='text-sm font-medium'>Fats</span>
              </div>
              <div className='text-lg font-bold'>
                {Math.round(dailyStats.fats)} / {profile?.daily_fats_goal || 58}
              </div>
            </div>
          </div>

          {/* Steps and Water */}
          <div className='grid grid-cols-2 gap-3'>
            <Card className='p-4 bg-success/10'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <Footprints className='h-5 w-5 text-nutrition-steps' />
                  <span className='font-medium'>Steps</span>
                </div>
                {stepsProgress >= 100 && (
                  <CheckCircle2 className='h-5 w-5 text-success' />
                )}
              </div>
              <div className='text-lg font-bold'>
                {dailyStats.steps.toLocaleString()} /{' '}
                {stepsGoal.toLocaleString()}
              </div>
            </Card>

            <Card className='p-4 bg-water/10'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <Droplet className='h-5 w-5 text-nutrition-water fill-nutrition-water' />
                  <span className='font-medium'>Water</span>
                </div>
                <button onClick={() => addWater(250)}>
                  <Plus className='h-5 w-5 text-nutrition-water' />
                </button>
              </div>
              <div className='text-lg font-bold'>
                {dailyStats.water} / {waterGoal}
              </div>
            </Card>
          </div>
        </div>

        {/* Journal */}
        <div className='px-6'>
          <h2 className='text-xl font-bold mb-4'>Journal</h2>

          {meals.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <p>No meals logged yet today</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {meals.map((meal) => (
                <Card key={meal.id} className='p-4'>
                  <div className='flex items-center gap-3'>
                    {meal.photo_url && (
                      <img
                        src={meal.photo_url}
                        alt={meal.name}
                        className='w-16 h-16 rounded-lg object-cover'
                      />
                    )}
                    <div className='flex-1'>
                      <h3 className='font-medium'>{meal.name || 'Meal'}</h3>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <span className='flex items-center gap-1'>
                          <Flame className='h-3 w-3' />
                          {meal.meal_items?.reduce(
                            (sum: number, item: any) =>
                              sum + (item.calories || 0),
                            0
                          )}{' '}
                          kcal
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Meal Button */}
        <div className='fixed bottom-20 right-4 z-40'>
          <Button
            size='lg'
            className='rounded-full shadow-lg h-14 px-6'
            onClick={() => navigate('/add')}
          >
            <Plus className='h-5 w-5 mr-2' />
            Log first meal
          </Button>
        </div>

        {/* BottomNav rendered globally in App.tsx */}
      </div>
    </div>
  );
}
