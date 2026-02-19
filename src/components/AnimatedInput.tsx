import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, ANIMATION, RADIUS } from '@/config/constants';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface AnimatedInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: IoniconsName;
  rightIcon?: IoniconsName;
  onRightIconPress?: () => void;
  helpText?: string;
  success?: boolean;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  helpText,
  success,
  value,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const hasValue = value && value.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || hasValue ? 1 : 0,
      duration: ANIMATION.normal,
      useNativeDriver: false,
    }).start();

    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATION.normal,
      useNativeDriver: false,
    }).start();

    Animated.timing(glowAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATION.normal,
      useNativeDriver: false,
    }).start();
  }, [isFocused, hasValue]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const getBorderColor = () => {
    if (error) return COLORS.error;
    if (success) return COLORS.success;
    if (isFocused) return COLORS.primary;
    return COLORS.border;
  };

  const getLabelColor = () => {
    if (error) return COLORS.error;
    if (success) return COLORS.success;
    if (isFocused) return COLORS.primary;
    return COLORS.textMuted;
  };

  // Label moves up and to the left (accounting for icon space)
  const labelLeft = icon ? 48 : 16;
  
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, -10],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  // When label floats up, move it to align with the border (not the icon)
  const labelLeftAnimated = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [labelLeft, 12],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {/* Glow effect */}
      {isFocused && !error && (
        <Animated.View 
          style={[
            styles.glowEffect,
            { 
              opacity: glowOpacity,
              shadowColor: success ? COLORS.success : COLORS.primary,
            }
          ]} 
        />
      )}
      
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: getBorderColor(),
            borderWidth: borderWidth,
          },
        ]}
      >
        {/* Floating Label */}
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              top: labelTop,
              left: labelLeftAnimated,
              fontSize: labelFontSize,
              color: getLabelColor(),
              backgroundColor: isFocused || hasValue ? COLORS.surface : 'transparent',
            },
          ]}
        >
          {label}
        </Animated.Text>

        <View style={styles.inputContainer}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={20} 
              color={error ? COLORS.error : isFocused ? COLORS.primary : COLORS.textMuted} 
              style={styles.leftIcon} 
            />
          )}
          
          <TextInput
            style={[styles.input, icon && styles.inputWithIcon, style]}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={isSecure}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            {...props}
          />
          
          {secureTextEntry && (
            <TouchableOpacity onPress={toggleSecureEntry} style={styles.rightIcon}>
              <Ionicons
                name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
          
          {rightIcon && !secureTextEntry && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons name={rightIcon as any} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          
          {success && !error && (
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
          )}
        </View>
      </Animated.View>

      {/* Error Message */}
      {error && (
        <Animated.View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.md,
    ...SHADOWS.glow(COLORS.primary),
  },
  inputWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    paddingHorizontal: 6,
    zIndex: 10,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 56,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  inputWithIcon: {
    marginLeft: 12,
  },
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    padding: 8,
    marginRight: -8,
  },
  successIcon: {
    padding: 8,
    marginRight: -8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

export default AnimatedInput;
