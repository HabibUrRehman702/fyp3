import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '@/config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  showIcon?: boolean;
}

interface ToastRef {
  show: (config: ToastConfig) => void;
  hide: () => void;
}

// Toast Manager - singleton pattern
let toastRef: ToastRef | null = null;

export const showToast = (config: ToastConfig) => {
  if (toastRef) {
    toastRef.show(config);
  }
};

export const hideToast = () => {
  if (toastRef) {
    toastRef.hide();
  }
};

export const Toast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({
    title: '',
    message: '',
    type: 'info',
    duration: 3000,
    showIcon: true,
  });

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Register ref
    toastRef = {
      show: (newConfig) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setConfig({ ...newConfig, duration: newConfig.duration || 3000 });
        setVisible(true);

        // Animate in
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();

        // Auto hide
        timeoutRef.current = setTimeout(() => {
          hide();
        }, newConfig.duration || 3000);
      },
      hide: () => hide(),
    };

    return () => {
      toastRef = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const getTypeStyles = () => {
    switch (config.type) {
      case 'success':
        return {
          backgroundColor: COLORS.success,
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error,
          icon: 'close-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning,
          icon: 'warning' as const,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: 'information-circle' as const,
        };
    }
  };

  if (!visible) return null;

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hide}
        style={[
          styles.toast,
          { backgroundColor: typeStyles.backgroundColor },
        ]}
      >
        {config.showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name={typeStyles.icon} size={28} color={COLORS.white} />
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.title}>{config.title}</Text>
          {config.message && (
            <Text style={styles.message}>{config.message}</Text>
          )}
        </View>
        <TouchableOpacity onPress={hide} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.lg,
    ...SHADOWS.large,
  },
  iconContainer: {
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default Toast;
