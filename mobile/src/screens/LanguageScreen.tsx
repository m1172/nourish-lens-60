import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { LANGUAGE_STORAGE_KEY } from '@/i18n';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';

const BG = '#020617';
const CARD = '#020617';
const BORDER = '#1F2937';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const PRIMARY = '#22C55E';

type LanguageScreenProps = {
  onContinue: () => void;
};

export default function LanguageScreen({ onContinue }: LanguageScreenProps) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string>(i18n.language || 'uz-Latn');
  const [saving, setSaving] = useState(false);

  const languageOptions = useMemo(
    () => [
      { code: 'uz-Latn', label: t('settings.language.options.uzLatn') },
      { code: 'uz-Cyrl', label: t('settings.language.options.uzCyrl') },
      { code: 'en', label: t('settings.language.options.en') },
      { code: 'ru', label: t('settings.language.options.ru') },
    ],
    [t]
  );

  const selectLanguage = async (code: string) => {
    setSelected(code);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    await i18n.changeLanguage(code);
  };

  const handleContinue = async () => {
    try {
      setSaving(true);
      if (!selected) return;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, selected);
      await i18n.changeLanguage(selected);
      onContinue();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('languageIntro.title')}</Text>
          <Text style={styles.subtitle}>{t('languageIntro.subtitle')}</Text>

          <Card style={styles.card}>
            {languageOptions.map((option, idx) => {
              const active = selected === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.optionRow,
                    idx !== languageOptions.length - 1 && styles.optionDivider,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => selectLanguage(option.code)}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <View style={styles.optionRight}>
                    {active && <Check size={20} color={PRIMARY} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>

          <Button
            size='lg'
            style={styles.primaryButton}
            onPress={handleContinue}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={TEXT} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t('common.continue')}
              </Text>
            )}
          </Button>
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
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 16,
    padding: 0,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  optionLabel: {
    color: TEXT,
    fontSize: 15,
  },
  optionRight: {
    width: 24,
    alignItems: 'flex-end',
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
});
