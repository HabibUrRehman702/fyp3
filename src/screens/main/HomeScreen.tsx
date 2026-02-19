import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { COLORS, SHADOWS, RADIUS, ANIMATION } from '@/config/constants';
import { AnimatedCard } from '@/components/AnimatedCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { PremiumLoader, SkeletonCard } from '@/components/PremiumLoader';
import apiClient from '@/services/api';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStats {
  totalAnalyses: number;
  avgRiskScore: number;
  severityDistribution: Array<{ _id: string; count: number }>;
}

interface RecentAnalysis {
  id: string;
  klGrade: string;
  severity: string;
  riskScore: number;
  oaStatus: boolean;
  analysisDate: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentAnalyses: RecentAnalysis[];
}

type RootStackParamList = {
  XRay: undefined;
  Progress: undefined;
  AnalysisDetail: { analysisId: string };
  IoTKneeBand: undefined;
  Appointments: undefined;
  StepCounter: undefined;
  Activity: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACTIONS = [
  { id: '1', title: 'Upload X-Ray', subtitle: 'AI Analysis', icon: 'scan-outline', colors: ['#3B82F6', '#8B5CF6'], route: 'XRay' },
  { id: '2', title: 'Appointments', subtitle: 'Schedule', icon: 'calendar-outline', colors: ['#F59E0B', '#EF4444'], route: 'Appointments' },
  { id: '3', title: 'Progress', subtitle: 'Track Health', icon: 'trending-up-outline', colors: ['#8B5CF6', '#EC4899'], route: 'Progress' },
  { id: '4', title: 'Step Counter', subtitle: 'Daily Activity', icon: 'walk-outline', colors: ['#10B981', '#3B82F6'], route: 'StepCounter' },
  { id: '5', title: 'Activity & Food', subtitle: 'Exercise & Diet', icon: 'nutrition-outline', colors: ['#FF6B6B', '#FFE66D'], route: 'Activity' },
  { id: '6', title: 'IoT Monitor', subtitle: 'Knee Band', icon: 'hardware-chip-outline', colors: ['#EF4444', '#F97316'], route: 'IoTKneeBand' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Staggered entrance animations
      Animated.stagger(150, [
        Animated.spring(headerAnim, {
          toValue: 1,
          tension: ANIMATION.spring.tension,
          friction: ANIMATION.spring.friction,
          useNativeDriver: true,
        }),
        Animated.spring(statsAnim, {
          toValue: 1,
          tension: ANIMATION.spring.tension,
          friction: ANIMATION.spring.friction,
          useNativeDriver: true,
        }),
        Animated.spring(cardsAnim, {
          toValue: 1,
          tension: ANIMATION.spring.tension,
          friction: ANIMATION.spring.friction,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'normal': return '#10B981';
      case 'minimal': return '#3B82F6';
      case 'moderate': return '#F59E0B';
      case 'severe': return '#EF4444';
      case 'very severe': return '#7F1D1D';
      default: return COLORS.textMuted;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <PremiumLoader variant="dots" text="Loading your dashboard..." />
        <View style={styles.skeletonContainer}>
          <SkeletonCard lines={2} showAvatar={false} />
          <SkeletonCard lines={2} showAvatar={false} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
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
          <LinearGradient
            colors={[COLORS.primary + '20', 'transparent']}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.subtitle}>Here's your health overview</Text>
            </View>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Text>
              </LinearGradient>
              <View style={styles.statusDot} />
            </View>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        {dashboardData && (
          <Animated.View
            style={[
              styles.statsSection,
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
            <View style={styles.statsRow}>
              <AnimatedCard 
                variant="glass" 
                style={styles.statCard}
                delay={100}
                borderAccent={COLORS.primary}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.statIconGradient}
                  >
                    <Ionicons name="scan-outline" size={22} color={COLORS.white} />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>{dashboardData.stats.totalAnalyses}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </AnimatedCard>

              <AnimatedCard 
                variant="glass" 
                style={styles.statCard}
                delay={200}
                borderAccent={COLORS.warning}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={[COLORS.warning, COLORS.error]}
                    style={styles.statIconGradient}
                  >
                    <Ionicons name="warning-outline" size={22} color={COLORS.white} />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>{dashboardData.stats.avgRiskScore}%</Text>
                <Text style={styles.statLabel}>Risk Score</Text>
              </AnimatedCard>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions Grid */}
        <Animated.View
          style={[
            styles.actionsSection,
            {
              opacity: cardsAnim,
              transform: [{
                translateY: cardsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action, index) => (
              <QuickActionCard
                key={action.id}
                action={action}
                index={index}
                onPress={() => navigation.navigate(action.route as any)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Recent Analyses */}
        {dashboardData && dashboardData.recentAnalyses.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Analyses</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {dashboardData.recentAnalyses.slice(0, 3).map((analysis, index) => (
              <AnimatedCard
                key={analysis.id}
                variant="elevated"
                onPress={() => navigation.navigate('AnalysisDetail', { analysisId: analysis.id })}
                delay={index * 100}
                style={styles.analysisCard}
              >
                <View style={styles.analysisContent}>
                  <View style={styles.analysisLeft}>
                    <View style={[styles.analysisIcon, { backgroundColor: getSeverityColor(analysis.severity) + '20' }]}>
                      <Ionicons name="medical" size={24} color={getSeverityColor(analysis.severity)} />
                    </View>
                    <View style={styles.analysisInfo}>
                      <Text style={styles.analysisTitle}>Knee Analysis</Text>
                      <Text style={styles.analysisSubtitle}>
                        KL Grade {analysis.klGrade} • {analysis.severity}
                      </Text>
                      <Text style={styles.analysisDate}>{formatDate(analysis.analysisDate)}</Text>
                    </View>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: getSeverityColor(analysis.severity) }]}>
                    <Text style={styles.riskText}>{analysis.riskScore}%</Text>
                    <Text style={styles.riskLabel}>Risk</Text>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}

        {/* Empty State */}
        {dashboardData && dashboardData.recentAnalyses.length === 0 && (
          <AnimatedCard variant="gradient" gradientColors={[COLORS.surface, COLORS.surfaceLight]} delay={300}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="medical-outline" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Start Your Health Journey</Text>
              <Text style={styles.emptySubtitle}>
                Upload your first X-ray to get started with AI-powered knee health analysis.
              </Text>
              <AnimatedButton
                title="Upload X-Ray"
                icon="cloud-upload-outline"
                onPress={() => navigation.navigate('XRay')}
                size="large"
                style={{ marginTop: 20 }}
              />
            </View>
          </AnimatedCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// Quick Action Card Component
interface QuickActionCardProps {
  action: typeof QUICK_ACTIONS[0];
  index: number;
  onPress: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ action, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
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
        styles.actionCardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.actionCardTouchable}
      >
        <View style={styles.actionCard}>
          <LinearGradient
            colors={action.colors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionIconContainer}
          >
            <Ionicons name={action.icon as any} size={28} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skeletonContainer: {
    width: '100%',
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  actionCardTouchable: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  analysisCard: {
    marginBottom: 12,
  },
  analysisContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analysisIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  analysisDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 60,
  },
  riskText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  riskLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;
