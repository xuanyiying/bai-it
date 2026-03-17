import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

// Initialize i18n before any components that use it
import './src/i18n';

import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { BrowserScreen } from './src/screens/BrowserScreen';
import { VocabScreen } from './src/screens/VocabScreen';
import { SentencesScreen } from './src/screens/SentencesScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { WhitelistScreen } from './src/screens/WhitelistScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProficiencyTestScreen } from './src/screens/ProficiencyTestScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Browser: undefined;
  Whitelist: undefined;
  Settings: undefined;
  ProficiencyTest: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Vocab: undefined;
  Sentences: undefined;
  Stats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
              iconName = focused ? 'scan' : 'scan-outline';
              break;
            case 'Vocab':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Sentences':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Stats':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
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
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
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
            name="Settings"
            component={SettingsScreen}
            options={{
              title: t('settings.title'),
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
          <AppContent />
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
