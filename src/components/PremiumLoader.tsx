import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '@/config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  variant?: 'spinner' | 'pulse' | 'dots';
  color?: string;
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  size = 'medium',
  text,
  variant = 'pulse',
  color = COLORS.primary,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }

    if (variant === 'spinner') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }

    if (variant === 'dots') {
      const animateDot = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        );
      };

      Animated.parallel([
        animateDot(dot1Anim, 0),
        animateDot(dot2Anim, 150),
        animateDot(dot3Anim, 300),
      ]).start();
    }
  }, [variant]);

  const getSize = () => {
    switch (size) {
      case 'small': return 40;
      case 'large': return 80;
      default: return 60;
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (variant === 'dots') {
    return (
      <View style={styles.container}>
        <View style={styles.dotsContainer}>
          {[dot1Anim, dot2Anim, dot3Anim].map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: color,
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [{
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  }],
                },
              ]}
            />
          ))}
        </View>
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  if (variant === 'spinner') {
    return (
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <View style={[styles.spinner, { width: getSize(), height: getSize() }]}>
            <LinearGradient
              colors={[color, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.spinnerGradient, { width: getSize(), height: getSize() }]}
            />
          </View>
        </Animated.View>
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  // Default: Pulse
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: getSize(),
            height: getSize(),
            backgroundColor: color,
            opacity: pulseAnim,
            transform: [{
              scale: pulseAnim.interpolate({
                inputRange: [0.3, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = RADIUS.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showAvatar = true,
}) => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonCardHeader}>
        {showAvatar && <Skeleton width={48} height={48} borderRadius={24} />}
        <View style={styles.skeletonCardTitle}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <View style={styles.skeletonCardBody}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '70%' : '100%'}
            height={14}
            style={{ marginBottom: index === lines - 1 ? 0 : 10 }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pulse: {
    borderRadius: 100,
  },
  spinner: {
    borderRadius: 100,
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  spinnerGradient: {
    position: 'absolute',
    borderRadius: 100,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  skeleton: {
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 16,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonCardTitle: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonCardBody: {},
});

export default PremiumLoader;
