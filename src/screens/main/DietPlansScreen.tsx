import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS } from '@/config/constants';
import apiClient from '@/services/api';

interface Meal {
  id: string;
  type: string;
  name: string;
  description: string;
}

interface DietPlan {
  name: string;
  description: string;
  meals: Meal[];
}

interface Plans {
  beginning: DietPlan;
  moderate: DietPlan;
  severe: DietPlan;
}

type SeverityLevel = 'beginning' | 'moderate' | 'severe';

const DietPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<SeverityLevel | null>(null);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [completedMeals, setCompletedMeals] = useState<string[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalDays: 0, avgCompletion: 0, avgWaterIntake: 0, currentStreak: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (!loading) {
      Animated.stagger(150, [
        Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(statsAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(cardsAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load plans and today's log in parallel
      const [plansRes, todayRes, historyRes] = await Promise.all([
        apiClient.get('/activity/diet/plans'),
        apiClient.get('/activity/diet/today'),
        apiClient.get('/activity/diet/history?days=30')
      ]);

      setPlans(plansRes.data.plans);
      
      if (todayRes.data.log) {
        setSelectedPlan(todayRes.data.log.severityLevel);
        setCompletedMeals(todayRes.data.log.completedMeals || []);
        setWaterIntake(todayRes.data.log.waterIntake || 0);
      }

      if (historyRes.data.stats) {
        setStats(historyRes.data.stats);
      }
    } catch (error) {
      console.error('Error loading diet data:', error);
      showAlert('Error', 'Failed to load diet plans');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(message);
        if (confirmed && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(message);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleSelectPlan = (level: SeverityLevel) => {
    if (selectedPlan && selectedPlan !== level && completedMeals.length > 0) {
      showAlert(
        'Change Plan?',
        'Changing plans will reset your progress for today. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change',
            onPress: () => {
              setSelectedPlan(level);
              setCompletedMeals([]);
              setWaterIntake(0);
            }
          }
        ]
      );
    } else {
      setSelectedPlan(level);
      setCompletedMeals([]);
      setWaterIntake(0);
    }
  };

  const saveProgress = async (meals: string[], water: number) => {
    if (!selectedPlan || !plans) return;

    try {
      setSaving(true);
      const totalMeals = plans[selectedPlan].meals.length;
      
      await apiClient.post('/activity/diet/log', {
        severityLevel: selectedPlan,
        completedMeals: meals,
        totalMeals,
        waterIntake: water
      });
      
      // Show save success
      setLastSaved(new Date());
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving diet:', error);
      showAlert('Error', 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleMeal = async (mealId: string) => {
    if (!selectedPlan || !plans) return;

    const newCompleted = completedMeals.includes(mealId)
      ? completedMeals.filter(id => id !== mealId)
      : [...completedMeals, mealId];

    setCompletedMeals(newCompleted);
    await saveProgress(newCompleted, waterIntake);
  };

  const adjustWater = async (delta: number) => {
    const newWater = Math.max(0, Math.min(12, waterIntake + delta));
    setWaterIntake(newWater);
    await saveProgress(completedMeals, newWater);
  };

  const getCompletionPercentage = () => {
    if (!selectedPlan || !plans) return 0;
    const total = plans[selectedPlan].meals.length;
    return total > 0 ? Math.round((completedMeals.length / total) * 100) : 0;
  };

  const getPlanIcon = (level: SeverityLevel) => {
    switch (level) {
      case 'beginning': return 'leaf';
      case 'moderate': return 'nutrition';
      case 'severe': return 'medkit';
    }
  };

  const getPlanColor = (level: SeverityLevel) => {
    switch (level) {
      case 'beginning': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'restaurant';
      case 'dinner': return 'moon';
      case 'snack': return 'cafe';
      case 'morning': return 'partly-sunny';
      case 'night': return 'cloudy-night';
      case 'hydration': return 'water';
      case 'supplement': return 'fitness';
      default: return 'nutrition';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>Loading diet plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
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
          <Text style={styles.headerTitle}>Diet Plans</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Stats Bar */}
        <Animated.View
          style={[
            styles.statsBarContainer,
            {
              opacity: statsAnim,
              transform: [{
                scale: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FF9800', '#FFB74D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsBar}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak 🔥</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avgCompletion}%</Text>
              <Text style={styles.statLabel}>Avg Complete</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avgWaterIntake?.toFixed(1) || 0}</Text>
              <Text style={styles.statLabel}>Avg Water 💧</Text>
            </View>
          </LinearGradient>
        </Animated.View>

      {/* Plan Selection */}
      {!selectedPlan ? (
        <View style={styles.planSelection}>
          <Text style={styles.sectionTitle}>Select Your Diet Plan</Text>
          <Text style={styles.sectionSubtitle}>
            Choose an anti-inflammatory diet plan based on your condition
          </Text>

          {plans && (Object.keys(plans) as SeverityLevel[]).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.planCard, { borderLeftColor: getPlanColor(level) }]}
              onPress={() => handleSelectPlan(level)}
            >
              <View style={[styles.planIconContainer, { backgroundColor: getPlanColor(level) + '20' }]}>
                <Ionicons name={getPlanIcon(level)} size={28} color={getPlanColor(level)} />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plans[level].name}</Text>
                <Text style={styles.planDescription}>{plans[level].description}</Text>
                <Text style={styles.mealCount}>
                  {plans[level].meals.length} items to track
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        /* Diet Checklist */
        <View style={styles.dietSection}>
          {/* Current Plan Header */}
          <View style={styles.currentPlanHeader}>
            <View>
              <Text style={styles.currentPlanLabel}>Today's Nutrition</Text>
              <Text style={styles.currentPlanName}>
                {plans && plans[selectedPlan].name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePlanButton}
              onPress={() => setSelectedPlan(null)}
            >
              <Text style={styles.changePlanText}>Change Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Water Intake Tracker */}
          <View style={styles.waterTracker}>
            <View style={styles.waterHeader}>
              <Ionicons name="water" size={24} color="#2196F3" />
              <Text style={styles.waterTitle}>Water Intake</Text>
            </View>
            <View style={styles.waterControls}>
              <TouchableOpacity 
                style={styles.waterButton}
                onPress={() => adjustWater(-1)}
              >
                <Ionicons name="remove" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.waterDisplay}>
                <Text style={styles.waterCount}>{waterIntake}</Text>
                <Text style={styles.waterLabel}>glasses</Text>
              </View>
              <TouchableOpacity 
                style={styles.waterButton}
                onPress={() => adjustWater(1)}
              >
                <Ionicons name="add" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.waterGlasses}>
              {[...Array(8)].map((_, i) => (
                <Ionicons 
                  key={i} 
                  name="water" 
                  size={20} 
                  color={i < waterIntake ? '#2196F3' : COLORS.border} 
                />
              ))}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Meal Completion</Text>
              <Text style={styles.progressPercent}>{getCompletionPercentage()}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${getCompletionPercentage()}%`,
                    backgroundColor: getPlanColor(selectedPlan)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressSubtext}>
              {completedMeals.length} of {plans?.[selectedPlan].meals.length || 0} items completed
            </Text>
          </View>

          {/* Meal List */}
          <Text style={styles.mealListTitle}>Today's Meals & Nutrition</Text>
          {plans && plans[selectedPlan].meals.map((meal) => {
            const isCompleted = completedMeals.includes(meal.id);
            return (
              <TouchableOpacity
                key={meal.id}
                style={[
                  styles.mealItem,
                  isCompleted && styles.mealItemCompleted
                ]}
                onPress={() => toggleMeal(meal.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  isCompleted && { backgroundColor: getPlanColor(selectedPlan), borderColor: getPlanColor(selectedPlan) }
                ]}>
                  {isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <View style={styles.mealIconContainer}>
                  <Ionicons name={getMealTypeIcon(meal.type)} size={20} color={getPlanColor(selectedPlan)} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{meal.type}</Text>
                  <Text style={[
                    styles.mealName,
                    isCompleted && styles.mealNameCompleted
                  ]}>
                    {meal.name}
                  </Text>
                  <Text style={styles.mealDesc}>{meal.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Save Status Indicator */}
          <View style={styles.saveStatusContainer}>
            {saving ? (
              <View style={styles.savingIndicator}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.savingText}>Saving to database...</Text>
              </View>
            ) : showSaveSuccess ? (
              <View style={styles.saveSuccessIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.saveSuccessText}>Saved successfully!</Text>
              </View>
            ) : lastSaved ? (
              <View style={styles.lastSavedIndicator}>
                <Ionicons name="cloud-done-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.lastSavedText}>Last saved at {formatLastSaved()}</Text>
              </View>
            ) : null}
          </View>

          {/* Completion Message */}
          {getCompletionPercentage() === 100 && (
            <View style={styles.completionMessage}>
              <Text style={styles.completionEmoji}>🥗</Text>
              <Text style={styles.completionTitle}>Nutrition Goals Met!</Text>
              <Text style={styles.completionText}>
                Excellent! You've followed your diet plan today. Keep up the great work!
              </Text>
            </View>
          )}
        </View>
      )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
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
    paddingBottom: 20,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  statsBarContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  planSelection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  mealCount: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  dietSection: {
    padding: 16,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPlanLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  changePlanButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changePlanText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
  },
  waterTracker: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  waterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterDisplay: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  waterCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  waterLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  waterGlasses: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  mealListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  mealItemCompleted: {
    backgroundColor: '#FFF3E0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  mealNameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  mealDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  saveStatusContainer: {
    marginBottom: 12,
  },
  savingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  savingText: {
    marginLeft: 8,
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '500',
  },
  saveSuccessIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  saveSuccessText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  lastSavedIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  lastSavedText: {
    marginLeft: 6,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  completionMessage: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  completionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#F57C00',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DietPlansScreen;
