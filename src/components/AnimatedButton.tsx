import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, ANIMATION, RADIUS } from '@/config/constants';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface AnimatedButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: IoniconsName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  glowColor?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  glowColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        tension: ANIMATION.springBouncy.tension,
        friction: ANIMATION.springBouncy.friction,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: ANIMATION.spring.tension,
        friction: ANIMATION.spring.friction,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getGradientColors = (): [string, string, ...string[]] => {
    switch (variant) {
      case 'primary':
        return [COLORS.gradientStart, COLORS.gradientEnd];
      case 'secondary':
        return [COLORS.secondary, '#A78BFA'];
      case 'success':
        return [COLORS.success, '#34D399'];
      case 'danger':
        return [COLORS.error, '#F87171'];
      default:
        return [COLORS.gradientStart, COLORS.gradientEnd];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const getShadowStyle = () => {
    if (disabled || variant === 'ghost') return {};
    
    const shadowColor = glowColor || (variant === 'success' ? COLORS.success : 
                        variant === 'danger' ? COLORS.error : COLORS.primary);
    
    return {
      ...SHADOWS.glow(shadowColor),
    };
  };

  const isDisabled = disabled || loading;
  const hasGradient = ['primary', 'secondary', 'success', 'danger'].includes(variant);

  const renderContent = () => (
    <View style={[styles.contentContainer, styles[`content_${size}`]]}>
      {loading ? (
        <ActivityIndicator 
          color={getTextColor()} 
          size={size === 'small' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={getIconSize()} 
              color={getTextColor()} 
              style={styles.iconLeft}
            />
          )}
          <Text style={[
            styles.text, 
            styles[`text_${size}`],
            { color: getTextColor() }
          ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={getIconSize()} 
              color={getTextColor()} 
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  const buttonStyles = [
    styles.button,
    styles[`button_${size}`],
    variant === 'outline' && styles.buttonOutline,
    variant === 'ghost' && styles.buttonGhost,
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
  ];

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        !isDisabled && getShadowStyle(),
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={fullWidth ? styles.fullWidth : undefined}
      >
        {hasGradient && !isDisabled ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={buttonStyles}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          <View style={[
            buttonStyles,
            isDisabled && { backgroundColor: COLORS.border }
          ]}>
            {renderContent()}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  button_small: {
    borderRadius: RADIUS.sm,
  },
  button_medium: {
    borderRadius: RADIUS.md,
  },
  button_large: {
    borderRadius: RADIUS.lg,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content_small: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  content_medium: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  content_large: {
    paddingVertical: 18,
    paddingHorizontal: 36,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});

export default AnimatedButton;
