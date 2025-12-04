import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mic, MicOff, Loader2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { supabase } from '../supabase/client';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../providers/AuthProvider';

const Voice: any = null;

const BG = '#020617';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const PRIMARY = '#22C55E';

export default function AddVoiceScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);

  // Setup Voice handlers
  useEffect(() => {
    if (Voice) {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechResults = onSpeechResults;

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  const onSpeechStart = () => {
    if (!Voice) return;
    setIsListening(true);
    setTranscript('');
  };

  const onSpeechEnd = () => {
    if (!Voice) return;
    setIsListening(false);
  };

  const onSpeechError = (e: any) => {
    console.log('Speech recognition error:', e);
    setIsListening(false);
    toast({
      variant: 'destructive',
      title: t('common.error'),
      description: t('addVoice.speechError'),
    });
  };

  const onSpeechResults = (e: any) => {
    const text = e.value?.[0] ?? '';
    setTranscript(text);
    if (text) {
      processVoiceInput(text);
    }
  };

  const startListening = async () => {
    if (!user || !Voice) {
      toast({
        variant: 'destructive',
        title: t('addVoice.unavailableTitle'),
        description: t('addVoice.unavailableDescription'),
      });
      return;
    }

    // On some Android devices you may want to check permissions separately
    try {
      setTranscript('');
      await Voice.start('en-US');
    } catch (error) {
      console.log('Voice start error:', error);
      toast({
        variant: 'destructive',
        title: t('addVoice.notSupportedTitle'),
        description: t('addVoice.notSupportedDescription'),
      });
    }
  };

  const processVoiceInput = async (text: string) => {
    if (!user) return;
    setProcessing(true);

    try {
      // Replace with your own env mechanism (e.g. react-native-config or expo-constants)
      const LOVABLE_API_KEY = process.env.EXPO_PUBLIC_LOVABLE_API_KEY ?? '';

      if (!LOVABLE_API_KEY) {
        throw new Error(t('addVoice.errorProcess'));
      }

      const response = await fetch(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content:
                  'Extract food items from user speech. Return JSON array with: [{name, quantity, unit, estimated_calories}]. Be reasonable with calorie estimates.',
              },
              {
                role: 'user',
                content: text,
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error(t('addVoice.errorProcess'));

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '[]';

      let items: any[] = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch (parseErr) {
        console.log('Failed to parse AI response:', content);
      }

      if (!items || items.length === 0) {
        toast({
          title: t('addVoice.noFoodTitle'),
          description: t('addVoice.noFoodDescription'),
        });
        return;
      }

      // Save meal
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: t('addVoice.voiceMealName'),
          logged_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (mealError) throw mealError;

      const itemsPayload = items.map((item: any) => ({
        meal_id: meal.id,
        calories: item.estimated_calories || 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        quantity: item.quantity || 1,
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      toast({
        title: t('common.success'),
        description: t('addVoice.successDescription'),
      });

      navigation.navigate('Home'); // equivalent to navigate('/')
    } catch (err: any) {
      console.log(err);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err?.message ?? t('addVoice.errorProcess'),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('addVoice.title')}</Text>

          <Card style={styles.card}>
            <View style={styles.cardInner}>
              {/* Circular icon area */}
              <View style={styles.iconWrapper}>
                {isListening ? (
                  <MicOff size={64} color={PRIMARY} style={styles.pulseAnim} />
                ) : processing ? (
                  <Loader2 size={64} color={PRIMARY} style={styles.spinAnim} />
                ) : (
                  <Mic size={64} color={PRIMARY} />
                )}
              </View>

              {isListening && (
                <Text style={[styles.mutedText, styles.pulseText]}>
                  {t('addVoice.listening')}
                </Text>
              )}

              {processing && (
                <Text style={styles.mutedText}>{t('addVoice.processing')}</Text>
              )}

              {transcript && !processing && (
                <Card style={styles.transcriptCard}>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </Card>
              )}

              {!isListening && !processing && !transcript && (
                <>
                  <Text style={styles.mutedText}>
                    {t('addVoice.instruction')}
                  </Text>
                  <Text style={styles.mutedSmall}>{t('addVoice.example')}</Text>
                </>
              )}

              <Button
                onPress={startListening}
                disabled={isListening || processing}
                size='lg'
                style={styles.mainButton}
              >
                <Text style={styles.mainButtonText}>
                  {isListening
                    ? t('addVoice.listening')
                    : processing
                    ? t('addVoice.processing')
                    : t('addVoice.startRecording')}
                </Text>
              </Button>
            </View>
          </Card>

          <Button
            variant='outline'
            onPress={() => navigation.navigate('Add')} // equivalent to navigate('/add')
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>{t('addVoice.back')}</Text>
          </Button>
        </View>

        {/* BottomNav rendered globally in your app layout */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingBottom: 20, // pb-20
  },
  container: {
    maxWidth: 600, // max-w-screen-sm
    alignSelf: 'center',
    width: '100%',
    padding: 16, // p-4
    rowGap: 16, // space-y-4
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },
  card: {
    padding: 16, // p-6-ish
  },
  cardInner: {
    alignItems: 'center',
    rowGap: 16,
  },
  iconWrapper: {
    width: 128,
    height: 128,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.1)', // bg-primary/10
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  mutedSmall: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
  },
  transcriptCard: {
    marginTop: 4,
    padding: 12,
    width: '100%',
    backgroundColor: '#111827', // bg-muted
  },
  transcriptText: {
    fontSize: 14,
    color: TEXT,
  },
  mainButton: {
    width: '100%',
    marginTop: 8,
  },
  mainButtonText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    width: '100%',
  },
  backButtonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },
  // simple visual hints (no real animation without reanimated)
  pulseAnim: {
    // visually hint at "animate-pulse" – real animation would use reanimated or Animated API
  },
  spinAnim: {
    // visually hint at "animate-spin"
  },
  pulseText: {
    // same, placeholder for pulse feel
  },
});
