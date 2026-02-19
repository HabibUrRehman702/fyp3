import { Platform } from 'react-native';

// API Base URL - Auto-detect based on platform
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com'; // Production
  }
  
  // Development: Use localhost for web, actual IP for physical devices
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  
  // For physical devices, use your computer's WiFi IP
  // Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) to find it
  return 'http://10.120.140.222:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'KneeKlinic',
  VERSION: '1.0.0',
  
  // OTP Configuration
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  
  // Image Upload
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  
  // Pagination
  POSTS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 50,
};

// Theme Colors - Enterprise Level Design System
export const COLORS = {
  // Primary brand colors
  primary: '#3B82F6', // Blue
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primaryGlow: 'rgba(59, 130, 246, 0.3)',
  
  // Secondary colors
  secondary: '#8B5CF6', // Purple
  secondaryGlow: 'rgba(139, 92, 246, 0.3)',
  accent: '#10B981', // Green
  accentGlow: 'rgba(16, 185, 129, 0.3)',
  
  // Status colors
  success: '#10B981',
  successLight: '#34D399',
  successGlow: 'rgba(16, 185, 129, 0.25)',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningGlow: 'rgba(245, 158, 11, 0.25)',
  error: '#EF4444',
  errorLight: '#F87171',
  errorGlow: 'rgba(239, 68, 68, 0.25)',
  info: '#3B82F6',
  
  // Neutral colors - Premium Dark Theme
  background: '#0A0F1C', // Deeper, richer dark
  surface: '#151B2B',    // Elevated surface
  surfaceLight: '#1E2742', // Lighter surface for cards
  card: '#232D45',       // Card background
  cardHover: '#2A3654',  // Card hover state
  border: '#2E3B52',     // Subtle borders
  borderLight: '#3D4F6F', // Lighter borders for focus
  
  // Text colors
  text: '#F8FAFC',       // Pure white text
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  
  // UI Elements
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Premium Gradients
  gradientStart: '#3B82F6',
  gradientEnd: '#8B5CF6',
  gradientStartAlt: '#10B981',
  gradientEndAlt: '#3B82F6',
  
  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(255, 255, 255, 0.08)',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

// Premium Shadow Presets
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  float: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
};

// Animation Timing
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    tension: 50,
    friction: 7,
  },
  springBouncy: {
    tension: 100,
    friction: 8,
  },
};

// Border Radius Presets
export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

// Spacing Scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@kneeklinic:token',
  USER: '@kneeklinic:user',
  HAS_ONBOARDED: '@kneeklinic:hasOnboarded',
};
