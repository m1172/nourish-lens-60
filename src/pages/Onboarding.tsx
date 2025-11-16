import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    height_cm: '',
    current_weight_kg: '',
    goal_weight_kg: '',
    activity_level: '',
    daily_calorie_goal: '2000',
    daily_steps_goal: '10000',
    daily_water_goal_ml: '2000',
    add_burned_calories: false,
  });

  useEffect(() => {
    checkExistingProfile();
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      // Profile exists, redirect to home
      navigate('/', { replace: true });
    } else {
      setCheckingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate required fields
    if (!formData.gender || !formData.age || !formData.height_cm || 
        !formData.current_weight_kg || !formData.goal_weight_kg || !formData.activity_level) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          gender: formData.gender,
          age: parseInt(formData.age),
          height_cm: parseInt(formData.height_cm),
          current_weight_kg: parseFloat(formData.current_weight_kg),
          starting_weight_kg: parseFloat(formData.current_weight_kg),
          goal_weight_kg: parseFloat(formData.goal_weight_kg),
          activity_level: formData.activity_level,
          daily_calorie_goal: parseInt(formData.daily_calorie_goal),
          daily_steps_goal: parseInt(formData.daily_steps_goal),
          daily_water_goal_ml: parseInt(formData.daily_water_goal_ml),
          add_burned_calories: formData.add_burned_calories,
        });

      if (error) throw error;

      toast({
        title: 'Profile created!',
        description: 'Welcome to your nutrition journey.',
      });

      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-screen-sm mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground">Let's set up your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personalization */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">About You</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="age">Age (years) *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="25"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                  placeholder="170"
                  min="50"
                  max="300"
                />
              </div>
            </div>
          </Card>

          {/* Weight Goals */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Weight Goals</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-weight">Current Weight (kg) *</Label>
                <Input
                  id="current-weight"
                  type="number"
                  step="0.1"
                  value={formData.current_weight_kg}
                  onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                  placeholder="70"
                  min="20"
                  max="500"
                />
              </div>

              <div>
                <Label htmlFor="goal-weight">Goal Weight (kg) *</Label>
                <Input
                  id="goal-weight"
                  type="number"
                  step="0.1"
                  value={formData.goal_weight_kg}
                  onChange={(e) => setFormData({ ...formData, goal_weight_kg: e.target.value })}
                  placeholder="65"
                  min="20"
                  max="500"
                />
              </div>

              <div>
                <Label htmlFor="activity">Activity Level *</Label>
                <Select value={formData.activity_level} onValueChange={(value) => setFormData({ ...formData, activity_level: value })}>
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Select activity level" />
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
          </Card>

          {/* Daily Goals */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Daily Goals</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calories">Daily Calories (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.daily_calorie_goal}
                  onChange={(e) => setFormData({ ...formData, daily_calorie_goal: e.target.value })}
                  placeholder="2000"
                  min="500"
                  max="10000"
                />
              </div>

              <div>
                <Label htmlFor="steps">Daily Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  value={formData.daily_steps_goal}
                  onChange={(e) => setFormData({ ...formData, daily_steps_goal: e.target.value })}
                  placeholder="10000"
                  min="0"
                  max="100000"
                />
              </div>

              <div>
                <Label htmlFor="water">Daily Water (ml)</Label>
                <Input
                  id="water"
                  type="number"
                  value={formData.daily_water_goal_ml}
                  onChange={(e) => setFormData({ ...formData, daily_water_goal_ml: e.target.value })}
                  placeholder="2000"
                  min="0"
                  max="10000"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="burned-calories" className="font-normal">
                  Add burned calories to budget
                </Label>
                <Switch
                  id="burned-calories"
                  checked={formData.add_burned_calories}
                  onCheckedChange={(checked) => setFormData({ ...formData, add_burned_calories: checked })}
                />
              </div>
            </div>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Profile...' : 'Get Started'}
          </Button>
        </form>
      </div>
    </div>
  );
}
