import { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Switch as RNSwitch,
  Alert,
  Platform,
  InputAccessoryView,
} from 'react-native';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/supabase/client';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';

// ---- Colors approximating your Tailwind theme ----
const BG = '#020617'; // bg-background
const CARD_BG = '#020617'; // bg-card
const BORDER = '#1F2933'; // border-border
const TEXT = '#F9FAFB'; // text-foreground
const MUTED = '#9CA3AF'; // text-muted-foreground
const PRIMARY = '#22C55E'; // primary

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    i18n.language
  );

  // modal visibility states
  const [caloriesModalVisible, setCaloriesModalVisible] = useState(false);
  const [stepsModalVisible, setStepsModalVisible] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [currentWeightModalVisible, setCurrentWeightModalVisible] =
    useState(false);
  const [goalWeightModalVisible, setGoalWeightModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [ageModalVisible, setAgeModalVisible] = useState(false);
  const [heightModalVisible, setHeightModalVisible] = useState(false);
  const languageOptions = [
    { code: 'uz-Latn', label: t('settings.language.options.uzLatn') },
    { code: 'uz-Cyrl', label: t('settings.language.options.uzCyrl') },
    { code: 'en', label: t('settings.language.options.en') },
    { code: 'ru', label: t('settings.language.options.ru') },
  ] as const;
  const activityLabelMap: Record<string, string> = {
    inactive: t('settings.values.inactive'),
    Inactive: t('settings.values.inactive'),
    'Mostly inactive': t('settings.values.inactive'),
    light: t('settings.values.light'),
    Light: t('settings.values.light'),
    'Light Activity': t('settings.values.light'),
    lightly_active: t('settings.values.light'),
    moderate: t('settings.values.moderate'),
    Moderate: t('settings.values.moderate'),
    moderately_active: t('settings.values.moderate'),
    active: t('settings.values.active'),
    Active: t('settings.values.active'),
    very_active: t('settings.values.veryActive'),
    'Very Active': t('settings.values.veryActive'),
    'Very active': t('settings.values.veryActive'),
  };
  const genderLabelMap: Record<string, string> = {
    male: t('settings.values.male'),
    Male: t('settings.values.male'),
    female: t('settings.values.female'),
    Female: t('settings.values.female'),
    other: t('settings.values.other'),
    Other: t('settings.values.other'),
  };

  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const showToast = useCallback(
    (
      title: string,
      description?: string,
      variant: 'default' | 'destructive' = 'default'
    ) => {
      // Suppress success popups; only surface errors
      if (variant === 'destructive') {
        Alert.alert(title, description);
      }
    },
    []
  );

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    setSelectedLanguage(code);
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data);
  };

  const toggleBurnedCalories = async () => {
    if (!user || !profile) return;
    await supabase
      .from('profiles')
      .update({ add_burned_calories: !profile.add_burned_calories })
      .eq('id', user.id);
    loadProfile();
  };

  const updateProfile = async (updates: any, onSuccess?: () => void) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await loadProfile();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showToast(
        t('onboarding.toasts.errorTitle'),
        error.message,
        'destructive'
      );
    }
  };

  const headerTitle = t('settings.title');
  const caloriesValue = `${profile?.daily_calorie_goal || 1753} ${t(
    'common.units.kcal'
  )}`;
  const stepsValue = t('common.units.steps_other', {
    count: profile?.daily_steps_goal || 9000,
  });
  const waterValue = `${profile?.daily_water_goal_ml || 3000} ${t(
    'common.units.ml'
  )}`;
  const weeklyGoalLabel = t('settings.values.perWeek', { value: 1 });
  const activityValue =
    activityLabelMap[profile?.activity_level || 'inactive'] ||
    t('settings.values.inactive');
  const currentWeightValue = `${profile?.current_weight_kg || 93} ${t(
    'common.units.kg'
  )}`;
  const goalWeightValue = `${profile?.goal_weight_kg || 80} ${t(
    'common.units.kg'
  )}`;
  const genderValue =
    genderLabelMap[profile?.gender || 'male'] || t('settings.values.male');
  const ageValue = `${profile?.age || 24}`;
  const heightValue = `${profile?.height_cm || 170} ${t('common.units.cm')}`;
  const currentLanguageLabel =
    languageOptions.find((opt) => opt.code === selectedLanguage)?.label ||
    selectedLanguage;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Support */}
          <Card style={styles.card}>
            <TouchableOpacity style={styles.row} activeOpacity={0.7}>
              <Text style={styles.rowLabel}>
                {t('settings.customerSupport')}
              </Text>
              <ChevronRight size={20} color={MUTED} />
            </TouchableOpacity>
          </Card>

          {/* Daily Goals */}
          <View>
            <Text style={styles.sectionTitle}>
              {t('settings.sections.dailyGoals')}
            </Text>
            <Card style={[styles.card, styles.cardDivider]}>
              {/* Calories & macros */}
              <SettingsRow
                label={t('settings.rows.calories')}
                value={caloriesValue}
                onPress={() => setCaloriesModalVisible(true)}
              />

              {/* Steps */}
              <SettingsRow
                label={t('settings.rows.steps')}
                value={stepsValue}
                onPress={() => setStepsModalVisible(true)}
              />

              {/* Hydration */}
              <SettingsRow
                label={t('settings.rows.hydration')}
                value={waterValue}
                onPress={() => setWaterModalVisible(true)}
              />

              {/* Add Burned Calories */}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.rows.burned')}</Text>
                <RNSwitch
                  value={profile?.add_burned_calories || false}
                  onValueChange={toggleBurnedCalories}
                  trackColor={{ false: '#1F2933', true: PRIMARY }}
                  thumbColor='#ffffff'
                />
              </View>
            </Card>
          </View>

          {/* Plan */}
          <View>
            <Text style={styles.sectionTitle}>
              {t('settings.sections.plan')}
            </Text>
            <Card style={[styles.card, styles.cardDivider]}>
              {/* Weekly Goal (static) */}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {t('settings.rows.weeklyGoal')}
                </Text>
                <Text style={styles.rowValue}>{weeklyGoalLabel}</Text>
              </View>

              {/* Activity Level */}
              <SettingsRow
                label={t('settings.rows.activity')}
                value={activityValue}
                onPress={() => setActivityModalVisible(true)}
              />

              {/* Current Weight */}
              <SettingsRow
                label={t('settings.rows.currentWeight')}
                value={currentWeightValue}
                onPress={() => setCurrentWeightModalVisible(true)}
              />

              {/* Goal Weight */}
              <SettingsRow
                label={t('settings.rows.goalWeight')}
                value={goalWeightValue}
                onPress={() => setGoalWeightModalVisible(true)}
              />
            </Card>
          </View>

          {/* Personalization */}
          <View>
            <Text style={styles.sectionTitle}>
              {t('settings.sections.personalization')}
            </Text>
            <Card style={[styles.card, styles.cardDivider]}>
              {/* Gender */}
              <SettingsRow
                label={t('settings.rows.gender')}
                value={genderValue}
                onPress={() => setGenderModalVisible(true)}
              />

              {/* Age */}
              <SettingsRow
                label={t('settings.rows.age')}
                value={ageValue}
                onPress={() => setAgeModalVisible(true)}
              />

              {/* Height */}
              <SettingsRow
                label={t('settings.rows.height')}
                value={heightValue}
                onPress={() => setHeightModalVisible(true)}
              />
            </Card>
          </View>

          {/* Language */}
          <View>
            <Text style={styles.sectionTitle}>
              {t('settings.sections.language')}
            </Text>
            <Card style={[styles.card, styles.cardDivider]}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {t('settings.language.current')}
                </Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>{currentLanguageLabel}</Text>
                </View>
              </View>
              {languageOptions.map((option) => {
                const active = selectedLanguage === option.code;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() => handleLanguageChange(option.code)}
                  >
                    <Text style={styles.rowLabel}>{option.label}</Text>
                    <View style={styles.rowRight}>
                      {active && <Check size={20} color={PRIMARY} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>

          <Button
            variant='destructive'
            style={styles.signOutButton}
            onPress={signOut}
          >
            <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
          </Button>
        </ScrollView>

        {/* --- MODALS --- */}

        {/* Calories & macros */}
        <SettingsModal
          visible={caloriesModalVisible}
          title={t('settings.modals.caloriesTitle')}
          onRequestClose={() => setCaloriesModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.caloriesLabel')}
            defaultValue={
              profile?.daily_calorie_goal
                ? String(profile.daily_calorie_goal)
                : ''
            }
            keyboardType='numeric'
            onSubmit={(value) => {
              const num = parseInt(value, 10);
              if (num && num !== profile?.daily_calorie_goal) {
                updateProfile({ daily_calorie_goal: num }, () =>
                  setCaloriesModalVisible(false)
                );
              } else {
                setCaloriesModalVisible(false);
              }
            }}
          />
        </SettingsModal>

        {/* Steps */}
        <SettingsModal
          visible={stepsModalVisible}
          title={t('settings.modals.stepsTitle')}
          onRequestClose={() => setStepsModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.stepsLabel')}
            defaultValue={
              profile?.daily_steps_goal ? String(profile.daily_steps_goal) : ''
            }
            keyboardType='numeric'
            onSubmit={(value) => {
              const num = parseInt(value, 10);
              if (num && num !== profile?.daily_steps_goal) {
                updateProfile({ daily_steps_goal: num }, () =>
                  setStepsModalVisible(false)
                );
              } else {
                setStepsModalVisible(false);
              }
            }}
          />
        </SettingsModal>

        {/* Hydration */}
        <SettingsModal
          visible={waterModalVisible}
          title={t('settings.modals.waterTitle')}
          onRequestClose={() => setWaterModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.waterLabel')}
            defaultValue={
              profile?.daily_water_goal_ml
                ? String(profile.daily_water_goal_ml)
                : ''
            }
            keyboardType='numeric'
            onSubmit={(value) => {
              const num = parseInt(value, 10);
              if (num && num !== profile?.daily_water_goal_ml) {
                updateProfile({ daily_water_goal_ml: num }, () =>
                  setWaterModalVisible(false)
                );
              } else {
                setWaterModalVisible(false);
              }
            }}
          />
        </SettingsModal>

        {/* Activity Level (select) */}
        <SettingsModal
          visible={activityModalVisible}
          title={t('settings.modals.activityTitle')}
          onRequestClose={() => setActivityModalVisible(false)}
        >
          {[
            { value: 'inactive', label: t('settings.values.inactive') },
            { value: 'lightly_active', label: t('settings.values.light') },
            { value: 'moderately_active', label: t('settings.values.moderate') },
            { value: 'very_active', label: t('settings.values.veryActive') },
          ].map((level) => {
            const current =
              (profile?.activity_level || '')
                .toString()
                .toLowerCase()
                .replace(/\s+/g, '_');
            const isActive = current === level.value;
            return (
              <TouchableOpacity
                key={level.value}
                style={styles.selectItem}
                activeOpacity={0.7}
                onPress={() =>
                  updateProfile({ activity_level: level.value }, () =>
                    setActivityModalVisible(false)
                  )
                }
              >
                <Text
                  style={[
                    styles.selectItemText,
                    isActive && {
                      color: PRIMARY,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </SettingsModal>

        {/* Current Weight */}
        <SettingsModal
          visible={currentWeightModalVisible}
          title={t('settings.modals.currentWeightTitle')}
          onRequestClose={() => setCurrentWeightModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.weightLabel')}
            defaultValue={
              profile?.current_weight_kg
                ? String(profile.current_weight_kg)
                : ''
            }
            keyboardType='decimal-pad'
            onSubmit={(value) => {
              const num = parseFloat(value);
              if (num && num !== profile?.current_weight_kg) {
                updateProfile({ current_weight_kg: num }, () =>
                  setCurrentWeightModalVisible(false)
                );
              } else {
                setCurrentWeightModalVisible(false);
              }
            }}
          />
        </SettingsModal>

        {/* Goal Weight */}
        <SettingsModal
          visible={goalWeightModalVisible}
          title={t('settings.modals.goalWeightTitle')}
          onRequestClose={() => setGoalWeightModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.weightLabel')}
            defaultValue={
              profile?.goal_weight_kg ? String(profile.goal_weight_kg) : ''
            }
            keyboardType='decimal-pad'
            onSubmit={(value) => {
              const num = parseFloat(value);
              if (num && num !== profile?.goal_weight_kg) {
                updateProfile({ goal_weight_kg: num }, () =>
                  setGoalWeightModalVisible(false)
                );
              } else {
                setGoalWeightModalVisible(false);
              }
            }}
          />
        </SettingsModal>

        {/* Gender (select) */}
        <SettingsModal
          visible={genderModalVisible}
          title={t('settings.modals.genderTitle')}
          onRequestClose={() => setGenderModalVisible(false)}
        >
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={styles.selectItem}
              activeOpacity={0.7}
              onPress={() =>
                updateProfile({ gender: g }, () => setGenderModalVisible(false))
              }
            >
              <Text
                style={[
                  styles.selectItemText,
                  profile?.gender === g && {
                    color: PRIMARY,
                    fontWeight: '600',
                  },
                ]}
              >
                {genderLabelMap[g] || g}
              </Text>
            </TouchableOpacity>
          ))}
        </SettingsModal>

        {/* Age */}
        <SettingsModal
          visible={ageModalVisible}
          title={t('settings.modals.ageTitle')}
          onRequestClose={() => setAgeModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.ageLabel')}
            defaultValue={profile?.age ? String(profile.age) : ''}
            keyboardType='numeric'
            onSubmit={(value) => {
              const num = parseInt(value, 10);
              if (num && num !== profile?.age) {
                updateProfile({ age: num }, () => setAgeModalVisible(false));
              } else {
                setAgeModalVisible(false);
              }
            }}
          />
        </SettingsModal>

        {/* Height */}
        <SettingsModal
          visible={heightModalVisible}
          title={t('settings.modals.heightTitle')}
          onRequestClose={() => setHeightModalVisible(false)}
        >
          <LabeledInput
            label={t('settings.modals.heightLabel')}
            defaultValue={profile?.height_cm ? String(profile.height_cm) : ''}
            keyboardType='numeric'
            onSubmit={(value) => {
              const num = parseInt(value, 10);
              if (num && num !== profile?.height_cm) {
                updateProfile({ height_cm: num }, () =>
                  setHeightModalVisible(false)
                );
              } else {
                setHeightModalVisible(false);
              }
            }}
          />
        </SettingsModal>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Small helpers/components ---------- */

type SettingsRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
};

function SettingsRow({ label, value, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {onPress && <ChevronRight size={20} color={MUTED} />}
      </View>
    </TouchableOpacity>
  );
}

type SettingsModalProps = {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onRequestClose: () => void;
};

function SettingsModal({
  visible,
  title,
  children,
  onRequestClose,
}: SettingsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ marginTop: 16 }}>{children}</View>
          <Button
            variant='outline'
            style={styles.modalCloseButton}
            onPress={onRequestClose}
          >
            <Text style={styles.modalCloseText}>
              {t('settings.modals.close')}
            </Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

type LabeledInputProps = {
  label: string;
  defaultValue?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  onSubmit: (value: string) => void;
};

function LabeledInput({
  label,
  defaultValue,
  keyboardType = 'default',
  onSubmit,
}: LabeledInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue ?? '');
  const accessoryId = 'settings-input-accessory';

  useEffect(() => {
    setValue(defaultValue ?? '');
  }, [defaultValue]);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={MUTED}
        onSubmitEditing={() => onSubmit(value)}
        returnKeyType='done'
        keyboardAppearance='dark'
        inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
      />
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={styles.inputAccessory} />
        </InputAccessoryView>
      )}
      <Button
        variant='default'
        style={styles.saveButton}
        onPress={() => onSubmit(value)}
      >
        <Text style={styles.saveButtonText}>{t('settings.modals.save')}</Text>
      </Button>
    </View>
  );
}

/* ---------- Styles ---------- */

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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 0,
    overflow: 'hidden',
  },
  cardDivider: {
    // emulate divide-y
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 13,
    color: MUTED,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 16,
  },
  signOutButton: {
    width: '100%',
    marginTop: 16,
    borderRadius: 999,
  },
  signOutText: {
    color: '#FEE2E2',
    fontWeight: '600',
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
  },
  modalCloseButton: {
    marginTop: 16,
    borderRadius: 999,
  },
  modalCloseText: {
    color: TEXT,
    fontWeight: '500',
  },
  inputGroup: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    color: TEXT,
    backgroundColor: BG,
    fontSize: 14,
  },
  inputAccessory: {
    height: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginTop: 12,
    borderRadius: 999,
  },
  saveButtonText: {
    color: '#020617',
    fontWeight: '600',
  },
  selectItem: {
    paddingVertical: 10,
  },
  selectItemText: {
    fontSize: 14,
    color: TEXT,
  },
});
