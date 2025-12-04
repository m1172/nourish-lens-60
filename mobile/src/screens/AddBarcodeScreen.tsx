// AddBarcodeScreen.tsx
import { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Barcode } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../hooks/use-toast';

const BACKGROUND = '#020617';
const MUTED = '#9CA3AF';
const TEXT = '#F9FAFB';
const PRIMARY = '#6366F1';

export default function AddBarcodeScreen() {
  const navigation = useNavigation<any>();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');
  const { t } = useTranslation();

  const scanBarcode = () => {
    toast({
      title: t('common.comingSoonTitle'),
      description: t('common.comingSoonDescription'),
    });
  };

  const lookupBarcode = () => {
    if (!barcode.trim()) return;

    toast({
      title: t('common.comingSoonTitle'),
      description: t('common.comingSoonDescription'),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('addBarcode.title')}</Text>

          {/* Scanner Card */}
          <Card style={styles.scannerCard}>
            <View style={styles.centeredContent}>
              <Barcode size={96} color={MUTED} style={{ marginBottom: 16 }} />
              <Text style={styles.description}>
                {t('addBarcode.description')}
              </Text>
              <Button onPress={scanBarcode} style={{ width: '100%' }}>
                {t('addBarcode.openScanner')}
              </Button>
            </View>
          </Card>

          <Text style={styles.orText}>{t('common.or')}</Text>

          {/* Manual entry card */}
          <Card style={styles.manualCard}>
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>{t('addBarcode.manualLabel')}</Text>
              <Input
                placeholder={t('addBarcode.placeholder')}
                value={barcode}
                onChangeText={setBarcode}
                keyboardType='numeric'
                returnKeyType='done'
                onSubmitEditing={lookupBarcode}
              />
            </View>
            <Button onPress={lookupBarcode} style={{ width: '100%' }}>
              {t('addBarcode.lookup')}
            </Button>
          </Card>

          <Button
            variant='outline'
            onPress={() => navigation.navigate('Add')}
            style={{ width: '100%', marginTop: 8 }}
          >
            {t('addBarcode.back')}
          </Button>
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
  container: {
    maxWidth: 600, // max-w-screen-sm
    alignSelf: 'center',
    width: '100%',
    padding: 16, // p-4
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },
  scannerCard: {
    padding: 24, // p-6
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  description: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 14,
  },
  orText: {
    textAlign: 'center',
    fontSize: 13,
    color: MUTED,
  },
  manualCard: {
    padding: 16, // p-4
    gap: 16,
  },
  label: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
});
