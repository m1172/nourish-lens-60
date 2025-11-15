import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

type SuggestedItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function AddPhoto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSuggestions([]);
  };

  const uploadAndAnalyze = async () => {
    if (!file || !user) return;
    setLoading(true);

    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('meal-photos')
        .getPublicUrl(filePath);

      const imageUrl = publicData.publicUrl;

      const { data, error } = await supabase.functions.invoke('food-from-image', {
        body: { imageUrl },
      });

      if (error) throw error;

      setSuggestions(data.items || []);
      
      if (!data.items || data.items.length === 0) {
        toast({
          title: "No food detected",
          description: "Try taking a clearer photo of your meal",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message ?? "Failed to analyze image",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof SuggestedItem, value: number) => {
    setSuggestions(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const saveMeal = async () => {
    if (!user || suggestions.length === 0) return;

    try {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: 'Photo meal',
          logged_at: new Date().toISOString(),
          photo_url: preview,
        })
        .select('*')
        .single();

      if (mealError) throw mealError;

      const itemsPayload = suggestions.map(s => ({
        meal_id: meal.id,
        calories: s.calories,
        protein: s.protein,
        carbs: s.carbs,
        fats: s.fats,
        quantity: s.grams,
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Meal saved to your diary",
      });
      
      navigate('/');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-sm mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Log with Photo</h1>

        <label className="block">
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            id="photo-input"
          />
          <Button
            variant="outline"
            className="w-full h-48 border-2 border-dashed"
            onClick={() => document.getElementById('photo-input')?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Camera className="h-8 w-8" />
              <span>{preview ? 'Change Photo' : 'Take or Upload Photo'}</span>
            </div>
          </Button>
        </label>

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-full rounded-xl object-cover max-h-64"
          />
        )}

        <Button
          disabled={!file || loading}
          onClick={uploadAndAnalyze}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Photo'
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Detected Foods</h2>
            {suggestions.map((item, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{item.name}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-muted-foreground">Grams</label>
                    <Input
                      type="number"
                      value={item.grams}
                      onChange={(e) => updateItem(idx, 'grams', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Calories</label>
                    <Input
                      type="number"
                      value={item.calories}
                      onChange={(e) => updateItem(idx, 'calories', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Protein (g)</label>
                    <Input
                      type="number"
                      value={item.protein}
                      onChange={(e) => updateItem(idx, 'protein', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Carbs (g)</label>
                    <Input
                      type="number"
                      value={item.carbs}
                      onChange={(e) => updateItem(idx, 'carbs', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Fats (g)</label>
                    <Input
                      type="number"
                      value={item.fats}
                      onChange={(e) => updateItem(idx, 'fats', Number(e.target.value))}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button onClick={saveMeal} className="w-full">
              Save Meal
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
