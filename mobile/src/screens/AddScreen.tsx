// AddScreen.tsx
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, Mic, Search, Barcode } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../ui/card';

const PRIMARY = '#6366F1';
const BACKGROUND = '#020617';
const CARD_BG = '#020617';
const BORDER = '#1F2937';
const MUTED = '#9CA3AF';
const ACCENT = '#f97316';
const SUCCESS = '#22c55e';
const FATS = '#facc15';

export default function AddScreen() {
  const navigation = useNavigation<any>();
  const parentNav = navigation.getParent?.();
  const rootNav = parentNav?.getParent?.() ?? parentNav ?? navigation;
  const { t } = useTranslation();

  const goTo = (route: 'AddPhoto' | 'AddSearch' | 'AddBarcode' | 'AddVoice') =>
    rootNav.navigate(route);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('add.title')}</Text>

          <View style={styles.cardsWrapper}>
            {/* Take a Photo */}
            <Card
              onPress={() => goTo('AddPhoto')}
              style={styles.cardRow}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: 'rgba(99,102,241,0.1)' },
                ]}
              >
                <Camera size={24} color={PRIMARY} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{t('add.photo.title')}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('add.photo.subtitle')}
                </Text>
              </View>
            </Card>

            {/* Search Foods */}
            <Card
              onPress={() => goTo('AddSearch')}
              style={styles.cardRow}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: 'rgba(249,115,22,0.1)' },
                ]}
              >
                <Search size={24} color={ACCENT} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{t('add.search.title')}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('add.search.subtitle')}
                </Text>
              </View>
            </Card>

            {/* Scan Barcode */}
            <Card
              onPress={() => goTo('AddBarcode')}
              style={styles.cardRow}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: 'rgba(34,197,94,0.1)' },
                ]}
              >
                <Barcode size={24} color={SUCCESS} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{t('add.barcode.title')}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('add.barcode.subtitle')}
                </Text>
              </View>
            </Card>

            {/* Voice Input */}
            <Card
              onPress={() => goTo('AddVoice')}
              style={styles.cardRow}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: 'rgba(250,204,21,0.1)' },
                ]}
              >
                <Mic size={24} color={FATS} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{t('add.voice.title')}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('add.voice.subtitle')}
                </Text>
              </View>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  root: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingBottom: 20, // pb-20
  },
  contentContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16, // p-4
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 24,
  },
  cardsWrapper: {
    gap: 12, // space-y-4
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24, // p-6
    gap: 16, // gap-4
  },
  iconWrapper: {
    padding: 12,
    borderRadius: 999,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: MUTED,
  },
});
