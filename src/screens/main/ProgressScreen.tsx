import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../config/constants';
import apiClient from '../../services/api';

const screenWidth = Dimensions.get('window').width;

interface WeeklyStepData {
  days: Array<{
    date: string;
    dayName: string;
    steps: number;
    distance: number;
    calories: number;
  }>;
  summary: {
    totalSteps: number;
    totalDistance: number;
    totalCalories: number;
    avgSteps: number;
    bestDay: string;
    bestDaySteps: number;
  };
  chartData: {
    labels: string[];
    values: number[];
  };
}

interface ActivityHistory {
  history: Array<{
    date: string;
    completionPercentage: number;
    severityLevel: string;
  }>;
  stats: {
    totalDays: number;
    avgCompletion: number;
    currentStreak: number;
    avgWaterIntake?: number;
  };
}

const ProgressScreen: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyStepData | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ActivityHistory | null>(null);
  const [dietHistory, setDietHistory] = useState<ActivityHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const chart1Anim = useRef(new Animated.Value(0)).current;
  const chart2Anim = useRef(new Animated.Value(0)).current;
  const chart3Anim = useRef(new Animated.Value(0)).current;
  const chart4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.stagger(100, [
        Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(summaryAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(chart1Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(chart2Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(chart3Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(chart4Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  // Default empty week data
  const getDefaultWeekData = (): WeeklyStepData => ({
    days: [],
    summary: { totalSteps: 0, totalDistance: 0, totalCalories: 0, avgSteps: 0, bestDay: '-', bestDaySteps: 0 },
    chartData: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [0, 0, 0, 0, 0, 0, 0] },
  });

  // Fetch weekly step data
  const fetchWeeklySteps = async () => {
    try {
      const response = await apiClient.get('/health/steps/weekly');
      
      // Check if response is valid JSON (not HTML)
      if (response.data && typeof response.data === 'object' && response.data.chartData) {
        setWeeklyData(response.data);
        console.log('📊 Weekly steps loaded:', response.data.summary);
      } else {
        console.warn('⚠️ Invalid response format, using defaults');
        setWeeklyData(getDefaultWeekData());
      }
    } catch (error: any) {
      console.error('Error fetching weekly steps:', error?.message || error);
      setWeeklyData(getDefaultWeekData());
    }
  };

  // Fetch exercise history
  const fetchExerciseHistory = async () => {
    try {
      const response = await apiClient.get('/activity/exercise/history?days=14');
      if (response.data && response.data.history) {
        setExerciseHistory(response.data);
        console.log('🏃 Exercise history loaded:', response.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching exercise history:', error?.message || error);
      setExerciseHistory({ history: [], stats: { totalDays: 0, avgCompletion: 0, currentStreak: 0 } });
    }
  };

  // Fetch diet history
  const fetchDietHistory = async () => {
    try {
      const response = await apiClient.get('/activity/diet/history?days=14');
      if (response.data && response.data.history) {
        setDietHistory(response.data);
        console.log('🥗 Diet history loaded:', response.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching diet history:', error?.message || error);
      setDietHistory({ history: [], stats: { totalDays: 0, avgCompletion: 0, currentStreak: 0, avgWaterIntake: 0 } });
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchWeeklySteps(),
        fetchExerciseHistory(),
        fetchDietHistory()
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Mock data for KL Grade adherence
  const klGradeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [4, 4, 3, 3, 2, 2],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  // Real weekly steps data from API - with safe defaults
  const defaultLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const defaultValues = [0, 0, 0, 0, 0, 0, 0];
  
  const chartLabels = weeklyData?.chartData?.labels?.length === 7 
    ? weeklyData.chartData.labels 
    : defaultLabels;
    
  const chartValues = weeklyData?.chartData?.values?.length === 7
    ? weeklyData.chartData.values.map(v => Math.max(0, v || 0))
    : defaultValues;

  const weeklyStepsData = {
    labels: chartLabels,
    datasets: [{
      data: chartValues,
    }],
  };

  // Exercise Progress Data - from API history
  const getExerciseChartData = () => {
    if (!exerciseHistory?.history || exerciseHistory.history.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }
    
    // Get last 7 days of data
    const last7Days = exerciseHistory.history.slice(0, 7).reverse();
    const labels = last7Days.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const values = last7Days.map(d => d.completionPercentage || 0);
    
    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{ data: values.length > 0 ? values : [0] }],
    };
  };

  // Diet Progress Data - from API history
  const getDietChartData = () => {
    if (!dietHistory?.history || dietHistory.history.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }
    
    // Get last 7 days of data
    const last7Days = dietHistory.history.slice(0, 7).reverse();
    const labels = last7Days.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const values = last7Days.map(d => d.completionPercentage || 0);
    
    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{ data: values.length > 0 ? values : [0] }],
    };
  };

  const exerciseChartData = getExerciseChartData();
  const dietChartData = getDietChartData();

  // Mock data for monthly improvements
  const monthlyImprovementsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [8000, 8500, 9000, 9500, 10000, 10500],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: [2.1, 2.0, 1.9, 1.8, 1.7, 1.6],
        color: (opacity = 1) => `rgba(245, 101, 101, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const klChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f8fafc',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
      fill: '#ffffff',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  const stepsChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f0fdf4',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  const improvementsChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#fef7f7',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(245, 101, 101, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#f56565',
      fill: '#ffffff',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  const exerciseChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#E8F5E9',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#4CAF50',
      fill: '#ffffff',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  const dietChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#FFF3E0',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#FF9800',
      fill: '#ffffff',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Premium Header with Gradient */}
        <Animated.View
          style={[
            styles.headerWrapper,
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
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerDecorations}>
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
            </View>
            <View style={styles.headerIconContainer}>
              <Ionicons name="analytics" size={28} color="white" />
            </View>
            <Text style={styles.title}>Progress Analytics</Text>
            <Text style={styles.subtitle}>Track your knee health journey</Text>
          </LinearGradient>
        </Animated.View>

        {/* Summary Stats Cards */}
        <Animated.View
          style={[
            styles.summaryContainer,
            {
              opacity: summaryAnim,
              transform: [{
                scale: summaryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#4CAF50', '#81C784']}
              style={styles.summaryCardGradient}
            >
              <Ionicons name="footsteps" size={24} color="white" />
              <Text style={styles.summaryValue}>{weeklyData?.summary?.avgSteps?.toLocaleString() || '0'}</Text>
              <Text style={styles.summaryLabel}>Avg Steps</Text>
            </LinearGradient>
          </View>
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#2196F3', '#64B5F6']}
              style={styles.summaryCardGradient}
            >
              <Ionicons name="fitness" size={24} color="white" />
              <Text style={styles.summaryValue}>{exerciseHistory?.stats?.currentStreak || 0}</Text>
              <Text style={styles.summaryLabel}>Day Streak</Text>
            </LinearGradient>
          </View>
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#FF9800', '#FFB74D']}
              style={styles.summaryCardGradient}
            >
              <Ionicons name="nutrition" size={24} color="white" />
              <Text style={styles.summaryValue}>{dietHistory?.stats?.avgCompletion || 0}%</Text>
              <Text style={styles.summaryLabel}>Diet Avg</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* KL Grade Adherence Chart */}
        <Animated.View 
          style={[
            styles.chartContainer,
            {
              opacity: chart1Anim,
              transform: [{
                translateY: chart1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="medical" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.chartTitleContainer}>
              <Text style={styles.chartTitle}>Knee Health Score Trend</Text>
              <Text style={styles.chartSubtitle}>Monthly KL grade progression</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableChart}>
            <LineChart
              data={klGradeData}
              width={Math.max(screenWidth - 40, 400)}
              height={240}
              chartConfig={klChartConfig}
              style={styles.chart}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={true}
              yAxisInterval={1}
            />
          </ScrollView>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>KL Grade (0-4)</Text>
            </View>
          </View>
        </Animated.View>

        {/* Weekly Steps Chart */}
        <Animated.View 
          style={[
            styles.chartContainer,
            {
              opacity: chart2Anim,
              transform: [{
                translateY: chart2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconContainer, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="footsteps" size={22} color="#10b981" />
            </View>
            <View style={styles.chartTitleContainer}>
              <Text style={styles.chartTitle}>Weekly Step Count</Text>
              <Text style={styles.chartSubtitle}>Your walking activity for the past 7 days</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableChart}>
            <BarChart
              data={weeklyStepsData}
              width={Math.max(screenWidth - 40, 400)}
              height={240}
              chartConfig={stepsChartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
              yAxisSuffix=""
            />
          </ScrollView>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyData?.summary.totalSteps.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>Total Steps</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyData?.summary.avgSteps.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>Daily Avg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyData?.summary.bestDaySteps.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>Best Day ({weeklyData?.summary.bestDay || '-'})</Text>
            </View>
          </View>
          
          {/* Additional weekly stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={20} color="#10b981" />
              <Text style={styles.statValue}>{weeklyData?.summary.totalDistance.toFixed(2) || '0'} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color="#f56565" />
              <Text style={styles.statValue}>{weeklyData?.summary.totalCalories || '0'}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
        </Animated.View>

        {/* Monthly Improvements Chart */}
        <Animated.View 
          style={[
            styles.chartContainer,
            {
              opacity: chart3Anim,
              transform: [{
                translateY: chart3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconContainer, { backgroundColor: '#f5656520' }]}>
              <Ionicons name="analytics" size={22} color="#f56565" />
            </View>
            <View style={styles.chartTitleContainer}>
              <Text style={styles.chartTitle}>Progress Comparison</Text>
              <Text style={styles.chartSubtitle}>Steps achieved vs health improvements</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableChart}>
            <LineChart
              data={monthlyImprovementsData}
              width={Math.max(screenWidth - 40, 400)}
              height={240}
              chartConfig={improvementsChartConfig}
              style={styles.chart}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              fromZero={true}
              yAxisInterval={1}
            />
          </ScrollView>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Steps Goal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f56565' }]} />
              <Text style={styles.legendText}>Health Score</Text>
            </View>
          </View>
        </Animated.View>

        {/* Exercise Progress Chart */}
        <Animated.View 
          style={[
            styles.chartContainer,
            {
              opacity: chart4Anim,
              transform: [{
                translateY: chart4Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconContainer, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="fitness" size={22} color="#4CAF50" />
            </View>
            <View style={styles.chartTitleContainer}>
              <Text style={styles.chartTitle}>Exercise Progress</Text>
              <Text style={styles.chartSubtitle}>Daily workout completion for the past 7 days</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableChart}>
            <BarChart
              data={getExerciseChartData()}
              width={Math.max(screenWidth - 40, 400)}
              height={240}
              chartConfig={exerciseChartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
              yAxisSuffix="%"
            />
          </ScrollView>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{exerciseHistory?.stats.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{exerciseHistory?.stats.avgCompletion || 0}%</Text>
              <Text style={styles.statLabel}>Avg Completion</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{exerciseHistory?.stats.totalDays || 0}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
          </View>
        </Animated.View>

        {/* Diet Progress Chart */}
        <Animated.View 
          style={[
            styles.chartContainer,
            {
              opacity: chart4Anim,
              transform: [{
                translateY: chart4Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconContainer, { backgroundColor: '#FF980020' }]}>
              <Ionicons name="restaurant" size={22} color="#FF9800" />
            </View>
            <View style={styles.chartTitleContainer}>
              <Text style={styles.chartTitle}>Diet Progress</Text>
              <Text style={styles.chartSubtitle}>Daily meal plan completion for the past 7 days</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableChart}>
            <BarChart
              data={getDietChartData()}
              width={Math.max(screenWidth - 40, 400)}
              height={240}
              chartConfig={dietChartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
              yAxisSuffix="%"
            />
          </ScrollView>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#FF9800" />
              <Text style={styles.statValue}>{dietHistory?.stats.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={20} color="#FF9800" />
              <Text style={styles.statValue}>{dietHistory?.stats.avgCompletion || 0}%</Text>
              <Text style={styles.statLabel}>Avg Completion</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="water" size={20} color="#2196F3" />
              <Text style={styles.statValue}>{dietHistory?.stats.avgWaterIntake?.toFixed(1) || 0}L</Text>
              <Text style={styles.statLabel}>Avg Water</Text>
            </View>
          </View>
        </Animated.View>

        {/* Guidelines Section */}
        <Animated.View 
          style={[
            styles.guidelinesContainer,
            {
              opacity: chart4Anim,
              transform: [{
                translateY: chart4Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.guidelinesHeader}>
            <View style={[styles.chartIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="information-circle" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.guidelinesTitle}>Understanding Your Progress</Text>
          </View>
          
          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineTitle}>• Knee Health Score Trend</Text>
            <Text style={styles.guidelineText}>
              Shows your KL (Kellgren-Lawrence) grade progression from 0-4. Lower numbers indicate improvement in joint health. Grade 0 = normal, Grade 4 = severe osteoarthritis.
            </Text>
          </View>

          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineTitle}>• Daily Step Count</Text>
            <Text style={styles.guidelineText}>
              Tracks your daily walking activity. Aim for consistent steps while gradually increasing as your knee allows. The goal is 200 steps daily for rehabilitation.
            </Text>
          </View>

          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineTitle}>• Exercise & Diet Progress</Text>
            <Text style={styles.guidelineText}>
              Tracks your daily exercise and diet plan completion. Aim for consistent progress with your personalized severity-based plans. Higher percentages indicate better adherence.
            </Text>
          </View>

          <View style={styles.guidelineItem}>
            <Text style={styles.guidelineTitle}>• Progress Comparison</Text>
            <Text style={styles.guidelineText}>
              Compares your step achievements (green) with health score improvements (red). Ideally, both should show upward/downward trends respectively as you recover.
            </Text>
          </View>

          <View style={styles.guidelineNote}>
            <Ionicons name="medical" size={16} color={COLORS.textMuted} />
            <Text style={styles.guidelineNoteText}>
              Remember: Progress may not be linear. Consult your healthcare provider for personalized guidance.
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
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
  headerWrapper: {
    marginBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -20,
    left: -30,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  summaryCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  chartIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
    alignSelf: 'center',
  },
  scrollableChart: {
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  guidelinesContainer: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
  },
  guidelineItem: {
    marginBottom: 15,
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 5,
  },
  guidelineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  guidelineNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  guidelineNoteText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
    lineHeight: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default ProgressScreen;
