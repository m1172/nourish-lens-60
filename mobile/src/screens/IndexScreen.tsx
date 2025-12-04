import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const BG = '#020617';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';

export default function IndexScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>{t('index.title')}</Text>
          <Text style={styles.subtitle}>{t('index.subtitle')}</Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 16,
    fontSize: 32,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: MUTED,
    textAlign: 'center',
  },
});
