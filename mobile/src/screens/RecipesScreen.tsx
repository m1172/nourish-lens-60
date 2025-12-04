import { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { Filter, Star, Heart, Clock, Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/supabase/client';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';

const BG = '#020617'; // bg-background
const CARD_BG = '#020617'; // bg-card
const BORDER = '#1F2933'; // border-border
const TEXT = '#F9FAFB'; // text-foreground
const MUTED = '#9CA3AF'; // text-muted-foreground
const MUTED_BG = '#111827'; // bg-muted
const PRIMARY = '#22C55E'; // primary
const SECONDARY_BG = '#1F2937';

export default function RecipesScreen() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('popular');

  const loadRecipes = useCallback(async () => {
    let query = supabase.from('recipes').select('*');

    if (filter === 'popular') {
      query = query.eq('is_popular', true);
    } else if (filter !== 'all') {
      // same logic as web: favorites will still hit meal_type = 'favorites'
      query = query.eq('meal_type', filter);
    }

    const { data } = await query;
    setRecipes(data || []);
  }, [filter]);

  useEffect(() => {
    loadRecipes();
  }, [filter, loadRecipes]);

  const renderRecipe = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.imageWrapper}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {t('recipes.noImage')}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Flame size={12} color='#F97316' />
            <Text style={styles.metaText}>{item.calories}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color={MUTED} />
            <Text style={styles.metaText}>
              {t('recipes.prep', {
                time:
                  item.prep_time_minutes != null
                    ? t('common.units.minutes_other', {
                        count: item.prep_time_minutes,
                      })
                    : '—',
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>{t('recipes.title')}</Text>

          {/* Filters row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Button variant='outline' size='sm' style={styles.filterButton}>
              <Filter size={16} color={TEXT} style={{ marginRight: 4 }} />
              <Text style={styles.filterButtonText}>
                {t('recipes.filter')}
              </Text>
            </Button>

            <Badge
              variant={filter === 'favorites' ? 'default' : 'outline'}
              style={styles.filterBadge}
              onPress={() => setFilter('favorites')}
            >
              <Star
                size={12}
                color={filter === 'favorites' ? TEXT : MUTED}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: filter === 'favorites' ? TEXT : MUTED },
                ]}
              >
                {t('recipes.favorites')}
              </Text>
            </Badge>

            <Badge
              variant={filter === 'popular' ? 'default' : 'outline'}
              style={styles.filterBadge}
              onPress={() => setFilter('popular')}
            >
              <Heart
                size={12}
                color={filter === 'popular' ? TEXT : MUTED}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: filter === 'popular' ? TEXT : MUTED },
                ]}
              >
                {t('recipes.popular')}
              </Text>
            </Badge>
          </ScrollView>
        </View>

        {/* Meal Types */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealTypesRow}
        >
          {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
            <Badge
              key={type}
              variant={filter === type ? 'default' : 'secondary'}
              style={styles.mealTypeBadge}
              onPress={() => setFilter(type)}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    textTransform: 'capitalize',
                    color: filter === type ? TEXT : '#E5E7EB',
                  },
                ]}
              >
                {t(`recipes.mealTypes.${type}`)}
              </Text>
            </Badge>
          ))}
        </ScrollView>

        {/* Recipes Grid */}
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderRecipe}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('recipes.empty')}</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '500',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealTypesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mealTypeBadge: {
    marginRight: 8,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  imageWrapper: {
    backgroundColor: MUTED_BG,
    aspectRatio: 1,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: MUTED,
    fontSize: 12,
  },
  cardContent: {
    padding: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  metaText: {
    fontSize: 11,
    color: MUTED,
    marginLeft: 2,
  },
  recipeName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    lineHeight: 16,
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
  },
});
