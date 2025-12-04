import { useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/button';

const BG = '#111827';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const PRIMARY = '#22C55E';

export default function NotFoundScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      route?.name
    );
  }, [route?.name]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>404</Text>
          <Text style={styles.subtitle}>{t('notFound.message')}</Text>

          <Button
            style={styles.button}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Text style={styles.buttonText}>{t('notFound.cta')}</Text>
          </Button>
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
    fontSize: 36,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 16,
    fontSize: 18,
    color: MUTED,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
});
