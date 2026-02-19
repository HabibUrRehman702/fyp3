import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS } from '@/config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  ExercisePlans: undefined;
  DietPlans: undefined;
  MainTabs: undefined;
};

type ActivityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ActivityScreen: React.FC = () => {
  const navigation = useNavigation<ActivityScreenNavigationProp>();

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const tipsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(card1Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(card2Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(tipsAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const AnimatedOptionCard = ({ 
    anim, 
    icon, 
    title, 
    description, 
    features, 
    colors, 
    onPress 
  }: { 
    anim: Animated.Value; 
    icon: string; 
    title: string; 
    description: string; 
    features: string[];
    colors: [string, string];
    onPress: () => void;
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.optionCard}>
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name={icon as any} size={36} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{title}</Text>
              <Text style={styles.optionDescription}>{description}</Text>
              <View style={styles.optionFeatures}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.featureDot, { backgroundColor: colors[0] }]} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color={colors[0]} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity & Food</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: headerAnim,
              transform: [{
                scale: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <Ionicons name="heart" size={32} color={COLORS.white} />
              </View>
              <Text style={styles.heroTitle}>Manage Your Health Journey</Text>
              <Text style={styles.heroText}>
                Track your daily exercises and nutrition to help manage osteoarthritis symptoms 
                and improve your knee health.
              </Text>
            </View>
            <View style={styles.heroDecor} />
          </LinearGradient>
        </Animated.View>

        {/* Activity Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Choose Your Activity</Text>
          
          <AnimatedOptionCard
            anim={card1Anim}
            icon="fitness"
            title="Exercise Plans"
            description="Workout plans designed for osteoarthritis patients based on severity level"
            features={['3 Severity Levels', 'Daily Tracking', 'Progress Reports']}
            colors={['#4CAF50', '#81C784']}
            onPress={() => navigation.navigate('ExercisePlans')}
          />

          <AnimatedOptionCard
            anim={card2Anim}
            icon="nutrition"
            title="Diet Plans"
            description="Anti-inflammatory diet plans to reduce joint pain and inflammation"
            features={['Meal Plans', 'Water Tracking', 'Nutrition Tips']}
            colors={['#FF9800', '#FFB74D']}
            onPress={() => navigation.navigate('DietPlans')}
          />
        </View>

        {/* Tips Section */}
        <Animated.View 
          style={[
            styles.tipsSection,
            {
              opacity: tipsAnim,
              transform: [{
                translateY: tipsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.tipsHeader}>
            <View style={styles.tipsIconContainer}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.tipsTitle}>Health Tips</Text>
          </View>
          <View style={styles.tipCard}>
            {[
              'Consistency is key - aim for daily exercise and healthy eating',
              'Start with the plan that matches your current condition',
              'Stay hydrated - water helps lubricate your joints',
              'Track your progress to see improvements over time',
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  heroGradient: {
    borderRadius: RADIUS.xl,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.large,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  heroDecor: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.medium,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  optionFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsSection: {
    padding: 20,
    marginTop: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  tipCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ActivityScreen;
