// AddSearchScreen.tsx
import { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search as SearchIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/supabase/client'; // adjust path
import { useAuth } from '@/providers/AuthProvider'; // adjust path
import { Button } from '@/ui/button'; // RN Button
import { Card } from '@/ui/card'; // RN Card
import { Input } from '@/ui/input'; // RN Input
import { useToast } from '@/hooks/use-toast'; // RN toast hook

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

const BG = '#020617';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const CARD_BG = '#020617';
const BORDER = '#1F2937';

export default function AddSearchScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
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
        title: t('common.error'),
        description: err?.message ?? t('addSearch.searchError'),
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
      const qty = Number(quantity) || 0;
      const multiplier =
        selectedFood.serving_size > 0 ? qty / selectedFood.serving_size : 1;

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
        quantity: qty,
      });

      if (itemsError) throw itemsError;

      toast({
        title: t('common.success'),
        description: t('addSearch.saveSuccess'),
      });

      navigation.navigate('Home'); // equivalent to navigate('/')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err?.message ?? t('addSearch.saveError'),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('addSearch.title')}</Text>

          {/* Search bar row */}
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder={t('addSearch.placeholder')}
                value={query}
                onChangeText={setQuery}
                returnKeyType='search'
                onSubmitEditing={searchFoods}
              />
            </View>
            <Button
              onPress={searchFoods}
              disabled={loading}
              style={styles.searchButton}
            >
              <SearchIcon size={16} color={TEXT} />
            </Button>
          </View>

          {/* Selected food view */}
          {selectedFood ? (
            <Card style={styles.cardPadding}>
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.foodTitle}>{selectedFood.name}</Text>
                {selectedFood.brand ? (
                  <Text style={styles.foodBrand}>{selectedFood.brand}</Text>
                ) : null}
              </View>

              {/* Nutrients grid (2 cols) */}
              <View style={styles.nutrientGrid}>
                <View style={styles.nutrientRow}>
                  <Text style={styles.labelMuted}>
                    {t('addSearch.nutrients.calories')}:
                  </Text>
                  <Text style={styles.valueText}>{selectedFood.calories}</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.labelMuted}>
                    {t('addSearch.nutrients.protein')}:
                  </Text>
                  <Text style={styles.valueText}>{selectedFood.protein}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.labelMuted}>
                    {t('addSearch.nutrients.carbs')}:
                  </Text>
                  <Text style={styles.valueText}>{selectedFood.carbs}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.labelMuted}>
                    {t('addSearch.nutrients.fats')}:
                  </Text>
                  <Text style={styles.valueText}>{selectedFood.fats}g</Text>
                </View>
              </View>

              {/* Quantity input */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.quantityLabel}>
                  {t('addSearch.quantity', {
                    unit: selectedFood.serving_unit,
                  })}
                </Text>
                <Input
                  keyboardType='numeric'
                  value={String(quantity)}
                  onChangeText={(text) => setQuantity(text)}
                />
              </View>

              {/* Buttons row */}
              <View style={styles.actionRow}>
                <Button
                  variant='outline'
                  style={styles.flexButton}
                  onPress={() => setSelectedFood(null)}
                >
                  <Text style={styles.outlineButtonText}>
                    {t('addSearch.back')}
                  </Text>
                </Button>
                <Button style={styles.flexButton} onPress={saveMeal}>
                  <Text style={styles.buttonText}>{t('addSearch.save')}</Text>
                </Button>
              </View>
            </Card>
          ) : (
            // Results list
            <View style={{ marginTop: 8, width: '100%' }}>
              {results.map((food) => (
                <Card
                  key={food.id}
                  style={styles.resultCard}
                  onPress={() => selectFood(food)}
                >
                  <View>
                    <Text style={styles.resultName}>{food.name}</Text>
                    {food.brand ? (
                      <Text style={styles.resultBrand}>{food.brand}</Text>
                    ) : null}
                    <Text style={styles.resultDetails}>
                      {t('addSearch.resultDetails', {
                        calories: food.calories,
                        size: food.serving_size,
                        unit: food.serving_unit,
                      })}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingBottom: 20, // pb-20
  },
  container: {
    maxWidth: 600, // max-w-screen-sm
    alignSelf: 'center',
    width: '100%',
    padding: 16, // p-4
    rowGap: 16, // space-y-4 effect
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },
  searchRow: {
    flexDirection: 'row',
    columnGap: 8, // gap-2
    alignItems: 'center',
  },
  searchButton: {
    height: 40,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPadding: {
    padding: 16,
  },
  foodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
  },
  foodBrand: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  nutrientGrid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
    columnGap: 8,
  },
  nutrientRow: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelMuted: {
    fontSize: 13,
    color: MUTED,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    marginLeft: 4,
  },
  quantityLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    columnGap: 8,
    marginTop: 12,
  },
  flexButton: {
    flex: 1,
  },
  buttonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  resultCard: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: CARD_BG,
    borderColor: BORDER,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  resultBrand: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  resultDetails: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
});
