import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/providers/AuthProvider';
import {
  navigationRef,
  onNavigationReady,
} from './src/navigation/navigationRef';
import i18n from './src/i18n';

const queryClient = new QueryClient();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f7f8fa',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* <SafeAreaView style={{ flex: 1 }}> */}
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>
              <NavigationContainer
                ref={navigationRef}
                theme={navigationTheme}
                onReady={onNavigationReady}
              >
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style='dark' />
            </AuthProvider>
          </I18nextProvider>
        </QueryClientProvider>
        {/* </SafeAreaView> */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
