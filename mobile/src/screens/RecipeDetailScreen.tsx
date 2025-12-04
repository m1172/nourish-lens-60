import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { supabase } from '../supabase/client';
import { useTranslation } from 'react-i18next';

type Recipe = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  meal_type?: string | null;
  prep_time_minutes?: number | null;
  servings?: number | null;
};

type ParamList = {
  RecipeDetail: { id: string };
};

export function RecipeDetailScreen() {
  const route = useRoute<RouteProp<ParamList, 'RecipeDetail'>>();
  const { t } = useTranslation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', route.params.id)
        .maybeSingle();
      setRecipe((data as Recipe) || null);
      setLoading(false);
    };
    load();
  }, [route.params.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>{t('recipeDetail.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={styles.meta}>{t('recipeDetail.noImage')}</Text>
        </View>
      )}
      <Text style={styles.title}>{recipe.name}</Text>
      {recipe.description ? <Text style={styles.meta}>{recipe.description}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.pill}>
          {recipe.meal_type || t('recipeDetail.anyMeal')}
        </Text>
        <Text style={styles.pill}>
          {t('recipeDetail.prep', {
            time: recipe.prep_time_minutes
              ? t('common.units.minutes_other', {
                  count: recipe.prep_time_minutes,
                })
              : '—',
          })}
        </Text>
        <Text style={styles.pill}>
          {t('recipeDetail.servings', { count: recipe.servings ?? '—' })}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('recipeDetail.macros')}</Text>
        <Text style={styles.meta}>
          {t('recipeDetail.macroSummary', {
            calories: recipe.calories ?? '-',
            protein: recipe.protein ?? '-',
            carbs: recipe.carbs ?? '-',
            fats: recipe.fats ?? '-',
          })}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f7f8fa',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f8fa',
  },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  meta: {
    color: '#475569',
    marginTop: 6,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    color: '#0f172a',
    fontWeight: '600',
  },
  card: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  sectionLabel: {
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
});
