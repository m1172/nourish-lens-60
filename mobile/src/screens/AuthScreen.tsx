import { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Label } from '@/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      setEmailError(t('auth.emailError') || 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setPasswordError(t('auth.passwordError'));
      toast({
        variant: 'destructive',
        title: t('auth.passwordRequiredTitle'),
        description: t('auth.passwordRequiredDescription'),
      });
      return;
    }
    setEmailError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        const { error, user: newUser } = await signUp(trimmedEmail, password);
        
        if (newUser) {
          console.log('Sign up success', newUser.id);
          toast({
            title: t('auth.signUpSuccess') || 'Account created successfully!',
          });
          return;
        }
        
        if (error) {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.message,
          });
        }
      } else {
        // Sign in flow
        const { error, user: signedInUser } = await signIn(trimmedEmail, password);

        if (signedInUser) {
          console.log('Sign in success', signedInUser.id);
          toast({
            title: t('auth.welcomeToast'),
          });
          return;
        }

        if (error) {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.message,
          });
        } else {
          console.error('Sign in failed with no user or error');
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('auth.signInUnknown'),
          });
        }
      }
    } catch (err: any) {
      console.error('Auth exception', err);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err?.message ?? t('auth.signInUnknown'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'yourapp://auth-callback',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('auth.googleErrorTitle'),
        description: t('auth.googleErrorDescription'),
      });
    }
  };

  const handleApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'yourapp://auth-callback',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('auth.appleErrorTitle'),
        description: t('auth.appleErrorDescription'),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <ArrowLeft size={20} color={FG} />
        </TouchableOpacity>
        <Card style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>{t('auth.title')}</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? (t('auth.createAccount') || 'Create your account') : t('auth.welcomeBack')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.formField}>
              <Label htmlFor='email'>{t('auth.emailLabel') || 'Email'}</Label>
              <TextInput
                id='email'
                style={[
                  styles.modalInput,
                  emailError ? { borderColor: '#f97316' } : undefined,
                ]}
                placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
                placeholderTextColor={MUTED}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailError(null);
                }}
              />
              {emailError && (
                <Text style={styles.errorText}>{emailError}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.formField}>
              <Label htmlFor='password'>{t('auth.passwordLabel')}</Label>
              <View style={styles.passwordWrapper}>
                <TextInput
                  id='password'
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError(null);
                  }}
                  style={[styles.modalInput, styles.passwordInput]}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={MUTED} />
                  ) : (
                    <Eye size={18} color={MUTED} />
                  )}
                </TouchableOpacity>
              </View>
              {passwordError && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              style={styles.fullWidth}
              disabled={loading}
              onPress={handleSubmit}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <Loader2 size={16} style={styles.loaderIcon} />
                  <Text style={styles.buttonText}>{t('common.loading')}</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? (t('auth.signUp') || 'Sign Up') : t('auth.signIn')}
                </Text>
              )}
            </Button>

            {/* Toggle Sign In / Sign Up */}
            <TouchableOpacity
              style={styles.toggleWrapper}
              onPress={() => setIsSignUp((v) => !v)}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? (t('auth.haveAccount') || 'Already have an account? Sign In')
                  : (t('auth.noAccount') || "Don't have an account? Sign Up")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider: "Or continue with" */}
          <View style={styles.dividerWrapper}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerTextWrapper}>
              <Text style={styles.dividerText}>{t('auth.dividerText')}</Text>
            </View>
          </View>

          {/* Social buttons */}
          <View style={styles.socialWrapper}>
            {/* Google */}
            <Button
              variant='outline'
              style={styles.fullWidth}
              onPress={handleGoogle}
            >
              <View style={styles.socialContent}>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>
                  {t('auth.continueWithGoogle')}
                </Text>
              </View>
            </Button>

            {/* Apple */}
            <Button
              variant='outline'
              style={styles.fullWidth}
              onPress={handleApple}
            >
              <View style={styles.socialContent}>
                <Text style={styles.appleIconText}></Text>
                <Text style={styles.socialButtonText}>
                  {t('auth.continueWithApple')}
                </Text>
              </View>
            </Button>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const BG = '#020617';
const FG = '#F9FAFB';
const CARD_BG = '#020617';
const TEXT = '#F9FAFB';
const MUTED = '#6B7280';
const BORDER = '#1F2933';
const PRIMARY = '#22C55E';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 12,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 32,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
  },
  subtitle: {
    marginTop: 4,
    color: MUTED,
    fontSize: 14,
  },
  form: {
    rowGap: 12,
  },
  formField: {
    marginBottom: 8,
  },
  fullWidth: {
    width: '100%',
    marginTop: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderIcon: {
    marginRight: 8,
    color: TEXT,
  },
  buttonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerWrapper: {
    marginVertical: 24,
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: BORDER,
  },
  dividerTextWrapper: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    backgroundColor: BG,
  },
  dividerText: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: MUTED,
  },
  socialWrapper: {
    rowGap: 8,
  },
  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4285F4',
  },
  appleIconText: {
    fontSize: 18,
    marginRight: 8,
    color: TEXT,
  },
  socialButtonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleWrapper: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    color: PRIMARY,
    textDecorationLine: 'underline',
  },
  errorText: { color: '#f97316', fontSize: 12, marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 48,
    color: FG,
  },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 40 },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
});