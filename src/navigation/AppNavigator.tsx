import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/config/constants';
import { View, Text, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import OTPScreen from '@/screens/auth/OTPScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';

// Main App Screens
import HomeScreen from '@/screens/main/HomeScreen';
import XRayScreen from '@/screens/main/XRayScreen';
import MessagesScreen from '@/screens/main/MessagesScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import ProgressScreen from '@/screens/main/ProgressScreen';
import IoTKneeBandScreen from '@/screens/main/IoTKneeBandScreen';
import AppointmentsScreen from '@/screens/main/AppointmentsScreen';
import StepCounterScreen from '@/screens/main/StepCounterScreen';
import ActivityScreen from '@/screens/main/ActivityScreen';
import ExercisePlansScreen from '@/screens/main/ExercisePlansScreen';
import DietPlansScreen from '@/screens/main/DietPlansScreen';

// Detail Screens
import AnalysisDetailScreen from '@/screens/details/AnalysisDetailScreen';
import ConversationScreen from '@/screens/details/ConversationScreen';
import PostDetailScreen from '@/screens/details/PostDetailScreen';
import XRayUploadScreen from '@/screens/main/XRayUploadScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  OTP: { email: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  XRay: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Progress: undefined;
  AnalysisDetail: { analysisId: string };
  Conversation: { userId: string; userName: string };
  PostDetail: { postId: string };
  XRayUpload: undefined;
  IoTKneeBand: undefined;
  Appointments: undefined;
  StepCounter: undefined;
  Activity: undefined;
  ExercisePlans: undefined;
  DietPlans: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator
    id="AuthStack"
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="OTP" component={OTPScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

const MainTabNavigator = () => (
  <MainTab.Navigator
    id="MainTab"
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'XRay':
            iconName = focused ? 'scan' : 'scan-outline';
            break;
          case 'Messages':
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'help-circle-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
      headerStyle: {
        backgroundColor: COLORS.surface,
      },
      headerTintColor: COLORS.text,
      headerTitleStyle: {
        fontWeight: '700',
      },
    })}
  >
    <MainTab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Dashboard' }}
    />
    <MainTab.Screen
      name="XRay"
      component={XRayScreen}
      options={{ title: 'Upload X-Ray' }}
    />
    <MainTab.Screen
      name="Messages"
      component={MessagesScreen}
      options={{ title: 'Messages' }}
    />
    <MainTab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </MainTab.Navigator>
);

const RootNavigator = () => (
  <RootStack.Navigator
    id="RootStack"
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.surface,
      },
      headerTintColor: COLORS.text,
      headerTitleStyle: {
        fontWeight: '700',
      },
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <RootStack.Screen
      name="MainTabs"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <RootStack.Screen
      name="Progress"
      component={ProgressScreen}
      options={{ title: 'Progress Tracking' }}
    />
    <RootStack.Screen
      name="AnalysisDetail"
      component={AnalysisDetailScreen}
      options={{ title: 'Analysis Details' }}
    />
    <RootStack.Screen
      name="Conversation"
      component={ConversationScreen}
      options={({ route }) => ({ title: route.params.userName })}
    />
    <RootStack.Screen
      name="PostDetail"
      component={PostDetailScreen}
      options={{ title: 'Post' }}
    />
    <RootStack.Screen
      name="XRayUpload"
      component={XRayUploadScreen}
      options={{ title: 'Upload X-Ray' }}
    />
    <RootStack.Screen
      name="IoTKneeBand"
      component={IoTKneeBandScreen}
      options={{ headerShown: false }}
    />
    <RootStack.Screen
      name="Appointments"
      component={AppointmentsScreen}
      options={{ title: 'Appointments' }}
    />
    <RootStack.Screen
      name="StepCounter"
      component={StepCounterScreen}
      options={{ headerShown: false }}
    />
    <RootStack.Screen
      name="Activity"
      component={ActivityScreen}
      options={{ headerShown: false }}
    />
    <RootStack.Screen
      name="ExercisePlans"
      component={ExercisePlansScreen}
      options={{ headerShown: false }}
    />
    <RootStack.Screen
      name="DietPlans"
      component={DietPlansScreen}
      options={{ headerShown: false }}
    />
  </RootStack.Navigator>
);

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ marginTop: 20, color: COLORS.text, fontSize: 16 }}>Loading KneeKlinic...</Text>
  </View>
);

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
