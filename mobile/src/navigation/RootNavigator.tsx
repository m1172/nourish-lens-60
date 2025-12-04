import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthProvider';
import DiaryScreen from '../screens/DiaryScreen';
import AddScreen from '../screens/AddScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AddSearchScreen from '../screens/AddSearchScreen';
import AddBarcodeScreen from '../screens/AddBarcodeScreen';
import AddPhotoScreen from '../screens/AddPhotoScreen';
import AddVoiceScreen from '../screens/AddVoiceScreen';
import { supabase } from '../supabase/client';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import BottomNav from './BottomNav';
import { User } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '../i18n';
import LanguageScreen from '../screens/LanguageScreen';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

type MainStackParamList = {
  Tabs: undefined;
  AddSearch: undefined;
  AddBarcode: undefined;
  AddPhoto: undefined;
  AddVoice: undefined;
  RecipeDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();
const BG = '#020617';
const FG = '#F9FAFB';

function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen
        name='Diary'
        component={DiaryScreen}
        options={{ title: t('bottomNav.diary') }}
      />
      <Tab.Screen
        name='Add'
        component={AddScreen}
        options={{ title: t('add.title') }}
      />
      <Tab.Screen
        name='Recipes'
        component={RecipesScreen}
        options={{ title: t('bottomNav.recipes') }}
      />
      <Tab.Screen
        name='Progress'
        component={ProgressScreen}
        options={{ title: t('bottomNav.progress') }}
      />
      <Tab.Screen
        name='Settings'
        component={SettingsScreen}
        options={{ title: t('bottomNav.profile') }}
      />
    </Tab.Navigator>
  );
}

function MainStackNavigator() {
  const { t } = useTranslation();
  const headerDefaults = {
    headerShown: true,
    headerStyle: { backgroundColor: BG },
    headerTitleStyle: { color: FG },
    headerTintColor: FG,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: BG },
  } as const;

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name='Tabs' component={AppTabs} />
      <MainStack.Screen
        name='AddSearch'
        component={AddSearchScreen}
        options={{ ...headerDefaults, title: t('navigation.addSearch') }}
      />
      <MainStack.Screen
        name='AddBarcode'
        component={AddBarcodeScreen}
        options={{ ...headerDefaults, title: t('navigation.addBarcode') }}
      />
      <MainStack.Screen
        name='AddPhoto'
        component={AddPhotoScreen}
        options={{ ...headerDefaults, title: t('navigation.addPhoto') }}
      />
      <MainStack.Screen
        name='AddVoice'
        component={AddVoiceScreen}
        options={{ ...headerDefaults, title: t('navigation.addVoice') }}
      />
      <MainStack.Screen
        name='RecipeDetail'
        component={RecipeDetailScreen}
        options={{ ...headerDefaults, title: t('navigation.recipe') }}
      />
    </MainStack.Navigator>
  );
}

function FullScreenLoader() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size='large' />
    </View>
  );
}

function MainGate() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!user && navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  }, [user, navigation]);

  if (!user) {
    return <FullScreenLoader />;
  }

  return <MainStackNavigator />;
}

export function RootNavigator() {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [languageChecked, setLanguageChecked] = useState(false);
  const [hasLanguage, setHasLanguage] = useState(false);

  // Fetch profile existence whenever we have a user
  useEffect(() => {
    let active = true;
    const fetchProfile = async (currentUser: User) => {
      try {
        setProfileLoading(true);
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (active) {
          setHasProfile(!!data);
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile(user);
    } else {
      setHasProfile(null);
    }

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const checkLanguage = async () => {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      setHasLanguage(!!stored);
      setLanguageChecked(true);
    };
    void checkLanguage();
  }, []);

  if (!languageChecked) {
    return <FullScreenLoader />;
  }

  if (!hasLanguage) {
    return (
      <LanguageScreen
        onContinue={() => {
          setHasLanguage(true);
        }}
      />
    );
  }

  if (loading || profileLoading || (user && hasProfile === null)) {
    return <FullScreenLoader />;
  }

  const initialRouteName = user && hasProfile ? 'Main' : 'Onboarding';
  const navKey = `${user ? 'user' : 'guest'}-${
    hasProfile === null ? 'unknown' : hasProfile ? 'has' : 'none'
  }`;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRouteName}
      key={navKey}
    >
      <Stack.Screen name='Onboarding' component={OnboardingScreen} />
      <Stack.Screen name='Auth' component={AuthScreen} />
      <Stack.Screen name='Main' component={MainGate} />
    </Stack.Navigator>
  );
}
