import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChevronLeft, Settings } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/supabase/client';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';

const BG = '#020617';
const CARD_BG = '#020617';
const BORDER = '#1F2933';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const PRIMARY = '#22C55E';
const SUCCESS = '#22C55E';
const DESTRUCTIVE = '#EF4444';
const ACCENT = '#F97316';
const BLUE = '#3B82F6';

export default function ProgressScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    const { data: logsData } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1);

    setWeightLogs(logsData || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  const currentWeight =
    profile?.current_weight_kg || weightLogs[0]?.weight_kg || 0;
  const goalWeight = profile?.goal_weight_kg || 0;
  const startWeight = profile?.starting_weight_kg || currentWeight;
  const localeTag = i18n.language.startsWith('ru')
    ? 'ru-RU'
    : i18n.language.startsWith('uz')
    ? 'uz'
    : 'en-US';
  const headerDate = new Date().toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'long',
  });

  const bmi =
    currentWeight && profile?.height_cm
      ? Number(
          (currentWeight / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
        )
      : 0;

  const bmiStatus =
    bmi < 18.5
      ? 'Underweight'
      : bmi < 25
      ? 'Normal'
      : bmi < 30
      ? 'Overweight'
      : 'Obese';

  const bmiColor =
    bmi < 18.5 ? BLUE : bmi < 25 ? SUCCESS : bmi < 30 ? ACCENT : DESTRUCTIVE;
  const metabolismBurn =
    profile?.daily_calorie_goal != null
      ? profile.daily_calorie_goal + 500
      : 2253;
  const goalCalories = profile?.daily_calorie_goal || 1753;
  const targetDate = new Date(2025, 10, 23).toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const kgUnit = t('common.units.kg');
  const startWeightLabel = `${startWeight} ${kgUnit}`;
  const goalWeightLabel = `${goalWeight} ${kgUnit}`;
  const currentWeightLabel = `${currentWeight} ${kgUnit}`;

  // Weight circle progress: guard against division by zero / negative
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  let progressRatio = 0;
  if (startWeight !== goalWeight) {
    progressRatio = (startWeight - currentWeight) / (startWeight - goalWeight);
    if (Number.isNaN(progressRatio)) progressRatio = 0;
    progressRatio = Math.min(Math.max(progressRatio, 0), 1);
  }
  const strokeDashoffset = circumference * (1 - progressRatio);

  // BMI indicator position (mapping 15–40 roughly into bar)
  const bmiPosition = Math.min(
    Math.max(((Number(bmi) - 15) / 25) * 100, 0),
    100
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('progress.header', { date: headerDate })}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Weight progress circle */}
          <View style={styles.circleSection}>
            <View style={styles.sideColumn}>
              <Text style={styles.sideValue}>{startWeightLabel}</Text>
              <Text style={styles.sideLabel}>{t('progress.start')}</Text>
            </View>

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
                  stroke='hsl(220, 13%, 16%)'
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
                  fill='none'
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap='round'
                />
              </Svg>

              <View style={styles.circleCenter}>
                <Text style={styles.circleWeight}>{currentWeightLabel}</Text>
                <Text style={styles.circleSubLabel}>
                  {t('progress.currentWeight')}
                </Text>
              </View>
            </View>

            <View style={styles.sideColumn}>
              <Text style={styles.sideValue}>{goalWeightLabel}</Text>
              <Text style={styles.sideLabel}>{t('progress.goal')}</Text>
            </View>
          </View>

          {/* Plan card */}
          <View style={styles.section}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{t('progress.planTitle')}</Text>
              <Text style={styles.cardBody}>
                {t('progress.planBody', {
                  burn: metabolismBurn,
                  goal: goalCalories,
                  date: targetDate,
                })}
              </Text>
              <Text style={styles.cardBody}>{t('progress.planReminder')}</Text>
            </Card>
          </View>

          {/* BMI card */}
          <View style={styles.section}>
            <Card style={styles.card}>
              <View style={styles.bmiHeaderRow}>
                <Text style={styles.cardTitle}>{t('progress.bmiTitle')}</Text>
                <Text style={[styles.bmiBadge, { color: bmiColor }]}>
                  {t('progress.bmiBadge')}
                </Text>
              </View>

              <Text style={styles.bmiValue}>{bmi}</Text>

              {/* BMI bar */}
              <View style={styles.bmiBarWrapper}>
                <LinearGradient
                  colors={[BLUE, SUCCESS, ACCENT, DESTRUCTIVE]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.bmiBarGradient}
                />
                <View
                  style={[styles.bmiIndicator, { left: `${bmiPosition}%` }]}
                />
              </View>

              <View style={styles.bmiScaleLabels}>
                <Text style={styles.bmiScaleText}>22</Text>
                <Text style={styles.bmiScaleText}>25</Text>
              </View>

              <Text style={styles.cardBody}>{t('progress.bmiInfo')}</Text>
            </Card>
          </View>

          <View style={styles.section}>
            <Button size='lg' style={styles.fullWidthButton}>
              <Text style={styles.fullWidthButtonText}>
                {t('progress.logMeasurements')}
              </Text>
            </Button>
          </View>
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
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerSideRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  circleSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideColumn: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  sideValue: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
  },
  sideLabel: {
    fontSize: 12,
    color: MUTED,
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
    right: 0,
    left: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWeight: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT,
  },
  circleSubLabel: {
    fontSize: 13,
    color: MUTED,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 8,
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bmiBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  bmiBarWrapper: {
    position: 'relative',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  bmiBarGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  bmiIndicator: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: TEXT,
    top: -4,
    borderRadius: 999,
  },
  bmiScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bmiScaleText: {
    fontSize: 11,
    color: MUTED,
  },
  fullWidthButton: {
    width: '100%',
    justifyContent: 'center',
  },
  fullWidthButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
