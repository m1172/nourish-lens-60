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

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    gender: '',
    age: '',
    height_cm: '',
    current_weight_kg: '',
    goal_weight_kg: '',
    activity_level: '',
    weekly_goal_kg: '1',
    daily_calorie_goal: '2000',
    daily_steps_goal: '10000',
    daily_water_goal_ml: '2000',
    add_burned_calories: false,
  });

  useEffect(() => {
    // nothing; this route is already guarded by OnboardingRoute
  }, []);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    if (!user) return;

    // Basic validation
    if (!form.gender || !form.age || !form.height_cm || !form.current_weight_kg || !form.goal_weight_kg || !form.activity_level) {
      toast({ title: 'Missing information', description: 'Please fill required fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Map UI values to DB values
      const genderMap: Record<string, string> = {
        'Male': 'male',
        'Female': 'female',
        'Other': 'other',
      };
      const activityMap: Record<string, string> = {
        'Inactive': 'inactive',
        'Light': 'lightly_active',
        'Moderate': 'moderately_active',
        'Active': 'very_active',
        'Very Active': 'extremely_active',
      };

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        gender: genderMap[form.gender] || 'other',
        age: parseInt(String(form.age)),
        height_cm: parseInt(String(form.height_cm)),
        current_weight_kg: parseFloat(String(form.current_weight_kg)),
        starting_weight_kg: parseFloat(String(form.current_weight_kg)),
        goal_weight_kg: parseFloat(String(form.goal_weight_kg)),
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

  // Full-screen modal/wizard layout — non-dismissible
  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Onboarding — Step {step} / 3</h2>
            <div className="text-sm text-muted-foreground">Please complete to continue</div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger>
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
                <Label>Age *</Label>
                <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>

              <div>
                <Label>Height (cm) *</Label>
                <Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
              </div>

              <div>
                <Label>Current weight (kg) *</Label>
                <Input type="number" step="0.1" value={form.current_weight_kg} onChange={(e) => setForm({ ...form, current_weight_kg: e.target.value })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Goal weight (kg) *</Label>
                <Input type="number" step="0.1" value={form.goal_weight_kg} onChange={(e) => setForm({ ...form, goal_weight_kg: e.target.value })} />
              </div>

              <div>
                <Label>Activity level *</Label>
                <Select value={form.activity_level} onValueChange={(v) => setForm({ ...form, activity_level: v })}>
                  <SelectTrigger>
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

              <div>
                <Label>Weekly goal (kg)</Label>
                <Input type="number" value={form.weekly_goal_kg} onChange={(e) => setForm({ ...form, weekly_goal_kg: e.target.value })} />
                <div className="text-xs text-muted-foreground">Default is 1 kg/week</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Daily calorie goal (kcal)</Label>
                <Input type="number" value={form.daily_calorie_goal} onChange={(e) => setForm({ ...form, daily_calorie_goal: e.target.value })} />
              </div>

              <div>
                <Label>Daily steps goal</Label>
                <Input type="number" value={form.daily_steps_goal} onChange={(e) => setForm({ ...form, daily_steps_goal: e.target.value })} />
              </div>

              <div>
                <Label>Daily water (ml)</Label>
                <Input type="number" value={form.daily_water_goal_ml} onChange={(e) => setForm({ ...form, daily_water_goal_ml: e.target.value })} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Add burned calories to budget</Label>
                <Switch checked={form.add_burned_calories} onCheckedChange={(v) => setForm({ ...form, add_burned_calories: v })} />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={back} className="mr-2">Back</Button>
              )}
            </div>
            <div className="flex-1 text-right">
              {step < 3 ? (
                <Button onClick={next}>Next</Button>
              ) : (
                <Button onClick={submit} disabled={loading}>{loading ? 'Saving...' : 'Submit'}</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
