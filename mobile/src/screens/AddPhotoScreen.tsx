// AddPhotoScreen.tsx
import { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Camera, X } from 'lucide-react-native';

import { supabase } from '../supabase/client';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '../ui/button';
import { Card } from '@/ui/card';
import { Input } from '@/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type SuggestedItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const BG = '#020617';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const BORDER = '#1F2937';

export default function AddPhotoScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [fileAsset, setFileAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    // Ask permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast({
        variant: 'destructive',
        title: t('addPhoto.cameraDeniedTitle'),
        description: t('addPhoto.cameraDeniedDescription'),
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || !result.assets.length) return;

    const asset = result.assets[0];
    setFileAsset(asset);
    setPreview(asset.uri);
    setSuggestions([]);
  };

  const uploadAndAnalyze = async () => {
    if (!fileAsset || !user) return;

    try {
      setLoading(true);

      // Convert local file URI to Blob for Supabase upload
      const response = await fetch(fileAsset.uri);
      const blob = await response.blob();

      const fileExt = fileAsset.uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('meal-photos')
        .getPublicUrl(filePath);

      const imageUrl = publicData.publicUrl;

      const { data, error } = await supabase.functions.invoke(
        'food-from-image',
        {
          body: { imageUrl },
        }
      );

      if (error) throw error;

      setSuggestions(data.items || []);

      if (!data.items || data.items.length === 0) {
        toast({
          title: t('addPhoto.noFoodTitle'),
          description: t('addPhoto.noFoodDescription'),
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err?.message ?? t('addPhoto.errorAnalyze'),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (
    index: number,
    field: keyof SuggestedItem,
    value: number
  ) => {
    setSuggestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMeal = async () => {
    if (!user || suggestions.length === 0) return;

    try {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: t('addPhoto.photoMealName'),
          logged_at: new Date().toISOString(),
          photo_url: preview,
        })
        .select('*')
        .single();

      if (mealError) throw mealError;

      const itemsPayload = suggestions.map((s) => ({
        meal_id: meal.id,
        calories: s.calories,
        protein: s.protein,
        carbs: s.carbs,
        fats: s.fats,
        quantity: s.grams,
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      toast({
        title: t('common.success'),
        description: t('addSearch.saveSuccess'),
      });

      navigation.navigate('Home'); // same as navigate('/')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err?.message || t('addPhoto.errorSave'),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('addPhoto.title')}</Text>

          {/* Pick / Take photo button */}
          <Button
            variant='outline'
            style={styles.photoButton}
            onPress={handlePickImage}
          >
            <View style={styles.photoButtonInner}>
              <Camera size={32} color={TEXT} />
              <Text style={styles.photoButtonText}>
                {preview
                  ? t('addPhoto.changePhoto')
                  : t('addPhoto.takePhoto')}
              </Text>
            </View>
          </Button>

          {preview && (
            <Image
              source={{ uri: preview }}
              style={styles.previewImage}
              resizeMode='cover'
            />
          )}

          <Button
            disabled={!fileAsset || loading}
            onPress={uploadAndAnalyze}
            style={styles.fullWidth}
          >
            {loading ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator
                  size='small'
                  color={TEXT}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.buttonText}>{t('addPhoto.analyzing')}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('addPhoto.analyze')}</Text>
            )}
          </Button>

          {suggestions.length > 0 && (
            <View style={{ marginTop: 16, width: '100%' }}>
              <Text style={styles.sectionTitle}>{t('addPhoto.detected')}</Text>
              <View style={{ height: 8 }} />
              {suggestions.map((item, idx) => (
                <Card key={idx} style={styles.foodCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Button
                      variant='ghost'
                      size='sm'
                      style={styles.removeButton}
                      onPress={() => removeItem(idx)}
                    >
                      <X size={16} color={MUTED} />
                    </Button>
                  </View>

                  {/* grid grid-cols-2 gap-2 */}
                  <View style={styles.foodGrid}>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t('addPhoto.fields.grams')}
                      </Text>
                      <Input
                        keyboardType='numeric'
                        value={String(item.grams)}
                        onChangeText={(text) =>
                          updateItem(idx, 'grams', Number(text) || 0)
                        }
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t('addPhoto.fields.calories')}
                      </Text>
                      <Input
                        keyboardType='numeric'
                        value={String(item.calories)}
                        onChangeText={(text) =>
                          updateItem(idx, 'calories', Number(text) || 0)
                        }
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t('addPhoto.fields.protein')}
                      </Text>
                      <Input
                        keyboardType='numeric'
                        value={String(item.protein)}
                        onChangeText={(text) =>
                          updateItem(idx, 'protein', Number(text) || 0)
                        }
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t('addPhoto.fields.carbs')}
                      </Text>
                      <Input
                        keyboardType='numeric'
                        value={String(item.carbs)}
                        onChangeText={(text) =>
                          updateItem(idx, 'carbs', Number(text) || 0)
                        }
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t('addPhoto.fields.fats')}
                      </Text>
                      <Input
                        keyboardType='numeric'
                        value={String(item.fats)}
                        onChangeText={(text) =>
                          updateItem(idx, 'fats', Number(text) || 0)
                        }
                      />
                    </View>
                  </View>
                </Card>
              ))}

              <Button onPress={saveMeal} style={styles.fullWidth}>
                <Text style={styles.buttonText}>{t('addPhoto.saveMeal')}</Text>
              </Button>
            </View>
          )}
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
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingBottom: 20, // pb-20
  },
  container: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 8,
  },
  photoButton: {
    height: 192, // h-48
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderColor: BORDER,
    width: '100%',
  },
  photoButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 15,
    color: TEXT,
  },
  previewImage: {
    width: '100%',
    maxHeight: 256,
    borderRadius: 12,
    marginTop: 8,
  },
  fullWidth: {
    width: '100%',
    marginTop: 8,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
  },
  foodCard: {
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontWeight: '600',
    fontSize: 15,
    color: TEXT,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  field: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
});
