import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// BottomNav moved to App layout

type Food = {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size: number;
  serving_unit: string;
};

export default function AddSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const searchFoods = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const saveMeal = async () => {
    if (!user || !selectedFood) return;

    try {
      const multiplier = quantity / selectedFood.serving_size;

      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: selectedFood.name,
          logged_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (mealError) throw mealError;

      const { error: itemsError } = await supabase.from('meal_items').insert({
        meal_id: meal.id,
        food_id: selectedFood.id,
        calories: Math.round(selectedFood.calories * multiplier),
        protein: selectedFood.protein * multiplier,
        carbs: selectedFood.carbs * multiplier,
        fats: selectedFood.fats * multiplier,
        quantity: quantity,
      });

      if (itemsError) throw itemsError;

      toast({
        title: 'Success',
        description: 'Meal saved to your diary',
      });

      navigate('/');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    }
  };

  return (
    <div className='min-h-screen bg-background pb-20'>
      <div className='max-w-screen-sm mx-auto p-4 space-y-4'>
        <h1 className='text-2xl font-bold'>Search Foods</h1>

        <div className='flex gap-2'>
          <Input
            placeholder='Search for food...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchFoods()}
          />
          <Button onClick={searchFoods} disabled={loading}>
            <Search className='h-4 w-4' />
          </Button>
        </div>

        {selectedFood ? (
          <Card className='p-4 space-y-4'>
            <div>
              <h3 className='font-semibold text-lg'>{selectedFood.name}</h3>
              {selectedFood.brand && (
                <p className='text-sm text-muted-foreground'>
                  {selectedFood.brand}
                </p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div>
                <span className='text-muted-foreground'>Calories:</span>
                <span className='ml-2 font-medium'>
                  {selectedFood.calories}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Protein:</span>
                <span className='ml-2 font-medium'>
                  {selectedFood.protein}g
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Carbs:</span>
                <span className='ml-2 font-medium'>{selectedFood.carbs}g</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Fats:</span>
                <span className='ml-2 font-medium'>{selectedFood.fats}g</span>
              </div>
            </div>

            <div>
              <label className='text-sm text-muted-foreground'>
                Quantity ({selectedFood.serving_unit})
              </label>
              <Input
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={0.1}
                step={0.1}
              />
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={() => setSelectedFood(null)}
                variant='outline'
                className='flex-1'
              >
                Back
              </Button>
              <Button onClick={saveMeal} className='flex-1'>
                Save
              </Button>
            </div>
          </Card>
        ) : (
          <div className='space-y-2'>
            {results.map((food) => (
              <Card
                key={food.id}
                className='p-4 cursor-pointer hover:bg-muted/50 transition-colors'
                onClick={() => selectFood(food)}
              >
                <div className='font-medium'>{food.name}</div>
                {food.brand && (
                  <div className='text-sm text-muted-foreground'>
                    {food.brand}
                  </div>
                )}
                <div className='text-sm text-muted-foreground'>
                  {food.calories} kcal per {food.serving_size}{' '}
                  {food.serving_unit}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* BottomNav rendered globally in App.tsx */}
    </div>
  );
}
