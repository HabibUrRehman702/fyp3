import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, ANIMATION, RADIUS } from '@/config/constants';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'outlined';
  gradientColors?: [string, string, ...string[]];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  delay?: number;
  animateOnMount?: boolean;
  glowColor?: string;
  borderAccent?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  variant = 'default',
  gradientColors,
  style,
  contentStyle,
  delay = 0,
  animateOnMount = true,
  glowColor,
  borderAccent,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(animateOnMount ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animateOnMount ? 30 : 0)).current;

  React.useEffect(() => {
    if (animateOnMount) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION.slow,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: ANIMATION.spring.tension,
          friction: ANIMATION.spring.friction,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        tension: ANIMATION.springBouncy.tension,
        friction: ANIMATION.springBouncy.friction,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: ANIMATION.spring.tension,
        friction: ANIMATION.spring.friction,
        useNativeDriver: true,
      }).start();
    }
  };

  const getCardStyle = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.card];

    switch (variant) {
      case 'elevated':
        baseStyles.push(styles.cardElevated, SHADOWS.large as ViewStyle);
        break;
      case 'glass':
        baseStyles.push(styles.cardGlass);
        break;
      case 'outlined':
        baseStyles.push(styles.cardOutlined);
        break;
      case 'gradient':
        baseStyles.push(styles.cardGradient);
        break;
      default:
        baseStyles.push(styles.cardDefault, SHADOWS.card as ViewStyle);
    }

    if (borderAccent) {
      baseStyles.push({ borderLeftWidth: 4, borderLeftColor: borderAccent });
    }

    if (glowColor && variant !== 'glass') {
      baseStyles.push(SHADOWS.glow(glowColor) as ViewStyle);
    }

    return baseStyles;
  };

  const renderCardContent = () => {
    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={gradientColors || [COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientContent, contentStyle]}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    );
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      <CardWrapper
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={getCardStyle()}
      >
        {/* Glass effect border */}
        {variant === 'glass' && (
          <View style={styles.glassBorder} />
        )}
        {renderCardContent()}
      </CardWrapper>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: COLORS.surface,
  },
  cardElevated: {
    backgroundColor: COLORS.surfaceLight,
  },
  cardGlass: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardOutlined: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardGradient: {
    backgroundColor: 'transparent',
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.glassBorder,
  },
  content: {
    padding: 20,
  },
  gradientContent: {
    padding: 20,
  },
});

export default AnimatedCard;
