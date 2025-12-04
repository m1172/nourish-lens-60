import { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Flame,
  Wheat,
  Drumstick,
  Droplet,
  Footprints,
  CheckCircle2,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { startOfDay } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/supabase/client';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';

type MealItem = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Meal = {
  id: string;
  name?: string;
  photo_url?: string | null;
  logged_at: string;
  meal_items?: MealItem[];
};

type DailyStats = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  steps: number;
};

export default function DiaryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [profile, setProfile] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
    steps: 0,
  });
  const [meals, setMeals] = useState<Meal[]>([]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
  }, [user]);

  const loadDailyData = useCallback(async () => {
    if (!user) return;

    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Meals + items
    const { data: mealsData } = await supabase
      .from('meals')
      .select(
        `
        *,
        meal_items (
          calories,
          protein,
          carbs,
          fats
        )
      `
      )
      .eq('user_id', user.id)
      .gte('logged_at', dayStart.toISOString())
      .lt('logged_at', dayEnd.toISOString())
      .order('logged_at', { ascending: false });

    const mealsList = (mealsData as Meal[]) || [];
    setMeals(mealsList);

    // Totals from meals
    const totals = mealsList.reduce(
      (acc, meal) => {
        (meal.meal_items || []).forEach((item) => {
          acc.calories += item.calories || 0;
          acc.protein += item.protein || 0;
          acc.carbs += item.carbs || 0;
          acc.fats += item.fats || 0;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Water logs
    const { data: waterData } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .gte('logged_at', dayStart.toISOString())
      .lt('logged_at', dayEnd.toISOString());

    const totalWater =
      waterData?.reduce(
        (sum: number, log: any) => sum + (log.amount_ml || 0),
        0
      ) || 0;

    // Step logs
    const { data: stepsData } = await supabase
      .from('step_logs')
      .select('steps')
      .eq('user_id', user.id)
      .gte('logged_at', dayStart.toISOString())
      .lt('logged_at', dayEnd.toISOString());

    const totalSteps =
      stepsData?.reduce((sum: number, log: any) => sum + (log.steps || 0), 0) ||
      0;

    setDailyStats({
      ...totals,
      water: totalWater,
      steps: totalSteps,
    });
  }, [user, currentDate]);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user, loadProfile]);

  useEffect(() => {
    if (!user) return;
    loadDailyData();
  }, [user, currentDate, loadDailyData]);

  const caloriesGoal = profile?.daily_calorie_goal || 2000;
  const caloriesLeft = Math.max(0, caloriesGoal - dailyStats.calories);

  const stepsGoal = profile?.daily_steps_goal || 10000;
  const waterGoal = profile?.daily_water_goal_ml || 3000;
  const stepsProgress = Math.min((dailyStats.steps / stepsGoal) * 100, 100);
  const waterProgress = Math.min((dailyStats.water / waterGoal) * 100, 100);

  const addWater = async (amount: number) => {
    if (!user) return;
    await supabase.from('water_logs').insert({
      user_id: user.id,
      amount_ml: amount,
      logged_at: new Date().toISOString(),
    });
    loadDailyData();
  };

  const goPrevDay = () => {
    setCurrentDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const goNextDay = () => {
    setCurrentDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const localeTag = i18n.language.startsWith('ru')
    ? 'ru-RU'
    : i18n.language.startsWith('uz-Cyrl')
    ? 'uz-Cyrl-UZ'
    : i18n.language.startsWith('uz')
    ? 'uz-UZ'
    : 'en-US';
  const formatUzLatnDate = () => {
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = currentDate.toLocaleDateString('uz-UZ', { month: 'long' });
    const monthFormatted =
      month.length > 0 ? month.charAt(0).toUpperCase() + month.slice(1) : month;
    return `${day}-${monthFormatted}`;
  };
  const headerDate =
    i18n.language.startsWith('uz-Latn') || i18n.language === 'uz'
      ? formatUzLatnDate()
      : currentDate.toLocaleDateString(localeTag, {
          day: '2-digit',
          month: 'long',
        });
  const isToday =
    startOfDay(currentDate).getTime() === startOfDay(new Date()).getTime();
  const headerLabel = isToday
    ? `${t('diary.today')},  ${headerDate}`
    : headerDate;

  // Circle constants (similar to your 96/88/553 geometry)
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(dailyStats.calories / caloriesGoal, 1);
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goPrevDay}>
            <ChevronLeft size={24} color={TEXT_COLOR} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{headerLabel}</Text>

          <TouchableOpacity onPress={goNextDay}>
            <ChevronRight size={24} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Circle Section */}
          <View style={styles.circleSection}>
            {/* Eaten */}
            <View style={styles.sideStat}>
              <Text style={styles.sideStatValue}>
                {Math.round(dailyStats.calories)}
              </Text>
              <Text style={styles.sideStatLabel}>{t('diary.eaten')}</Text>
            </View>

            {/* Circular Progress */}
            <View style={styles.circleWrapper}>
              <Svg
                width={192}
                height={192}
                style={{ transform: [{ rotate: '-90deg' }] }}
              >
                {/* Background ring */}
                <Circle
                  cx={96}
                  cy={96}
                  r={radius}
                  stroke={MUTED_BG}
                  strokeWidth={12}
                  fill='none'
                />

                {/* Progress ring */}
                <Circle
                  cx={96}
                  cy={96}
                  r={radius}
                  stroke={PRIMARY}
                  strokeWidth={12}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap='round'
                  fill='none'
                />
              </Svg>

              <View style={styles.circleCenter}>
                <Text style={styles.circleCaloriesLeft}>{caloriesLeft}</Text>
                <Text style={styles.circleLabel}>{t('diary.kcalLeft')}</Text>
              </View>
            </View>

            {/* Burned (hard-coded 563 as in web) */}
            <View style={styles.sideStat}>
              <Text style={styles.sideStatValue}>563</Text>
              <Text style={styles.sideStatLabel}>{t('diary.burned')}</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Wheat size={16} color={CARBS_COLOR} />
                <Text style={styles.macroTitle}>{t('diary.carbs')}</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(dailyStats.carbs)} /{' '}
                {profile?.daily_carbs_goal || 175}
              </Text>
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Drumstick size={16} color={PROTEIN_COLOR} />
                <Text style={styles.macroTitle}>{t('diary.protein')}</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(dailyStats.protein)} /{' '}
                {profile?.daily_protein_goal || 131}
              </Text>
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Droplet size={16} color={FATS_COLOR} />
                <Text style={styles.macroTitle}>{t('diary.fats')}</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(dailyStats.fats)} / {profile?.daily_fats_goal || 58}
              </Text>
            </View>
          </View>

          {/* Steps & Water */}
          <View style={styles.grid2}>
            {/* Steps Card */}
            <Card style={[styles.card, styles.stepsCard]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <Footprints size={20} color={STEPS_COLOR} />
                  <Text style={styles.cardTitle}>{t('diary.steps')}</Text>
                </View>
                {stepsProgress >= 100 && (
                  <CheckCircle2 size={20} color={SUCCESS} />
                )}
              </View>
              <Text style={styles.cardLargeValue}>
                {t('diary.stepsLabel', { count: dailyStats.steps })} /{' '}
                {stepsGoal.toLocaleString()}
              </Text>
            </Card>

            {/* Water Card */}
            <Card style={[styles.card, styles.waterCard]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <Droplet size={20} color={WATER_COLOR} />
                  <Text style={styles.cardTitle}>{t('diary.water')}</Text>
                </View>
                <TouchableOpacity onPress={() => addWater(250)}>
                  <Plus size={20} color={WATER_COLOR} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardLargeValue}>
                {dailyStats.water} / {waterGoal}
              </Text>
            </Card>
          </View>

          {/* Journal */}
          <View style={styles.journalSection}>
            <Text style={styles.journalTitle}>{t('diary.journal')}</Text>

            {meals.length === 0 ? (
              <View style={styles.emptyJournal}>
                <Text style={styles.emptyJournalText}>{t('diary.empty')}</Text>
              </View>
            ) : (
              <View style={styles.mealList}>
                {meals.map((meal) => {
                  const totalMealCalories =
                    meal.meal_items?.reduce(
                      (sum, item) => sum + (item.calories || 0),
                      0
                    ) || 0;

                  return (
                    <Card key={meal.id} style={styles.mealCard}>
                      <View style={styles.mealRow}>
                        {meal.photo_url ? (
                          <Image
                            source={{ uri: meal.photo_url }}
                            style={styles.mealImage}
                          />
                        ) : null}
                        <View style={styles.mealTextWrapper}>
                          <Text style={styles.mealTitle}>
                            {meal.name || t('diary.mealFallback')}
                          </Text>
                          <View style={styles.mealMetaRow}>
                            <View style={styles.mealCaloriesRow}>
                              <Flame size={12} color={TEXT_MUTED} />
                              <Text style={styles.mealCaloriesText}>
                                {t('diary.kcal', {
                                  value: totalMealCalories,
                                })}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* --- Colors approximating your Tailwind + CSS vars --- */
const BG = '#020617'; // bg-background
const CARD_BG = '#020617';
const BORDER = '#1F2933';
const TEXT_COLOR = '#F9FAFB';
const TEXT_MUTED = '#9CA3AF';
const PRIMARY = '#22C55E';
const SUCCESS = '#22C55E';
const MUTED_BG = '#111827';
const CARBS_COLOR = '#F97316'; // orange
const PROTEIN_COLOR = '#3B82F6'; // blue
const FATS_COLOR = '#EAB308'; // amber
const WATER_COLOR = '#38BDF8';
const STEPS_COLOR = '#34D399';
const TEXT_ON_PRIMARY = '#FFFFFF';

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  circleSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideStat: {
    flex: 1,
    alignItems: 'center',
  },
  sideStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  sideStatLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  circleWrapper: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCaloriesLeft: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  circleLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  macroGrid: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  macroTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_COLOR,
    marginLeft: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  grid2: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepsCard: {
    backgroundColor: '#16653433', // success/10-ish
  },
  waterCard: {
    backgroundColor: '#0ea5e933',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontWeight: '600',
    color: TEXT_COLOR,
    marginLeft: 4,
  },
  cardLargeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  journalSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  journalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginBottom: 16,
  },
  emptyJournal: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyJournalText: {
    color: TEXT_MUTED,
  },
  mealList: {
    gap: 12,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 12,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  mealTextWrapper: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealCaloriesText: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginLeft: 4,
  },
  fabButton: {
    borderRadius: 999,
    paddingHorizontal: 24,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: PRIMARY,
  },
});
