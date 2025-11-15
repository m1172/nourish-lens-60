import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Star, Heart, Clock, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Recipes() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('popular');

  useEffect(() => {
    loadRecipes();
  }, [filter]);

  const loadRecipes = async () => {
    let query = supabase
      .from('recipes')
      .select('*');

    if (filter === 'popular') {
      query = query.eq('is_popular', true);
    } else if (filter !== 'all') {
      query = query.eq('meal_type', filter);
    }

    const { data } = await query;
    setRecipes(data || []);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-sm mx-auto">
        {/* Header */}
        <div className="p-4 bg-card border-b border-border">
          <h1 className="text-2xl font-bold mb-4">Recipes</h1>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 shrink-0"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Badge
              variant={filter === 'favorites' ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => setFilter('favorites')}
            >
              <Star className="h-3 w-3 mr-1" />
              Favorites
            </Badge>
            <Badge
              variant={filter === 'popular' ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => setFilter('popular')}
            >
              <Heart className="h-3 w-3 mr-1 fill-current" />
              Popular
            </Badge>
          </div>
        </div>

        {/* Meal Types */}
        <div className="flex gap-2 p-4 overflow-x-auto">
          {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
            <Badge
              key={type}
              variant={filter === type ? 'default' : 'secondary'}
              className="cursor-pointer capitalize shrink-0"
              onClick={() => setFilter(type)}
            >
              {type}
            </Badge>
          ))}
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                {recipe.image_url ? (
                  <img 
                    src={recipe.image_url} 
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-nutrition-protein" />
                    {recipe.calories}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {recipe.prep_time_minutes} min
                  </span>
                </div>
                <h3 className="font-semibold text-sm leading-tight">{recipe.name}</h3>
              </div>
            </Card>
          ))}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
