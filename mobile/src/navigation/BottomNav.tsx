import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Home, BookOpen, Plus, LineChart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

const BG_CARD = '#020617'; // bg-card
const BORDER = '#1F2933'; // border-border
const TEXT_MUTED = '#9CA3AF'; // text-muted-foreground
const PRIMARY = '#22C55E'; // primary
const PRIMARY_FG = '#0B1120'; // primary-foreground
const BG_MUTED = '#111827'; // bg-muted

type RouteName = 'Diary' | 'Recipes' | 'Add' | 'Progress' | 'Settings';
type Props = Partial<BottomTabBarProps>;

export default function BottomNav(props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = props.navigation ?? useNavigation<any>();
  const stateFromProps = props.state;
  const state = stateFromProps ?? useNavigationState((state) => state);
  const currentRouteName: string | undefined =
    state?.routes?.[state.index]?.name;
  const { t } = useTranslation();

  const isActive = (name: RouteName) => currentRouteName === name;

  const linkTextColor = (name: RouteName) =>
    isActive(name) ? PRIMARY : TEXT_MUTED;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 12,
          height: 64 + Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Diary */}
        <TouchableOpacity
          style={styles.link}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Diary')}
        >
          <Home size={24} color={linkTextColor('Diary')} />
          <Text style={[styles.linkLabel, { color: linkTextColor('Diary') }]}>
            {t('bottomNav.diary')}
          </Text>
        </TouchableOpacity>

        {/* Recipes */}
        <TouchableOpacity
          style={styles.link}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Recipes')}
        >
          <BookOpen size={24} color={linkTextColor('Recipes')} />
          <Text style={[styles.linkLabel, { color: linkTextColor('Recipes') }]}>
            {t('bottomNav.recipes')}
          </Text>
        </TouchableOpacity>

        {/* Add (floating-ish) */}
        <TouchableOpacity
          style={styles.addWrapper}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Add')}
        >
          <View style={styles.addCircle}>
            <Plus size={24} color={PRIMARY_FG} />
          </View>
          <Text style={[styles.linkLabel, { color: linkTextColor('Add') }]}>
            {t('bottomNav.add')}
          </Text>
        </TouchableOpacity>

        {/* Progress */}
        <TouchableOpacity
          style={styles.link}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Progress')}
        >
          <LineChart size={24} color={linkTextColor('Progress')} />
          <Text
            style={[styles.linkLabel, { color: linkTextColor('Progress') }]}
          >
            {t('bottomNav.progress')}
          </Text>
        </TouchableOpacity>

        {/* Profile / Me */}
        <TouchableOpacity
          style={styles.link}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.meCircle}>
            <Text style={styles.meText}>{t('bottomNav.me')}</Text>
          </View>
          <Text
            style={[styles.linkLabel, { color: linkTextColor('Settings') }]}
          >
            {t('bottomNav.profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: BG_CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    gap: 8,
  },
  link: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  linkLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  addWrapper: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  addCircle: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  meCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BG_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
});
