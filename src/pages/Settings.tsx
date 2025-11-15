import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    setProfile(data);
  };

  const toggleBurnedCalories = async () => {
    await supabase
      .from('profiles')
      .update({ add_burned_calories: !profile?.add_burned_calories })
      .eq('id', user?.id);
    loadProfile();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card border-b border-border">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-6" />
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-4">
            <button className="w-full flex items-center justify-between">
              <span className="font-medium">Customer Support</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          {/* Daily Goals */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-2">Daily Goals</h2>
            <Card className="divide-y">
              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Calories & macros</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.daily_calorie_goal || 1753} kcal</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Steps</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.daily_steps_goal || 9000} steps</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Hydration</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.daily_water_goal_ml || 3000} ml</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <div className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Add Burned Calories</span>
                <Switch 
                  checked={profile?.add_burned_calories || false}
                  onCheckedChange={toggleBurnedCalories}
                />
              </div>
            </Card>
          </div>

          {/* Plan */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-2">Plan</h2>
            <Card className="divide-y">
              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Weekly Goal</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">1 kg per week</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Activity Level</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.activity_level || 'Inactive'}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Current Weight</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.current_weight_kg || 93} kg</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Goal Weight</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.goal_weight_kg || 80} kg</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            </Card>
          </div>

          {/* Personalization */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-2">Personalization</h2>
            <Card className="divide-y">
              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Gender</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.gender || 'Male'}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Age</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.age || 24}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Height</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{profile?.height_cm || 170} cm</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            </Card>
          </div>

          <Button 
            variant="destructive" 
            className="w-full"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
