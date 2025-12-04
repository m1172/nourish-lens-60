import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import CountryPicker, {
  CountryCode,
  Country,
} from 'react-native-country-picker-modal';
import {
  getExampleNumber,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import metadata from 'libphonenumber-js/metadata.min.json';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import Svg, {
  Path,
  Circle as SvgCircle,
  Text as SvgText,
} from 'react-native-svg';
import { ArrowLeft, ThumbsUp, Heart, Check } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../supabase/client';
import { Picker } from '../helpers/Picker';
import { RulerPicker } from '../helpers/RulerPicker';
import CustomizingStep from '../helpers/CustomizingStep';
import { requestHealthPermission } from '../helpers/healthPermissions';

type Goal =
  | 'Lose weight'
  | 'Build healthy weight'
  | 'Get healthier'
  | 'Look better'
  | 'Have more energy'
  | '';
type Gender = 'Male' | 'Female' | '';
type ActivityLevel =
  | 'Mostly inactive'
  | 'Lightly active'
  | 'Active'
  | 'Very active'
  | '';
type GoalKey =
  | 'loseWeight'
  | 'buildWeight'
  | 'getHealthier'
  | 'lookBetter'
  | 'moreEnergy'
  | 'default';

const goalKeyMap: Record<Goal, GoalKey> = {
  'Lose weight': 'loseWeight',
  'Build healthy weight': 'buildWeight',
  'Get healthier': 'getHealthier',
  'Look better': 'lookBetter',
  'Have more energy': 'moreEnergy',
  '': 'default',
};

const goalKey = (goal: Goal | ''): GoalKey =>
  goal ? goalKeyMap[goal as Goal] : 'default';

interface FormState {
  goal: Goal;
  gender: Gender;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  activity_level: ActivityLevel;
  weekly_goal_kg: number;
  daily_calorie_goal: number;
  daily_steps_goal: number;
  daily_water_goal_ml: number;
  add_burned_calories: boolean;
  health_conditions: string[];
  program_steps: string[];
  phone_number?: string;
}

const PRIMARY = '#6366F1';
const BG = '#020617';
const CARD = '#020617';
const BORDER = '#1F2937';
const MUTED = '#9CA3AF';
const FG = '#F9FAFB';
const DEFAULT_COUNTRY: { code: CountryCode; dial: string } = {
  code: 'UZ',
  dial: '998',
};

const goalMetaDurations: Record<
  GoalKey,
  { withDuration: number; withoutDuration: number; withoutDelay: number }
> = {
  default: {
    withDuration: 1200,
    withoutDuration: 1800,
    withoutDelay: 180,
  },
  loseWeight: {
    withDuration: 1100,
    withoutDuration: 1900,
    withoutDelay: 220,
  },
  buildWeight: {
    withDuration: 1150,
    withoutDuration: 1800,
    withoutDelay: 180,
  },
  getHealthier: {
    withDuration: 1150,
    withoutDuration: 1800,
    withoutDelay: 180,
  },
  lookBetter: {
    withDuration: 1200,
    withoutDuration: 1850,
    withoutDelay: 200,
  },
  moreEnergy: {
    withDuration: 1150,
    withoutDuration: 1750,
    withoutDelay: 160,
  },
};

const goalDefaults: Record<
  Goal,
  { weeklyGoal: number; steps: number; programSteps: string[] }
> = {
  'Lose weight': {
    weeklyGoal: 0.7,
    steps: 10000,
    programSteps: [
      'Log your meals',
      // 'Work with a nutritionist', // Reserved for future use
      'Move more during the day',
    ],
  },
  'Build healthy weight': {
    weeklyGoal: 0.4,
    steps: 9000,
    programSteps: [
      'Log your meals',
      'Cook healthy meals',
      'Move more during the day',
      // 'Work with a nutritionist', // Reserved for future use
    ],
  },
  'Get healthier': {
    weeklyGoal: 0.3,
    steps: 8500,
    programSteps: [
      'Log your meals',
      'Cook healthy meals',
      'Move more during the day',
      // 'Work with a nutritionist', // Reserved for future use
    ],
  },
  'Look better': {
    weeklyGoal: 0.5,
    steps: 9000,
    programSteps: [
      'Log your meals',
      // 'Work with a nutritionist', // Reserved for future use
      'Move more during the day',
    ],
  },
  'Have more energy': {
    weeklyGoal: 0.4,
    steps: 9000,
    programSteps: [
      'Move more during the day',
      'Cook healthy meals',
      // 'Work with a nutritionist', // Reserved for future use
    ],
  },
  '': { weeklyGoal: 0.5, steps: 10000, programSteps: [] },
};

const getPhoneDigitMeta = (
  code: CountryCode,
  fallbackPlaceholder: string
) => {
  try {
    const example = getExampleNumber(code as any, metadata as any);
    const nationalDigits = example?.nationalNumber?.replace(/\D/g, '') || '';
    const len = nationalDigits.length;
    const min = len > 0 ? len : 6;
    const max = len > 0 ? len : 12;
    const placeholder = example?.formatNational?.() || fallbackPlaceholder;
    return { min, max, placeholder };
  } catch {
    return { min: 6, max: 12, placeholder: fallbackPlaceholder };
  }
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const showToast = (title: string, message?: string) => {
  Alert.alert(title, message);
};

const getGraphPaths = (goal: string) => {
  switch (goal) {
    case 'Lose weight':
      return {
        withPath: 'M 20 150 Q 100 180, 150 100 T 380 40',
        withoutPath: 'M 20 150 Q 120 160, 200 140 T 380 120',
      };
    case 'Get healthier':
      return {
        withPath: 'M 20 150 Q 140 140, 250 110 T 380 60',
        withoutPath: 'M 20 150 Q 120 160, 200 140 T 380 120',
      };
    case 'Look better':
    case 'Have more energy':
    default:
      return {
        withPath: 'M 20 150 Q 110 160, 200 120 T 380 80',
        withoutPath: 'M 20 150 Q 110 170, 200 150 T 380 120',
      };
  }
};

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { user, signIn, signUp } = useAuth();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    goal: '',
    gender: '',
    age: 25,
    height_cm: 170,
    current_weight_kg: 70,
    goal_weight_kg: 70,
    activity_level: '',
    weekly_goal_kg: 0.5,
    daily_calorie_goal: 2000,
    daily_steps_goal: 10000,
    daily_water_goal_ml: 2000,
    add_burned_calories: false,
    health_conditions: [],
    program_steps: [],
    phone_number: '',
  });

  const [progressCheckDay, setProgressCheckDay] = useState(7);
  const [healthConnecting, setHealthConnecting] = useState(false);
  const [healthConnected, setHealthConnected] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [userAdjustedWeeklyGoal, setUserAdjustedWeeklyGoal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [country, setCountry] = useState<{ code: CountryCode; dial: string }>(
    DEFAULT_COUNTRY
  );
  const [phoneInput, setPhoneInput] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phonePasswordError, setPhonePasswordError] = useState<string | null>(
    null
  );
  const [authenticating, setAuthenticating] = useState(false);
  const [pendingProfileSubmit, setPendingProfileSubmit] = useState(false);
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const goalLabels = useMemo(
    () => ({
      'Lose weight': t('onboarding.goal.options.loseWeight'),
      'Build healthy weight': t('onboarding.goal.options.buildWeight'),
      'Get healthier': t('onboarding.goal.options.getHealthier'),
      'Look better': t('onboarding.goal.options.lookBetter'),
      'Have more energy': t('onboarding.goal.options.moreEnergy'),
      '': '',
    }),
    [t]
  );
  const activityCopy = useMemo(
    () => ({
      'Mostly inactive': {
        label: t('onboarding.activity.options.inactive.label'),
        desc: t('onboarding.activity.options.inactive.desc'),
      },
      'Lightly active': {
        label: t('onboarding.activity.options.light.label'),
        desc: t('onboarding.activity.options.light.desc'),
      },
      Active: {
        label: t('onboarding.activity.options.active.label'),
        desc: t('onboarding.activity.options.active.desc'),
      },
      'Very active': {
        label: t('onboarding.activity.options.veryActive.label'),
        desc: t('onboarding.activity.options.veryActive.desc'),
      },
      '': { label: '', desc: '' },
    }),
    [t]
  );
  const conditionCopy = useMemo(
    () => ({
      'Gastric Disease': t('onboarding.conditions.options.gastric'),
      'High Cholesterol': t('onboarding.conditions.options.cholesterol'),
      'Thyroid Disease': t('onboarding.conditions.options.thyroid'),
      Diabetes: t('onboarding.conditions.options.diabetes'),
      'GLP-1 Therapy': t('onboarding.conditions.options.glp1'),
    }),
    [t]
  );
  const programCopy = useMemo(
    () => ({
      'Log your meals': {
        label: t('onboarding.program.options.logMeals.label'),
        desc: t('onboarding.program.options.logMeals.desc'),
      },
      'Cook healthy meals': {
        label: t('onboarding.program.options.cookHealthy.label'),
        desc: t('onboarding.program.options.cookHealthy.desc'),
      },
      'Move more during the day': {
        label: t('onboarding.program.options.moveMore.label'),
        desc: t('onboarding.program.options.moveMore.desc'),
      },
    }),
    [t]
  );
  const genderCopy = useMemo(
    () => ({
      Male: t('onboarding.gender.male'),
      Female: t('onboarding.gender.female'),
      '': '',
    }),
    [t]
  );

  const healthServiceKey =
    Platform.OS === 'ios'
      ? 'apple'
      : Platform.OS === 'android'
      ? 'google'
      : 'default';
  const healthServiceName = t(`onboarding.health.services.${healthServiceKey}`);
  const isGainGoal = form.goal === 'Build healthy weight';
  const localeTag = i18n.language.startsWith('ru')
    ? 'ru-RU'
    : i18n.language.startsWith('uz')
    ? 'uz'
    : 'en-US';

  const totalSteps = 19;
  const progress = ((step + 1) / totalSteps) * 100;
  const currentGoalKey = goalKey(form.goal);
  const goalDurations =
    goalMetaDurations[currentGoalKey] ?? goalMetaDurations.default;
  const goalMeta = {
    ...goalDurations,
    label: t(`onboarding.support.labels.${currentGoalKey}`),
    blurb: t(`onboarding.support.blurbs.${currentGoalKey}`),
  };
  const dayUnit = t('common.units.days_other', { count: 2 })
    .replace(/[0-9.,]/g, '')
    .trim();
  const appName = t('common.appName');
  const appNamePrimary = appName.slice(0, Math.max(0, appName.length - 2));
  const appNameAccent = appName.slice(-2);

  // graph animation
  const graphAnim = useRef(new Animated.Value(0)).current;
  const withDrawAnim = useRef(new Animated.Value(0)).current;
  const withoutDrawAnim = useRef(new Animated.Value(0)).current;
  const withPathRef = useRef<any>(null);
  const withoutPathRef = useRef<any>(null);
  const [pathLengths, setPathLengths] = useState({ with: 1, without: 1 });
  const [markerPositions, setMarkerPositions] = useState({
    with: { x: 20, y: 150 },
    without: { x: 20, y: 150 },
  });

  useEffect(() => {
    if (step !== 2) return;

    const meta = goalDurations;

    const frame = requestAnimationFrame(() => {
      const measuredWith =
        withPathRef.current?.getTotalLength?.() || pathLengths.with || 1;
      const measuredWithout =
        withoutPathRef.current?.getTotalLength?.() || pathLengths.without || 1;

      setPathLengths({ with: measuredWith, without: measuredWithout });

      const startWithPoint = withPathRef.current?.getPointAtLength?.(0);
      const startWithoutPoint = withoutPathRef.current?.getPointAtLength?.(0);
      if (startWithPoint && startWithoutPoint) {
        setMarkerPositions({
          with: { x: startWithPoint.x, y: startWithPoint.y },
          without: { x: startWithoutPoint.x, y: startWithoutPoint.y },
        });
      }

      graphAnim.stopAnimation();
      graphAnim.setValue(0);
      Animated.timing(graphAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();

      withDrawAnim.stopAnimation();
      withoutDrawAnim.stopAnimation();
      withDrawAnim.setValue(0);
      withoutDrawAnim.setValue(0);

      Animated.timing(withDrawAnim, {
        toValue: 1,
        duration: meta.withDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      Animated.timing(withoutDrawAnim, {
        toValue: 1,
        duration: meta.withoutDuration,
        delay: meta.withoutDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    return () => cancelAnimationFrame(frame);
  }, [step, currentGoalKey]);

  useEffect(() => {
    if (step !== 2) return;
    const id = withDrawAnim.addListener(({ value }) => {
      if (!withPathRef.current?.getPointAtLength) return;
      const pt = withPathRef.current.getPointAtLength(
        (pathLengths.with || 1) * value
      );
      if (pt?.x != null && pt?.y != null) {
        setMarkerPositions((prev) => ({
          ...prev,
          with: { x: pt.x, y: pt.y },
        }));
      }
    });
    return () => withDrawAnim.removeListener(id);
  }, [step, pathLengths.with, withDrawAnim]);

  useEffect(() => {
    if (step !== 2) return;
    const id = withoutDrawAnim.addListener(({ value }) => {
      if (!withoutPathRef.current?.getPointAtLength) return;
      const pt = withoutPathRef.current.getPointAtLength(
        (pathLengths.without || 1) * value
      );
      if (pt?.x != null && pt?.y != null) {
        setMarkerPositions((prev) => ({
          ...prev,
          without: { x: pt.x, y: pt.y },
        }));
      }
    });
    return () => withoutDrawAnim.removeListener(id);
  }, [step, pathLengths.without, withoutDrawAnim]);

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const calculateBMR = () => {
    const weight = form.current_weight_kg || 70;
    const height = form.height_cm || 170;
    const age = form.age || 30;
    const gender = form.gender || 'Male';

    const s = gender === 'Male' ? 5 : -161;
    return 10 * weight + 6.25 * height - 5 * age + s;
  };

  const getActivityFactor = (level: ActivityLevel) => {
    switch (level) {
      case 'Mostly inactive':
        return 1.2;
      case 'Lightly active':
        return 1.375;
      case 'Active':
        return 1.55;
      case 'Very active':
        return 1.725;
      default:
        return 1.2;
    }
  };

  const getCalorieCaps = () => {
    const isFemale = form.gender === 'Female';
    return {
      maxDailyDeficit: isFemale ? 600 : 750,
      deficitPct: isFemale ? 0.25 : 0.3,
      maxDailySurplus: isFemale ? 300 : 400,
      surplusPct: 0.15,
    };
  };

  const calculateCalories = (weeklyGoal: number) => {
    const baseBmr = calculateBMR();
    const activityFactor = getActivityFactor(form.activity_level);
    const tdee = baseBmr * activityFactor || 2000;
    const caps = getCalorieCaps();

    if (weeklyGoal <= 0) {
      return Math.round(tdee);
    }

    const rawChange = (weeklyGoal * 7700) / 7;

    if (isGainGoal) {
      const maxSurplus = Math.min(tdee * caps.surplusPct, caps.maxDailySurplus);
      const safeSurplus = Math.min(rawChange, maxSurplus);
      return Math.round(tdee + safeSurplus);
    }

    const maxDeficit = Math.min(tdee * caps.deficitPct, caps.maxDailyDeficit);
    const safeDeficit = Math.min(rawChange, maxDeficit);
    const targetCalories = tdee - safeDeficit;

    const minCalories = form.gender === 'Female' ? 1200 : 1500;
    return Math.max(minCalories, Math.round(targetCalories));
  };

  const getSafeWeeklyGoalMax = () => {
    if (isGainGoal) {
      return form.gender === 'Female' ? 0.6 : 0.8;
    }

    const baseBmr = calculateBMR();
    const activityFactor = getActivityFactor(form.activity_level);
    const tdee = baseBmr * activityFactor || 2000;
    const caps = getCalorieCaps();
    const maxDailyDeficit = Math.min(
      tdee * caps.deficitPct,
      caps.maxDailyDeficit
    );
    const maxWeeklyKg = (maxDailyDeficit * 7) / 7700;
    const genderClamp = form.gender === 'Female' ? 1.0 : 1.2;
    const baseMax = Math.max(0.1, Math.min(genderClamp, maxWeeklyKg));
    return Number(baseMax.toFixed(1));
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    if (!heightInMeters) return 0;
    return weight / (heightInMeters * heightInMeters);
  };

  const getHealthyWeightRange = (height: number) => {
    const heightInMeters = height / 100;
    const minHealthyBMI = 18.5;
    const maxHealthyBMI = 24.9;
    return {
      min: Math.round(minHealthyBMI * heightInMeters * heightInMeters),
      max: Math.round(maxHealthyBMI * heightInMeters * heightInMeters),
    };
  };

  const calculateTimeToGoal = () => {
    const totalChange = Math.abs(form.current_weight_kg - form.goal_weight_kg);
    if (totalChange === 0 || form.weekly_goal_kg <= 0) return 0;
    return Math.ceil(totalChange / form.weekly_goal_kg);
  };

  const phoneDigitMeta = getPhoneDigitMeta(
    country.code,
    t('auth.phoneLabel')
  );

  const buildFullPhone = () => {
    const limits = phoneDigitMeta;
    const digitsOnly = phoneInput.replace(/\D/g, '').slice(0, limits.max);
    const dial = country.dial.replace(/\D/g, '');
    return {
      digitsOnly,
      full: `+${dial}${digitsOnly}`,
    };
  };

  const loadSavedPhoneCredentials = async () => {
    const savedPhone =
      form.phone_number ||
      (await AsyncStorage.getItem('welmi:phone_number')) ||
      '';
    const savedPassword =
      (await AsyncStorage.getItem('welmi:phone_password')) || '';

    setPhoneError(null);
    setPhonePasswordError(null);
    setPhonePassword(savedPassword || '');

    if (!savedPhone) {
      setCountry(DEFAULT_COUNTRY);
      setPhoneInput('');
      return;
    }

    const parsed = parsePhoneNumberFromString(savedPhone, metadata as any);
    if (parsed) {
      setCountry({
        code: (parsed.country as CountryCode) || DEFAULT_COUNTRY.code,
        dial: parsed.countryCallingCode || DEFAULT_COUNTRY.dial,
      });
      setPhoneInput(parsed.nationalNumber || '');
      return;
    }

    const digits = savedPhone.replace(/\D/g, '');
    if (digits) {
      const dialLength = Math.min(4, Math.max(1, digits.length - 6));
      const dialGuess = digits.slice(0, dialLength);
      const national = digits.slice(dialLength);
      setCountry({
        code: DEFAULT_COUNTRY.code,
        dial: dialGuess || DEFAULT_COUNTRY.dial,
      });
      setPhoneInput(national);
      return;
    }

    setCountry(DEFAULT_COUNTRY);
    setPhoneInput('');
  };

  const savePhone = async (): Promise<boolean> => {
    const limits = phoneDigitMeta;
    const { digitsOnly, full } = buildFullPhone();
    const phoneRegex = /^\+\d{6,15}$/; // basic E.164 shape
    if (!phoneRegex.test(full) || digitsOnly.length < limits.min) {
      setPhoneError(
        t('auth.phoneError', { min: limits.min, max: limits.max })
      );
      return false;
    }
    if (phonePassword.length < 6) {
      setPhonePasswordError(t('auth.passwordError'));
      return false;
    }

    setPhoneError(null);
    setPhonePasswordError(null);
    setForm((prev) => ({ ...prev, phone_number: full }));
    await AsyncStorage.setItem('welmi:phone_number', full);
    await AsyncStorage.setItem('welmi:phone_password', phonePassword);
    setShowPhoneModal(false);
    showToast(
      t('onboarding.toasts.phoneSavedTitle'),
      t('onboarding.toasts.phoneSavedMessage')
    );
    return true;
  };

  const handlePhoneAuth = async () => {
    const ok = await savePhone();
    if (!ok) return;

    const { full } = buildFullPhone();
    setAuthenticating(true);
    try {
      let authUser: User | null = null;
      let authError: any = null;

      const { error: signUpError, user: signUpUser } = await signUp(
        full,
        phonePassword,
        { skipRedirect: true }
      );

      authUser = signUpUser;
      const existingAccount =
        !!signUpError &&
        typeof signUpError.message === 'string' &&
        /registered|exist/i.test(signUpError.message);

      if (existingAccount || (signUpError && !authUser)) {
        const { error: signInError, user: signInUser } = await signIn(
          full,
          phonePassword,
          { skipRedirect: true }
        );
        authUser = signInUser ?? authUser;
        authError = signInError;
      } else if (signUpError) {
        authError = signUpError;
      }

      if (authError) {
        showToast(
          t('onboarding.toasts.errorTitle'),
          authError.message || t('onboarding.toasts.signInRequiredMessage')
        );
        return;
      }

      const resolvedUser =
        authUser ??
        (await supabase.auth.getUser().then(({ data }) => data.user));

      if (!resolvedUser) {
        showToast(
          t('onboarding.toasts.verificationNeededTitle'),
          t('onboarding.toasts.verificationNeededMessage')
        );
        return;
      }

      await submit(resolvedUser);
    } catch (err: any) {
      const msg = err?.message || t('auth.signInUnknown');
      showToast(t('onboarding.toasts.errorTitle'), msg);
    } finally {
      setAuthenticating(false);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return !!form.goal;
      case 3:
        return !!form.gender;
      case 4:
        return form.age >= 18 && form.age <= 100;
      case 5:
        return form.height_cm >= 120 && form.height_cm <= 230;
      case 6:
        return form.current_weight_kg >= 40 && form.current_weight_kg <= 250;
      case 7:
        return !!form.activity_level;
      case 9:
        return (
          form.goal_weight_kg > 0 &&
          (isGainGoal
            ? form.goal_weight_kg > form.current_weight_kg
            : form.goal_weight_kg < form.current_weight_kg)
        );
      default:
        return true;
    }
  };

  const targetWeightBMI = calculateBMI(form.goal_weight_kg, form.height_cm);
  const isTargetHealthy = targetWeightBMI >= 18.5 && targetWeightBMI <= 24.9;
  const healthyRange = getHealthyWeightRange(form.height_cm);
  const safeWeeklyPace = getSafeWeeklyGoalMax();
  const isWeeklyGoalAggressive = form.weekly_goal_kg > safeWeeklyPace;
  const goalPreset = goalDefaults[form.goal];

  // keep calories synced
  useEffect(() => {
    const newCalories = calculateCalories(form.weekly_goal_kg);
    setForm((prev) => ({
      ...prev,
      daily_calorie_goal: newCalories,
    }));
  }, [
    form.weekly_goal_kg,
    form.gender,
    form.age,
    form.height_cm,
    form.current_weight_kg,
    form.activity_level,
  ]);

  // keep weekly goal within gender-safe caps when gender or activity changes
  useEffect(() => {
    const safe = getSafeWeeklyGoalMax();
    if (form.weekly_goal_kg > safe) {
      setForm((prev) => ({ ...prev, weekly_goal_kg: safe }));
    }
  }, [form.gender, form.activity_level]);

  // water goal autoadjust
  useEffect(() => {
    if (form.current_weight_kg > 0) {
      const ml = Math.round(form.current_weight_kg * 30);
      setForm((prev) => ({
        ...prev,
        daily_water_goal_ml: ml,
      }));
    }
  }, [form.current_weight_kg]);

  const applyGoalDefaults = (goal: Goal) => {
    const preset = goalDefaults[goal];
    if (!preset) {
      setForm((prev) => ({ ...prev, goal }));
      return;
    }

    const safeMax = getSafeWeeklyGoalMax();
    const cappedWeekly = Math.min(safeMax, Math.max(0.1, preset.weeklyGoal));

    setForm((prev) => ({
      ...prev,
      goal,
      weekly_goal_kg: userAdjustedWeeklyGoal
        ? prev.weekly_goal_kg
        : cappedWeekly,
      daily_steps_goal: preset.steps || prev.daily_steps_goal,
      program_steps:
        prev.program_steps.length > 0
          ? prev.program_steps
          : preset.programSteps,
      goal_weight_kg:
        goal === 'Build healthy weight'
          ? Math.min(
              200,
              Math.max(prev.goal_weight_kg, prev.current_weight_kg + 2)
            )
          : goal === 'Lose weight'
          ? Math.max(
              40,
              Math.min(prev.goal_weight_kg, prev.current_weight_kg - 2)
            )
          : prev.goal_weight_kg,
    }));
  };

  const connectHealth = async () => {
    if (healthConnecting) return;

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      next();
      return;
    }

    setHealthConnecting(true);
    setHealthError(null);

    try {
      const result = await requestHealthPermission();
      if (result.granted) {
        setHealthConnected(true);
        showToast(
          t('onboarding.toasts.connectedTitle'),
          t('onboarding.toasts.connectedMessage', {
            service: healthServiceName,
          })
        );
        next();
        return;
      }

      setHealthError(
        result.message ||
          t('onboarding.toasts.healthFailedTitle')
      );
    } catch (err: any) {
      const msg =
        err?.message ||
        t('onboarding.toasts.healthFailedTitle');
      setHealthError(msg);
      showToast(t('onboarding.toasts.healthFailedTitle'), msg);
    } finally {
      setHealthConnecting(false);
    }
  };

  const submit = async (authedUser?: User | null) => {
    if (loading) return;

    const resolvedUser =
      authedUser ??
      user ??
      (await supabase.auth.getUser().then(({ data }) => data.user));

    if (!resolvedUser) {
      showToast(
        t('onboarding.toasts.signInRequiredTitle'),
        t('onboarding.toasts.signInRequiredMessage')
      );
      navigation.navigate('Auth');
      return;
    }

    setLoading(true);
    try {
      const genderMap: Record<string, string> = {
        Male: 'male',
        Female: 'female',
      };
      const activityMap: Record<string, string> = {
        'Mostly inactive': 'inactive',
        'Lightly active': 'lightly_active',
        Active: 'moderately_active',
        'Very active': 'very_active',
      };

      const dailyCalories = calculateCalories(form.weekly_goal_kg);

      const profilePayload = {
        id: resolvedUser.id,
        gender: genderMap[form.gender],
        age: form.age,
        height_cm: form.height_cm,
        current_weight_kg: form.current_weight_kg,
        starting_weight_kg: form.current_weight_kg,
        goal_weight_kg: form.goal_weight_kg,
        activity_level: activityMap[form.activity_level] || 'inactive',
        daily_calorie_goal: dailyCalories,
        daily_steps_goal: Number(form.daily_steps_goal),
        daily_water_goal_ml: Number(form.daily_water_goal_ml),
        add_burned_calories: form.add_burned_calories,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (error) throw error;

      // Persist the full onboarding selection locally so we can reuse it later
      await AsyncStorage.setItem(
        'welmi:onboarding',
        JSON.stringify({
          ...form,
          progressCheckDay,
          daily_calorie_goal: dailyCalories,
        })
      );

      showToast(
        t('onboarding.toasts.profileCreatedTitle'),
        t('onboarding.toasts.profileCreatedMessage')
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : t('auth.signInUnknown');
      showToast(t('onboarding.toasts.errorTitle'), msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 18 && pendingProfileSubmit && user) {
      setPendingProfileSubmit(false);
      submit(user);
    }
  }, [step, pendingProfileSubmit, user]);

  const totalWeightChange = Math.abs(
    form.current_weight_kg - form.goal_weight_kg
  );

  const withDashOffset = withDrawAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLengths.with || 1, 0],
  });
  const withoutDashOffset = withoutDrawAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLengths.without || 1, 0],
  });
  const todayDate = new Date().toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const weekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
    localeTag,
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
  const monthsToGoal = Math.max(
    1,
    Math.ceil(
      (form.current_weight_kg - form.goal_weight_kg) /
        (form.weekly_goal_kg || 0.1) /
        4
    )
  );
  const goalDateText = new Date(
    Date.now() + calculateTimeToGoal() * 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const direction = isGainGoal
    ? t('onboarding.timeline.directions.gain')
    : t('onboarding.timeline.directions.lose');
  const directionVerb = isGainGoal
    ? t('onboarding.timeline.directions.gainVerb')
    : t('onboarding.timeline.directions.loseVerb');
  const timelineItems = [
    {
      icon: '●',
      title: t('onboarding.timeline.todayTitle', {
        date: todayDate,
        weight: form.current_weight_kg.toFixed(1),
      }),
      desc: t('onboarding.timeline.todayDesc', {
        direction,
        change: totalWeightChange.toFixed(0),
      }),
    },
    {
      icon: '●',
      title: t('onboarding.timeline.weekTitle', {
        date: weekDate,
        weight: (
          form.current_weight_kg +
          (isGainGoal ? form.weekly_goal_kg : -form.weekly_goal_kg)
        ).toFixed(1),
      }),
      desc: t('onboarding.timeline.weekDesc', {
        change: form.weekly_goal_kg.toFixed(1),
        direction: isGainGoal
          ? t('onboarding.timeline.directions.gain')
          : t('onboarding.timeline.directions.lose'),
      }),
    },
    {
      icon: '🎯',
      title: t('onboarding.timeline.goalTitle', {
        months: monthsToGoal,
        date: goalDateText,
        weight: form.goal_weight_kg.toFixed(1),
      }),
      desc: t('onboarding.timeline.goalDesc', {
        directionVerb,
        change: totalWeightChange.toFixed(0),
      }),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {step > 0 && (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        )}

        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={back}>
            <ArrowLeft size={24} color={FG} />
          </TouchableOpacity>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.inner}>
            {/* Step 0 */}
            {step === 0 && (
              <View style={styles.centerBlock}>
                <Text style={styles.appTitle}>
                  {appNamePrimary}
                  <Text style={{ color: PRIMARY }}>{appNameAccent}</Text>
                </Text>

                <View style={{ paddingVertical: 48 }}>
                  <ThumbsUp
                    size={96}
                    color={PRIMARY}
                    style={{ alignSelf: 'center', marginBottom: 32 }}
                  />
                  <Text style={styles.primaryHeadline}>
                    {t('onboarding.welcome.headline')}
                  </Text>
                </View>

                <View style={{ width: '100%', gap: 16 }}>
                  <Text style={styles.subtitle}>
                    {t('onboarding.welcome.subtitle')}
                  </Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={next}>
                    <Text style={styles.primaryButtonText}>
                      {t('common.continue')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Auth')}
                    style={{ alignSelf: 'center' }}
                  >
                    <Text style={styles.smallMuted}>
                      {t('onboarding.welcome.signInPrompt')}{' '}
                      <Text style={styles.linkPrimary}>
                        {t('onboarding.welcome.signIn')}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 1: Goal */}
            {step === 1 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>{t('onboarding.goal.title')}</Text>
                  <Text style={styles.muted}>
                    {t('onboarding.goal.subtitle')}
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  {[
                    { emoji: '🌱', label: 'Lose weight' as Goal },
                    { emoji: '🍚', label: 'Build healthy weight' as Goal },
                    { emoji: '🏃', label: 'Get healthier' as Goal },
                    { emoji: '💪', label: 'Look better' as Goal },
                    { emoji: '🍎', label: 'Have more energy' as Goal },
                  ].map((goal) => {
                    const selected = form.goal === goal.label;
                    return (
                      <TouchableOpacity
                        key={goal.label}
                        onPress={() => applyGoalDefaults(goal.label)}
                        style={[
                          styles.choiceButton,
                          selected && styles.choiceButtonSelected,
                        ]}
                      >
                        <Text style={styles.choiceEmoji}>{goal.emoji}</Text>
                        <Text style={styles.choiceLabel}>
                          {goalLabels[goal.label]}
                        </Text>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ paddingTop: 16 }}>
                  <TouchableOpacity
                    disabled={!canContinue()}
                    style={[
                      styles.primaryButton,
                      !canContinue() && styles.buttonDisabled,
                    ]}
                    onPress={next}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t('common.continue')}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.smallMuted, { marginTop: 12 }]}>
                    {t('onboarding.goal.agreement')}
                  </Text>
                </View>
              </View>
            )}

            {/* Step 2: Support that actually works (graph) */}
            {step === 2 && (
              <View style={styles.step}>
                {/* Title + subtitle (centered like web) */}
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.support.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.support.subtitle')}
                  </Text>
                </View>

                <View style={styles.goalMetaRow}>
                  <View style={styles.goalPill}>
                    <Text style={styles.goalPillText}>
                      {t('onboarding.support.goalLabel', {
                        goal:
                          goalLabels[form.goal] ||
                          t('onboarding.support.fallbackGoal'),
                      })}
                    </Text>
                  </View>
                  <Text style={styles.goalMetaText}>{goalMeta.label}</Text>
                </View>

                {/* Graph card */}
                <Animated.View
                  style={{
                    opacity: graphAnim,
                    transform: [
                      {
                        translateY: graphAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View style={styles.card}>
                    <Svg
                      viewBox='0 0 400 200'
                      style={{ width: '100%', height: 192 }} // ~ h-48
                    >
                      {/* Axis labels */}
                      <SvgText x={10} y={20} fill={MUTED} fontSize={10}>
                        {t('onboarding.support.axisResult')}
                      </SvgText>
                      <SvgText x={350} y={195} fill={MUTED} fontSize={10}>
                        {t('onboarding.support.axisTime')}
                      </SvgText>

                      {(() => {
                        const { withPath, withoutPath } = getGraphPaths(
                          form.goal
                        );

                        return (
                          <>
                            {/* WITH nutritionist curve */}
                            <AnimatedPath
                              ref={withPathRef}
                              d={withPath}
                              fill='none'
                              stroke={PRIMARY}
                              strokeWidth={3}
                              strokeLinecap='round'
                              strokeDasharray={[
                                pathLengths.with || 1,
                                pathLengths.with || 1,
                              ]}
                              strokeDashoffset={withDashOffset}
                            />

                            {/* Animated marker on WITH curve */}
                            <SvgCircle
                              cx={markerPositions.with.x}
                              cy={markerPositions.with.y}
                              r={6}
                              fill={PRIMARY}
                              opacity={0.95}
                            />

                            {/* Endpoint dot + label for WITH curve */}
                            <SvgCircle cx={380} cy={40} r={5} fill={PRIMARY} />
                            <SvgText
                              x={280}
                              y={30}
                              fill={PRIMARY}
                              fontSize={10}
                            >
                              {t('onboarding.support.withCoach')}
                            </SvgText>

                            {/* WITHOUT curve */}
                            <AnimatedPath
                              ref={withoutPathRef}
                              d={withoutPath}
                              fill='none'
                              stroke={MUTED}
                              strokeWidth={2}
                              strokeLinecap='round'
                              opacity={0.6}
                              strokeDasharray={[
                                pathLengths.without || 1,
                                pathLengths.without || 1,
                              ]}
                              strokeDashoffset={withoutDashOffset}
                            />

                            {/* Animated marker on WITHOUT curve */}
                            <SvgCircle
                              cx={markerPositions.without.x}
                              cy={markerPositions.without.y}
                              r={5}
                              fill={MUTED}
                              opacity={0.7}
                            />

                            {/* Endpoint dot + label for WITHOUT curve */}
                            <SvgCircle cx={380} cy={120} r={4} fill={MUTED} />
                            <SvgText x={300} y={135} fill={MUTED} fontSize={10}>
                              {t('onboarding.support.withoutCoach')}
                            </SvgText>
                          </>
                        );
                      })()}
                    </Svg>
                  </View>
                </Animated.View>

                {/* Description text same as web */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: PRIMARY, opacity: 0.9 },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {t('onboarding.support.withCoach')}
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: MUTED, opacity: 0.7 },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {t('onboarding.support.withoutCoach')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.centerText}>{goalMeta.blurb}</Text>

                <TouchableOpacity style={styles.primaryButton} onPress={next}>
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Gender */}
            {step === 3 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>{t('onboarding.gender.title')}</Text>
                  <Text style={styles.muted}>
                    {t('onboarding.gender.subtitle')}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {[
                    { emoji: '🤵', label: 'Male' as Gender },
                    { emoji: '👩', label: 'Female' as Gender },
                  ].map((gender) => {
                    const selected = form.gender === gender.label;
                    return (
                      <TouchableOpacity
                        key={gender.label}
                        onPress={() =>
                          setForm((prev) => ({ ...prev, gender: gender.label }))
                        }
                        style={[
                          styles.choiceButton,
                          selected && styles.choiceButtonSelected,
                        ]}
                      >
                        <Text style={styles.choiceEmoji}>{gender.emoji}</Text>
                        <Text style={styles.choiceLabel}>
                          {genderCopy[gender.label]}
                        </Text>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {!!form.goal && goalPreset && (
                  <Text
                    style={[
                      styles.smallMuted,
                      { marginTop: 8, textAlign: 'center' },
                    ]}
                  >
                    {t('onboarding.meta.suggestedSteps', {
                      goal:
                        goalLabels[form.goal] ||
                        t('onboarding.support.fallbackGoal'),
                      steps: goalPreset.steps.toLocaleString(),
                    })}
                  </Text>
                )}
                <TouchableOpacity
                  disabled={!canContinue()}
                  style={[
                    styles.primaryButton,
                    !canContinue() && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 4: Age */}
            {step === 4 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>{t('onboarding.age.title')}</Text>
                  <Text style={styles.muted}>
                    {t('onboarding.age.subtitle')}
                  </Text>
                </View>

                <View style={styles.centeredPicker}>
                  <Picker
                    value={form.age}
                    onChange={(age) => setForm((prev) => ({ ...prev, age }))}
                    min={18}
                    max={100}
                  />
                </View>

                <TouchableOpacity
                  disabled={!canContinue()}
                  style={[
                    styles.primaryButton,
                    !canContinue() && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 5: Height */}
            {step === 5 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.height.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.height.subtitle')}
                  </Text>
                </View>

                <View style={styles.centeredPicker}>
                  <View style={styles.unitPillsRow}>
                    <View style={styles.unitPillActive}>
                      <Text style={styles.unitPillActiveText}>
                        {t('onboarding.height.unit')}
                      </Text>
                    </View>
                  </View>
                  <Picker
                    value={form.height_cm}
                    onChange={(height_cm) =>
                      setForm((prev) => ({ ...prev, height_cm }))
                    }
                    min={140}
                    max={220}
                    unit={t('onboarding.height.unit')}
                  />
                </View>

                <TouchableOpacity
                  disabled={!canContinue()}
                  style={[
                    styles.primaryButton,
                    !canContinue() && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 6: Current weight */}
            {step === 6 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.weight.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.weight.subtitle')}
                  </Text>
                </View>

                <View style={styles.centeredPicker}>
                  <View style={styles.unitPillsRow}>
                    <View style={styles.unitPillActive}>
                      <Text style={styles.unitPillActiveText}>
                        {t('common.units.kg')}
                      </Text>
                    </View>
                  </View>

                  <RulerPicker
                    value={form.current_weight_kg}
                    onChange={(current_weight_kg) =>
                      setForm((prev) => ({
                        ...prev,
                        current_weight_kg,
                        goal_weight_kg:
                          prev.goal === 'Build healthy weight'
                            ? Math.max(prev.goal_weight_kg, current_weight_kg)
                            : Math.min(prev.goal_weight_kg, current_weight_kg),
                      }))
                    }
                    min={40}
                    max={200}
                    unit={t('common.units.kg')}
                    step={0.1}
                  />
                </View>

                <TouchableOpacity
                  disabled={!canContinue()}
                  style={[
                    styles.primaryButton,
                    !canContinue() && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 7: Activity level */}
            {step === 7 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.activity.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.activity.subtitle')}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {[
                    {
                      emoji: '🧘',
                      label: 'Mostly inactive' as ActivityLevel,
                      desc: '',
                    },
                    {
                      emoji: '🚶',
                      label: 'Lightly active' as ActivityLevel,
                      desc: '',
                    },
                    {
                      emoji: '🏃',
                      label: 'Active' as ActivityLevel,
                      desc: '',
                    },
                    {
                      emoji: '🏋️',
                      label: 'Very active' as ActivityLevel,
                      desc: '',
                    },
                  ].map((level) => {
                    const selected = form.activity_level === level.label;
                    return (
                      <TouchableOpacity
                        key={level.label}
                        onPress={() =>
                          setForm((prev) => ({
                            ...prev,
                            activity_level: level.label,
                          }))
                        }
                        style={[
                          styles.choiceButton,
                          selected && styles.choiceButtonSelected,
                        ]}
                      >
                        <Text style={styles.choiceEmoji}>{level.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.choiceLabel}>
                            {activityCopy[level.label]?.label}
                          </Text>
                          <Text style={styles.choiceDesc}>
                            {activityCopy[level.label]?.desc}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  disabled={!canContinue()}
                  style={[
                    styles.primaryButton,
                    !canContinue() && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 8: Health conditions */}
            {step === 8 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.conditions.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.conditions.subtitle')}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {[
                    { emoji: '🤢', label: 'Gastric Disease' },
                    { emoji: '🩸', label: 'High Cholesterol' },
                    { emoji: '🦋', label: 'Thyroid Disease' },
                    { emoji: '💉', label: 'Diabetes' },
                    { emoji: '💊', label: 'GLP-1 Therapy' },
                  ].map((condition) => {
                    const selected = form.health_conditions.includes(
                      condition.label
                    );
                    return (
                      <TouchableOpacity
                        key={condition.label}
                        onPress={() => {
                          const conditions = selected
                            ? form.health_conditions.filter(
                                (c) => c !== condition.label
                              )
                            : [...form.health_conditions, condition.label];
                          setForm((prev) => ({
                            ...prev,
                            health_conditions: conditions,
                          }));
                        }}
                        style={[
                          styles.choiceButton,
                          selected && styles.choiceButtonSelected,
                        ]}
                      >
                        <Text style={styles.choiceEmoji}>
                          {condition.emoji}
                        </Text>
                        <Text style={styles.choiceLabel}>
                          {conditionCopy[condition.label]}
                        </Text>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={next}>
                  <Text style={styles.primaryButtonText}>
                    {t('onboarding.conditions.none')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 9: Target weight */}
            {step === 9 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.target.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.target.subtitle')}
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <View style={styles.currentWeightRow}>
                    <Text style={styles.smallMuted}>
                      {t('onboarding.target.current', {
                        weight: form.current_weight_kg.toFixed(1),
                      })}
                    </Text>
                  </View>

                  <RulerPicker
                    value={form.goal_weight_kg}
                    onChange={(goal_weight_kg) =>
                      setForm((prev) => ({ ...prev, goal_weight_kg }))
                    }
                    min={
                      isGainGoal
                        ? form.current_weight_kg
                        : Math.max(40, form.current_weight_kg - 50)
                    }
                    max={
                      isGainGoal
                        ? Math.min(200, form.current_weight_kg + 30)
                        : form.current_weight_kg
                    }
                    unit={t('common.units.kg')}
                    step={0.1}
                  />
                </View>

                <View
                  style={[
                    styles.infoBox,
                    isTargetHealthy ? styles.infoGreen : styles.infoOrange,
                  ]}
                >
                  <View
                    style={[
                      styles.infoIconCircle,
                      isTargetHealthy
                        ? styles.infoIconGreen
                        : styles.infoIconOrange,
                    ]}
                  >
                    {isTargetHealthy ? (
                      <Check size={14} color='#fff' />
                    ) : (
                      <Text style={styles.infoIconText}>!</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.infoTitle,
                        isTargetHealthy
                          ? styles.infoTitleGreen
                          : styles.infoTitleOrange,
                      ]}
                    >
                      {isTargetHealthy
                        ? t('onboarding.target.healthyTarget', {
                            weight: Math.round(
                              (healthyRange.min + healthyRange.max) / 2
                            ),
                          })
                        : t('onboarding.target.outsideRange')}
                    </Text>
                    <Text style={styles.infoText}>
                      {isTargetHealthy
                        ? t('onboarding.target.healthyInfo')
                        : t('onboarding.target.outsideInfo')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={!canContinue()}
                  style={[
                    styles.primaryButton,
                    !canContinue() && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 10: Weekly pace */}
            {step === 10 && (
              <View style={styles.step}>
                <Text style={[styles.title, { textAlign: 'center' }]}>
                  {t('onboarding.pace.title')}
                </Text>

                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={[styles.muted, { marginBottom: 8 }]}>
                    {t('onboarding.pace.expected')}
                  </Text>
                  <Text style={styles.bigNumber}>
                    {form.weekly_goal_kg.toFixed(1)}
                    <Text style={styles.bigNumberUnit}>
                      {' '}
                      {t('common.units.kg')}
                    </Text>
                  </Text>
                  {!!form.goal && goalPreset && (
                    <Text style={[styles.smallMuted, { marginTop: 4 }]}>
                      {t('onboarding.pace.suggested', {
                        goal:
                          goalLabels[form.goal] ||
                          t('onboarding.support.fallbackGoal'),
                        value: goalPreset.weeklyGoal.toFixed(1),
                      })}
                    </Text>
                  )}
                  <Text style={[styles.smallMuted, { marginTop: 4 }]}>
                    {t('onboarding.pace.recommendedMax', {
                      value: safeWeeklyPace.toFixed(1),
                    })}
                  </Text>

                  <View style={{ width: '80%', marginTop: 16 }}>
                    <Slider
                      minimumValue={1}
                      maximumValue={12}
                      step={1}
                      value={Math.round(form.weekly_goal_kg * 10)}
                      onValueChange={(val) =>
                        setForm((prev) => ({
                          ...prev,
                          weekly_goal_kg: val / 10,
                        }))
                      }
                      onSlidingStart={() => setUserAdjustedWeeklyGoal(true)}
                      onSlidingComplete={() => setUserAdjustedWeeklyGoal(true)}
                    />
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabelText}>
                        {t('onboarding.pace.slider.easy')}
                      </Text>
                      <Text style={styles.sliderLabelText}>
                        {t('onboarding.pace.slider.balanced')}
                      </Text>
                      <Text style={styles.sliderLabelText}>
                        {t('onboarding.pace.slider.strict')}
                      </Text>
                    </View>
                  </View>

                  {isWeeklyGoalAggressive && (
                    <Text style={styles.warningText}>
                      {t('onboarding.pace.warning', {
                        pace: safeWeeklyPace.toFixed(1),
                      })}
                    </Text>
                  )}
                </View>

                <View style={[styles.infoBox, styles.infoGreen]}>
                  <Check size={20} color='#22c55e' style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoTitle, styles.infoTitleGreen]}>
                      {calculateTimeToGoal() > 0
                        ? t('onboarding.pace.goalDate', {
                            date: new Date(
                              Date.now() +
                                calculateTimeToGoal() *
                                  7 *
                                  24 *
                                  60 *
                                  60 *
                                  1000
                            ).toLocaleDateString(localeTag, {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }),
                          })
                        : t('onboarding.pace.goalClose')}
                    </Text>
                    <Text style={styles.infoText}>
                      {t('onboarding.pace.calorieNote', {
                        calories: calculateCalories(form.weekly_goal_kg),
                      })}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={next}>
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 11: Program steps */}
            {step === 11 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.program.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.program.subtitle')}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {[
                    {
                      emoji: '📖',
                      value: 'Log your meals',
                    },
                    // {
                    //   emoji: '👨‍⚕️',
                    //   label: 'Work with a nutritionist',
                    //   desc: 'Learn to make better eating decisions',
                    // }, // Reserved for future use
                    {
                      emoji: '🥘',
                      value: 'Cook healthy meals',
                    },
                    {
                      emoji: '🏃',
                      value: 'Move more during the day',
                    },
                  ].map((item) => {
                    const selected = form.program_steps.includes(item.value);
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => {
                          const steps = selected
                            ? form.program_steps.filter((s) => s !== item.value)
                            : [...form.program_steps, item.value];
                          setForm((prev) => ({
                            ...prev,
                            program_steps: steps,
                          }));
                        }}
                        style={[
                          styles.choiceButton,
                          selected && styles.choiceButtonSelected,
                        ]}
                      >
                        <Text style={styles.choiceEmoji}>{item.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.choiceLabel}>
                            {programCopy[item.value]?.label}
                          </Text>
                          <Text style={styles.choiceDesc}>
                            {programCopy[item.value]?.desc}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  disabled={form.program_steps.length === 0}
                  style={[
                    styles.primaryButton,
                    form.program_steps.length === 0 && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 12: Customizing */}
            {step === 12 && (
              <CustomizingStep
                items={[
                  {
                    label: t('onboarding.customizing.items.profile'),
                    detail: `${form.height_cm} ${t('onboarding.height.unit')}, ${form.current_weight_kg} ${t('common.units.kg')}`,
                  },
                  {
                    label: t('onboarding.customizing.items.metabolism'),
                    detail: `${calculateCalories(form.weekly_goal_kg)} ${t(
                      'common.units.kcal'
                    )}`,
                  },
                  {
                    label: t('onboarding.customizing.items.plan'),
                    detail: t('onboarding.customizing.items.balanced'),
                  },
                  {
                    label: t('onboarding.customizing.items.health'),
                    detail:
                      form.health_conditions.length > 0
                        ? t('onboarding.customizing.items.takenIntoAccount')
                        : t('onboarding.customizing.items.none'),
                  },
                ]}
                onComplete={next}
              />
            )}

            {/* Step 13: Timeline */}
            {step === 13 && (
              <View style={styles.step}>
                <Text style={styles.title}>
                  {t('onboarding.timeline.title')}
                </Text>
                <View style={{ paddingVertical: 16, gap: 24 }}>
                  {timelineItems.map((milestone, idx) => (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineIconCol}>
                        <Text style={styles.timelineIcon}>
                          {milestone.icon}
                        </Text>
                        {idx < 2 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>
                          {milestone.title}
                        </Text>
                        <Text style={styles.infoText}>{milestone.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={next}>
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 14: Health permission */}
            {step === 14 && (
              <View style={[styles.step, { alignItems: 'center' }]}>
                <View style={{ marginBottom: 24 }}>
                  <View style={styles.healthIconWrapper}>
                    <Heart size={48} color='#fff' fill='#fff' />
                  </View>
                </View>

                <View style={styles.healthRow}>
                  <View style={styles.healthMini}>
                    <Text style={styles.healthEmoji}>👟</Text>
                  </View>
                  <View style={styles.healthDotsCol}>
                    <View style={styles.healthDot} />
                    <View style={styles.healthDot} />
                    <View style={styles.healthDot} />
                  </View>
                  <View style={styles.healthMini}>
                    <Text style={styles.healthEmoji}>🥗</Text>
                  </View>
                  <View style={styles.healthDotsCol}>
                    <View style={styles.healthDot} />
                    <View style={styles.healthDot} />
                    <View style={styles.healthDot} />
                  </View>
                <View style={styles.healthMini}>
                  <Text style={styles.healthEmoji}>💧</Text>
                </View>
              </View>

              <Text style={styles.title}>
                {t('onboarding.health.title', { service: healthServiceName })}
              </Text>
              <Text
                style={[styles.muted, { textAlign: 'center', marginTop: 8 }]}
              >
                {t('onboarding.health.subtitle', {
                  service: healthServiceName,
                })}
              </Text>

              <View style={styles.healthList}>
                {[
                  t('onboarding.health.list.steps'),
                  t('onboarding.health.list.workouts'),
                  t('onboarding.health.list.hydration'),
                ].map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.healthListItem}>
                    <View style={styles.healthListDot} />
                    <Text style={styles.healthListText}>{item}</Text>
                  </View>
                ))}
              </View>

              {healthConnected && (
                <View style={styles.healthStatus}>
                  <Check size={16} color='#22c55e' />
                  <Text style={styles.healthStatusText}>
                    {t('onboarding.health.connected', {
                      service: healthServiceName,
                    })}
                  </Text>
                </View>
              )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginTop: 12 },
                    {
                      width: '100%',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                    healthConnecting && styles.buttonDisabled,
                  ]}
                  onPress={healthConnected ? next : connectHealth}
                  disabled={healthConnecting}
                >
                  {healthConnecting && (
                    <ActivityIndicator
                      size='small'
                      color='#fff'
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {healthConnected
                      ? t('common.continue')
                      : t('onboarding.health.connect', {
                          service: healthServiceName,
                        })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={next} style={styles.ghostButton}>
                  <Text style={styles.ghostButtonText}>
                    {t('onboarding.health.skip')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 15: Burned calories */}
            {step === 15 && (
              <View style={[styles.step, { flexDirection: 'column' }]}>
                <Text style={styles.title}>
                  {t('onboarding.burned.title')}
                </Text>

                <View style={styles.activityContainer}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 24,
                      alignItems: 'center',
                    }}
                  >
                    <View style={styles.activityCardWalk}>
                      <View style={styles.activityEmojiCard}>
                        <Text style={styles.activityEmoji}>👟</Text>
                      </View>
                    </View>

                    <View style={styles.activityBubbleWalk}>
                      <Text style={styles.activityBubbleFire}>🔥</Text>
                      <Text style={styles.smallMuted}>
                        {t('onboarding.burned.walking')}
                      </Text>
                      <Text style={styles.activityBubbleCals}>
                        {t('onboarding.burned.addBurned', { calories: 400 })}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 24,
                      alignItems: 'center',
                    }}
                  >
                    <View style={styles.activityCardGym}>
                      <View style={styles.activityEmojiCardBig}>
                        <Text style={styles.activityEmojiBig}>🏋️</Text>
                      </View>
                    </View>

                    <View style={styles.activityBubbleGym}>
                      <Text style={styles.activityBubbleFire}>🔥</Text>
                      <Text style={styles.smallMuted}>
                        {t('onboarding.burned.gym')}
                      </Text>
                      <Text style={styles.activityBubbleCals}>
                        {t('onboarding.burned.addBurned', { calories: 200 })}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { flex: 1 }]}
                    onPress={() => {
                      setForm((prev) => ({
                        ...prev,
                        add_burned_calories: false,
                      }));
                      next();
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {t('common.no')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={() => {
                      setForm((prev) => ({
                        ...prev,
                        add_burned_calories: true,
                      }));
                      next();
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t('common.yes')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 16: Progress check day */}
            {step === 16 && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <Text style={styles.title}>
                    {t('onboarding.progressCheck.title')}
                  </Text>
                  <Text style={styles.muted}>
                    {t('onboarding.progressCheck.subtitle')}
                  </Text>
                </View>

                <View style={styles.centeredPicker}>
                  <Picker
                    min={5}
                    max={13}
                    value={progressCheckDay}
                    onChange={setProgressCheckDay}
                    unit={dayUnit}
                  />
                </View>

                <View
                  style={[
                    {
                      flexDirection: 'column',
                      borderRadius: 16,
                      padding: 12,
                      marginTop: 12,
                    },
                    styles.infoPrimaryBorder,
                    { alignItems: 'center' },
                  ]}
                >
                  <Text style={styles.infoTitle}>
                    {t('onboarding.progressCheck.expectedDrop', {
                      weight: form.weekly_goal_kg.toFixed(1),
                    })}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 8,
                      alignItems: 'center',
                    }}
                  >
                    <View style={styles.infoPrimaryIconCircle}>
                      <Check size={14} color='#fff' />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={styles.infoText}>
                        {t('onboarding.progressCheck.note')}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={next}>
                  <Text style={styles.primaryButtonText}>
                    {t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 17: Disclaimer */}
            {step === 17 && (
              <View style={[styles.step, { alignItems: 'center' }]}>
                <Heart
                  size={96}
                  color={PRIMARY}
                  fill={PRIMARY}
                  style={{ marginBottom: 24 }}
                />
                <Text style={styles.title}>
                  {t('onboarding.disclaimer.title')}
                </Text>
                <Text
                  style={[styles.muted, { textAlign: 'center', marginTop: 12 }]}
                >
                  {t('onboarding.disclaimer.text')}
                </Text>
                <Text
                  style={[
                    styles.muted,
                    { textAlign: 'center', marginTop: 8, fontSize: 12 },
                  ]}
                >
                  {t('onboarding.disclaimer.textSmall')}
                </Text>

                <TouchableOpacity
                  disabled={loading}
                  style={[
                    styles.primaryButton,
                    { width: '100%' },
                    { marginTop: 24 },
                    { alignItems: 'center' },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={next}
                >
                  <Text style={[styles.primaryButtonText]}>
                    {loading
                      ? t('onboarding.disclaimer.loading')
                      : t('onboarding.disclaimer.cta')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 18: Sign-in options */}
            {step === 18 && (
              <View style={[styles.step, { alignItems: 'center' }]}>
                <View style={styles.signinDecor}>
                  <View style={styles.signinOverlay}>
                    <Text style={styles.title}>
                      {t('onboarding.signin.title')}
                    </Text>
                    <Text style={[styles.muted, { marginTop: 8 }]}>
                      {t('onboarding.signin.subtitle')}
                    </Text>
                  </View>
                </View>

                <View style={{ width: '100%', gap: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      (authenticating || loading) && styles.buttonDisabled,
                    ]}
                    disabled={authenticating || loading}
                    onPress={async () => {
                      setPendingProfileSubmit(true);
                      setAuthenticating(true);
                      try {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'apple',
                          options: {
                            redirectTo: '/', // adjust for deep link
                          },
                        });
                        if (error) throw error;
                      } catch (err) {
                        setPendingProfileSubmit(false);
                        showToast(
                          t('onboarding.toasts.errorTitle'),
                          t('auth.appleErrorDescription')
                        );
                      } finally {
                        setAuthenticating(false);
                      }
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {t('onboarding.signin.apple')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      (authenticating || loading) && styles.buttonDisabled,
                    ]}
                    disabled={authenticating || loading}
                    onPress={async () => {
                      setPendingProfileSubmit(true);
                      setAuthenticating(true);
                      try {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: '/',
                          },
                        });
                        if (error) throw error;
                      } catch (err) {
                        setPendingProfileSubmit(false);
                        showToast(
                          t('onboarding.toasts.errorTitle'),
                          t('auth.googleErrorDescription')
                        );
                      } finally {
                        setAuthenticating(false);
                      }
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {t('onboarding.signin.google')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.ghostButton,
                      (authenticating || loading) && styles.buttonDisabled,
                    ]}
                    disabled={authenticating || loading}
                    onPress={() => {
                      (async () => {
                        setPendingProfileSubmit(false);
                        await loadSavedPhoneCredentials();
                        setShowPhoneModal(true);
                      })();
                    }}
                  >
                    <Text style={styles.ghostButtonText}>
                      {t('onboarding.signin.phone')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <Modal
              animationType='fade'
              transparent
              visible={showPhoneModal}
              onRequestClose={() => setShowPhoneModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>
                    {t('onboarding.modal.title')}
                  </Text>
                  <Text style={[styles.muted, { marginBottom: 12 }]}>
                    {t('onboarding.modal.subtitle')}
                  </Text>

                  <View style={styles.phoneInputRow}>
                    <View style={styles.phoneCodeBox}>
                      <CountryPicker
                        withFilter
                        withCallingCode
                        containerButtonStyle={styles.countryPickerButton}
                        countryCode={country.code}
                        onSelect={(c: Country) => {
                          const dial =
                            c.callingCode?.[0] ||
                            getCountryCallingCode(c.cca2 as any) ||
                            '998';
                          setCountry({
                            code: c.cca2 as CountryCode,
                            dial,
                          });
                          setPhoneError(null);
                        }}
                        withFlag
                        withCallingCodeButton
                        withCountryNameButton={false}
                        theme={{
                          primaryColor: PRIMARY,
                          onBackgroundTextColor: FG,
                          backgroundColor: BG,
                        }}
                      />
                    </View>
                    <TextInput
                      style={[
                        styles.modalInput,
                        styles.phoneInput,
                        phoneError ? { borderColor: '#f97316' } : undefined,
                      ]}
                      placeholder={phoneDigitMeta.placeholder}
                      maxLength={phoneDigitMeta.max}
                      placeholderTextColor={MUTED}
                      keyboardType='phone-pad'
                      value={phoneInput}
                      onChangeText={(t) => {
                        const digits = t
                          .replace(/\D/g, '')
                          .slice(0, phoneDigitMeta.max);
                        setPhoneInput(digits);
                        setPhoneError(null);
                      }}
                    />
                  </View>
                  {phoneError && (
                    <Text style={styles.modalError}>{phoneError}</Text>
                  )}
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.modalInput,
                        styles.passwordInput,
                        phonePasswordError
                          ? { borderColor: '#f97316' }
                          : undefined,
                      ]}
                      placeholder={t('onboarding.modal.passwordPlaceholder')}
                      placeholderTextColor={MUTED}
                      secureTextEntry={!showPhonePassword}
                      value={phonePassword}
                      onChangeText={(t) => {
                        setPhonePassword(t);
                        setPhonePasswordError(null);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPhonePassword((v) => !v)}
                    >
                      {showPhonePassword ? (
                        <EyeOff size={18} color={MUTED} />
                      ) : (
                        <Eye size={18} color={MUTED} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {phonePasswordError && (
                    <Text style={styles.modalError}>{phonePasswordError}</Text>
                  )}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { flex: 1 }]}
                      onPress={() => setShowPhoneModal(false)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {t('onboarding.modal.cancel')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { flex: 1 },
                        (authenticating || loading) && styles.buttonDisabled,
                      ]}
                      disabled={authenticating || loading}
                      onPress={handlePhoneAuth}
                    >
                      {authenticating ? (
                        <ActivityIndicator color='#fff' />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {t('onboarding.modal.submit')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  root: { flex: 1, backgroundColor: BG },
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#111827',
    zIndex: 10,
  },
  progressBarFill: { height: '100%', backgroundColor: PRIMARY },
  backButton: {
    padding: 8,
    marginTop: 8,
    marginLeft: 8,
    zIndex: 11,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingTop: 40,
  },
  inner: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  centerBlock: { alignItems: 'center', gap: 24 },
  appTitle: { fontSize: 32, fontWeight: '700', color: FG },
  primaryHeadline: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  subtitle: { fontSize: 20, fontWeight: '600', color: FG, textAlign: 'center' },
  smallMuted: { fontSize: 12, color: MUTED },
  linkPrimary: {
    color: PRIMARY,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  linkUnderline: { textDecorationLine: 'underline' },
  primaryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  secondaryButtonText: { color: FG, fontWeight: '500', fontSize: 16 },
  ghostButton: {
    paddingVertical: 3,
    borderRadius: 999,
    alignItems: 'center',
  },
  ghostButtonText: { color: MUTED, fontSize: 14 },
  buttonDisabled: { opacity: 0.5 },
  step: { gap: 16 },
  stepHeader: { alignItems: 'center', gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: FG, textAlign: 'center' },
  muted: { fontSize: 14, color: MUTED },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  centerText: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 14,
    marginVertical: 8,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  choiceButtonSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#111827',
  },
  choiceEmoji: { fontSize: 24, marginRight: 12 },
  choiceLabel: { fontSize: 16, fontWeight: '600', color: FG },
  choiceDesc: { fontSize: 12, color: MUTED, marginTop: 2 },
  radioOuter: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: PRIMARY },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  centeredPicker: { alignItems: 'center', paddingVertical: 24 },
  unitPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  unitPillActive: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  unitPillActiveText: { color: '#fff', fontWeight: '600' },
  unitPillInactive: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: CARD,
  },
  unitPillInactiveText: { color: MUTED },
  currentWeightRow: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  currentWeightText: { fontSize: 18, fontWeight: '700', color: PRIMARY },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  infoGreen: {
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.3)',
  },
  infoOrange: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  infoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  infoIconGreen: { backgroundColor: '#22c55e' },
  infoIconOrange: { backgroundColor: '#f97316' },
  infoIconText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: FG },
  infoTitleGreen: { color: '#22c55e' },
  infoTitleOrange: { color: '#f97316' },
  infoText: { fontSize: 12, color: MUTED },
  bigNumber: { fontSize: 56, fontWeight: '700', color: FG },
  bigNumberUnit: { fontSize: 20, color: MUTED },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: { fontSize: 10, color: MUTED },
  warningText: {
    fontSize: 10,
    color: '#f97316',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  timelineRow: { flexDirection: 'row' },
  timelineIconCol: { alignItems: 'center' },
  timelineIcon: { fontSize: 20, color: PRIMARY },
  timelineLine: { width: 2, flex: 1, backgroundColor: BORDER, marginTop: 4 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 12 },
  timelineTitle: { fontWeight: '600', color: FG, marginBottom: 4 },
  healthIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  healthMini: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthEmoji: { fontSize: 28 },
  healthDotsCol: { gap: 4 },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: BORDER,
  },
  healthList: {
    width: '100%',
    gap: 8,
    marginTop: 12,
  },
  healthListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthListDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  healthListText: { color: FG, fontSize: 13, flex: 1 },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  healthStatusText: { color: '#22c55e', fontWeight: '600' },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
  },
  activityContainer: {
    height: 250,
    marginVertical: 16,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  activityCardWalk: {
    width: 160,
    padding: 16,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmojiCard: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: { fontSize: 36 },
  activityBubbleWalk: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
  },
  activityBubbleFire: { fontSize: 28, color: PRIMARY },
  activityBubbleCals: { fontSize: 18, fontWeight: '700', color: FG },
  activityCardGym: {
    width: 160,
    padding: 16,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmojiCardBig: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmojiBig: { fontSize: 40 },
  activityBubbleGym: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPrimaryBorder: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
  },
  infoPrimaryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signinDecor: {
    width: '100%',
    height: 260,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: CARD,
  },
  signinOverlay: {
    position: 'absolute',
    // inset: 16,
    backgroundColor: BG,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
  },
  goalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  goalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: BORDER,
  },
  goalPillText: { color: FG, fontWeight: '600', fontSize: 12 },
  goalMetaText: { color: MUTED, fontSize: 12 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 999 },
  legendText: { color: FG, fontSize: 12, opacity: 0.9 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalTitle: { color: FG, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 48,
    color: FG,
  },
  modalError: { color: '#f97316', fontSize: 12, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 40 },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  countryList: { maxHeight: 160, marginBottom: 8 },
  countryRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    marginBottom: 6,
  },
  countryChipActive: {
    borderColor: PRIMARY,
    backgroundColor: '#111827',
  },
  countryChipText: { color: FG, fontSize: 12 },
  countryChipTextActive: { color: PRIMARY, fontWeight: '700' },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  phoneCodeBox: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    height: 48,
  },
  phoneCodeText: { color: FG, fontWeight: '600' },
  phoneInput: { flex: 1, height: 48 },
  countryPickerButton: {
    height: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
