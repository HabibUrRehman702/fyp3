import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/config/constants';

interface CardProps extends ViewProps {
  variant?: 'default' | 'gradient';
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ variant = 'default', children, style, ...props }) => {
  if (variant === 'gradient') {
    return (
      <View style={[styles.container, style]} {...props}>
        <LinearGradient
          colors={[`${COLORS.primary}20`, `${COLORS.secondary}20`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
  },
});
