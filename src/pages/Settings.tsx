import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

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

  const updateProfile = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Updated successfully',
        description: 'Your profile has been updated.',
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
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
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Calories & macros</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.daily_calorie_goal || 1753} kcal</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Daily Calorie Goal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calories">Calories (kcal)</Label>
                      <Input
                        id="calories"
                        type="number"
                        defaultValue={profile?.daily_calorie_goal}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value && value !== profile?.daily_calorie_goal) {
                            updateProfile({ daily_calorie_goal: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Steps</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.daily_steps_goal || 9000} steps</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Daily Steps Goal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="steps">Steps</Label>
                      <Input
                        id="steps"
                        type="number"
                        defaultValue={profile?.daily_steps_goal}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value && value !== profile?.daily_steps_goal) {
                            updateProfile({ daily_steps_goal: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Hydration</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.daily_water_goal_ml || 3000} ml</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Daily Water Goal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="water">Water (ml)</Label>
                      <Input
                        id="water"
                        type="number"
                        defaultValue={profile?.daily_water_goal_ml}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value && value !== profile?.daily_water_goal_ml) {
                            updateProfile({ daily_water_goal_ml: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
              <div className="w-full flex items-center justify-between p-4">
                <span className="font-medium">Weekly Goal</span>
                <span className="text-muted-foreground">1 kg per week</span>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Activity Level</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.activity_level || 'Inactive'}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Activity Level</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="activity">Activity Level</Label>
                      <Select
                        defaultValue={profile?.activity_level}
                        onValueChange={(value) => updateProfile({ activity_level: value })}
                      >
                        <SelectTrigger id="activity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Light">Light</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Very Active">Very Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Current Weight</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.current_weight_kg || 93} kg</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Current Weight</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-weight">Weight (kg)</Label>
                      <Input
                        id="current-weight"
                        type="number"
                        step="0.1"
                        defaultValue={profile?.current_weight_kg}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value && value !== profile?.current_weight_kg) {
                            updateProfile({ current_weight_kg: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Goal Weight</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.goal_weight_kg || 80} kg</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Goal Weight</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="goal-weight">Weight (kg)</Label>
                      <Input
                        id="goal-weight"
                        type="number"
                        step="0.1"
                        defaultValue={profile?.goal_weight_kg}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value && value !== profile?.goal_weight_kg) {
                            updateProfile({ goal_weight_kg: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </div>

          {/* Personalization */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-2">Personalization</h2>
            <Card className="divide-y">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Gender</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.gender || 'Male'}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gender</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        defaultValue={profile?.gender}
                        onValueChange={(value) => updateProfile({ gender: value })}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Age</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.age || 24}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Age</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="age">Age (years)</Label>
                      <Input
                        id="age"
                        type="number"
                        defaultValue={profile?.age}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value && value !== profile?.age) {
                            updateProfile({ age: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4">
                    <span className="font-medium">Height</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{profile?.height_cm || 170} cm</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Height</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        defaultValue={profile?.height_cm}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value && value !== profile?.height_cm) {
                            updateProfile({ height_cm: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
