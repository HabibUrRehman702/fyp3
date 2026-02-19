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

interface Exercise {
  id: string;
  name: string;
  duration: string;
  description: string;
}

interface ExercisePlan {
  name: string;
  description: string;
  exercises: Exercise[];
}

interface Plans {
  beginning: ExercisePlan;
  moderate: ExercisePlan;
  severe: ExercisePlan;
}

type SeverityLevel = 'beginning' | 'moderate' | 'severe';

const ExercisePlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<SeverityLevel | null>(null);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalDays: 0, avgCompletion: 0, currentStreak: 0 });
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
        apiClient.get('/activity/exercise/plans'),
        apiClient.get('/activity/exercise/today'),
        apiClient.get('/activity/exercise/history?days=30')
      ]);

      setPlans(plansRes.data.plans);
      
      if (todayRes.data.log) {
        setSelectedPlan(todayRes.data.log.severityLevel);
        setCompletedExercises(todayRes.data.log.completedExercises || []);
      }

      if (historyRes.data.stats) {
        setStats(historyRes.data.stats);
      }
    } catch (error) {
      console.error('Error loading exercise data:', error);
      showAlert('Error', 'Failed to load exercise plans');
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
    if (selectedPlan && selectedPlan !== level && completedExercises.length > 0) {
      showAlert(
        'Change Plan?',
        'Changing plans will reset your progress for today. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change',
            onPress: () => {
              setSelectedPlan(level);
              setCompletedExercises([]);
            }
          }
        ]
      );
    } else {
      setSelectedPlan(level);
      setCompletedExercises([]);
    }
  };

  const toggleExercise = async (exerciseId: string) => {
    if (!selectedPlan || !plans) return;

    const newCompleted = completedExercises.includes(exerciseId)
      ? completedExercises.filter(id => id !== exerciseId)
      : [...completedExercises, exerciseId];

    setCompletedExercises(newCompleted);

    // Save to database
    try {
      setSaving(true);
      const totalExercises = plans[selectedPlan].exercises.length;
      
      await apiClient.post('/activity/exercise/log', {
        severityLevel: selectedPlan,
        completedExercises: newCompleted,
        totalExercises
      });
      
      // Show save success
      setLastSaved(new Date());
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving exercise:', error);
      // Revert on error
      setCompletedExercises(completedExercises);
      showAlert('Error', 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCompletionPercentage = () => {
    if (!selectedPlan || !plans) return 0;
    const total = plans[selectedPlan].exercises.length;
    return total > 0 ? Math.round((completedExercises.length / total) * 100) : 0;
  };

  const getPlanIcon = (level: SeverityLevel) => {
    switch (level) {
      case 'beginning': return 'leaf';
      case 'moderate': return 'fitness';
      case 'severe': return 'heart';
    }
  };

  const getPlanColor = (level: SeverityLevel) => {
    switch (level) {
      case 'beginning': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient
          colors={[COLORS.primary + '40', COLORS.primary + '10']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading exercise plans...</Text>
        </LinearGradient>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
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
          <Text style={styles.headerTitle}>Exercise Plans</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Stats Bar */}
        <Animated.View 
          style={[
            styles.statsBar,
            {
              opacity: statsAnim,
              transform: [{
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={['#4CAF50', '#81C784']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
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
              <Text style={styles.statValue}>{stats.totalDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Plan Selection */}
        {!selectedPlan ? (
          <Animated.View 
            style={[
              styles.planSelection,
              {
                opacity: cardsAnim,
                transform: [{
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Select Your Plan</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a workout plan based on your osteoarthritis severity
            </Text>

            {plans && (Object.keys(plans) as SeverityLevel[]).map((level, index) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.planCard, 
                  { 
                    borderLeftColor: getPlanColor(level),
                    borderLeftWidth: 4,
                  }
                ]}
                onPress={() => handleSelectPlan(level)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[getPlanColor(level) + '08', getPlanColor(level) + '02']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.planCardGradient}
                >
                  <View style={[styles.planIconContainer, { backgroundColor: getPlanColor(level) + '20' }]}>
                    <Ionicons name={getPlanIcon(level)} size={28} color={getPlanColor(level)} />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plans[level].name}</Text>
                    <Text style={styles.planDescription}>{plans[level].description}</Text>
                    <View style={styles.exerciseCountBadge}>
                      <Ionicons name="fitness" size={14} color={getPlanColor(level)} />
                      <Text style={[styles.exerciseCount, { color: getPlanColor(level) }]}>
                        {plans[level].exercises.length} exercises
                      </Text>
                    </View>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={22} color={getPlanColor(level)} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : (
          /* Exercise Checklist */
          <Animated.View 
            style={[
              styles.exerciseSection,
              {
                opacity: cardsAnim,
                transform: [{
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                }],
              },
            ]}
          >
            {/* Current Plan Header */}
            <LinearGradient
              colors={[getPlanColor(selectedPlan), getPlanColor(selectedPlan) + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.currentPlanHeader}
            >
              <View>
                <Text style={styles.currentPlanLabel}>Today's Workout</Text>
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
            </LinearGradient>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Today's Progress</Text>
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
                {completedExercises.length} of {plans?.[selectedPlan].exercises.length || 0} exercises completed
              </Text>
            </View>

            {/* Exercise List */}
            <Text style={styles.exerciseListTitle}>Exercises</Text>
            {plans && plans[selectedPlan].exercises.map((exercise, index) => {
              const isCompleted = completedExercises.includes(exercise.id);
              return (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    isCompleted && styles.exerciseItemCompleted
                  ]}
                  onPress={() => toggleExercise(exercise.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    isCompleted && { backgroundColor: getPlanColor(selectedPlan), borderColor: getPlanColor(selectedPlan) }
                  ]}>
                    {isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[
                      styles.exerciseName,
                      isCompleted && styles.exerciseNameCompleted
                    ]}>
                      {index + 1}. {exercise.name}
                    </Text>
                    <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                    <Text style={styles.exerciseDesc}>{exercise.description}</Text>
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
                <Text style={styles.completionEmoji}>🎉</Text>
                <Text style={styles.completionTitle}>Workout Complete!</Text>
                <Text style={styles.completionText}>
                  Great job! You've completed all exercises for today. Come back tomorrow for your next session.
                </Text>
              </View>
            )}
          </Animated.View>
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
    color: COLORS.primary,
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
  exerciseCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  exerciseSection: {
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
    color: COLORS.primary,
    fontWeight: '500',
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
    color: COLORS.primary,
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
  exerciseListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  exerciseItemCompleted: {
    backgroundColor: '#E8F5E9',
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
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  exerciseDuration: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  savingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    marginBottom: 12,
  },
  savingText: {
    marginLeft: 8,
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '500',
  },
  saveStatusContainer: {
    marginBottom: 12,
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
    backgroundColor: '#E8F5E9',
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
    color: '#2E7D32',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#388E3C',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExercisePlansScreen;
