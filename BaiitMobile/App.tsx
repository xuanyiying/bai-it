import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationState, PartialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import './src/i18n';

import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { BrowserProvider } from './src/contexts/BrowserContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { BrowserScreen } from './src/screens/BrowserScreen';
import { VocabScreen } from './src/screens/VocabScreen';
import { SentencesScreen } from './src/screens/SentencesScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { WhitelistScreen } from './src/screens/WhitelistScreen';
import { ProficiencyTestScreen } from './src/screens/ProficiencyTestScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Dictionary } from './src/services/dictionary';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Browser: undefined;
  Whitelist: undefined;
  ProficiencyTest: undefined;
  Subscription: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Vocab: undefined;
  Sentences: undefined;
  Stats: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const NAVIGATION_STATE_KEY = 'navigation_state';

function MainTabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Vocab':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'Sentences':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Stats':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return (
            <Animated.View
              entering={focused ? FadeIn.duration(200) : undefined}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={iconName} size={size} color={color} />
            </Animated.View>
          );
        },
        tabBarActiveTintColor: theme.colors.tabBar.active,
        tabBarInactiveTintColor: theme.colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar.background,
          borderTopColor: theme.colors.tabBar.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home') }}
      />
      <Tab.Screen
        name="Vocab"
        component={VocabScreen}
        options={{ title: t('tabs.vocab') }}
      />
      <Tab.Screen
        name="Sentences"
        component={SentencesScreen}
        options={{ title: t('tabs.sentences') }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: t('tabs.stats') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isDictionaryReady, setIsDictionaryReady] = useState(false);
  const [initialState, setInitialState] = useState<PartialState<NavigationState> | undefined>();

  useEffect(() => {
    const initApp = async () => {
      try {
        await Dictionary.initialize();
        setIsDictionaryReady(true);
      } catch (error) {
        console.error('词典初始化失败:', error);
        setIsDictionaryReady(true);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    const loadNavigationState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('加载导航状态失败:', error);
      } finally {
        setIsNavigationReady(true);
      }
    };

    loadNavigationState();
  }, []);

  const onStateChange = useCallback((state: NavigationState | undefined) => {
    if (state) {
      AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state)).catch(() => { });
    }
  }, []);

  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  };

  if (isLoading || !isNavigationReady || !isDictionaryReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "Main" : "Login"}
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Browser"
            component={BrowserScreen}
            options={{
              title: t('browser.title'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Whitelist"
            component={WhitelistScreen}
            options={{
              title: t('home.manageWhitelist'),
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerStyle: {
                backgroundColor: theme.colors.surface,
              },
              headerTintColor: theme.colors.text,
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          />

          <Stack.Screen
            name="ProficiencyTest"
            component={ProficiencyTestScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserProvider>
            <AppContent />
          </BrowserProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
