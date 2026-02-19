import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Easing,
  Vibration,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Pedometer, Accelerometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@/config/constants';
import apiClient from '@/services/api';

interface StepSession {
  startTime: Date;
  endTime?: Date;
  steps: number;
  distance: number;
  calories: number;
}

const StepCounterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [sessionSteps, setSessionSteps] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('Ready');
  const subscriptionRef = useRef<any>(null);
  
  // Simple step detection using vertical acceleration
  const lastZ = useRef<number>(0);
  const stepState = useRef<'up' | 'down'>('down');
  const lastStepTime = useRef<number>(0);
  const stepThreshold = 0.08; // Very sensitive threshold
  const minStepInterval = 250; // Min ms between steps
  
  // Animation for pulsing dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check if sensors are available on mount
  useEffect(() => {
    setDebugInfo('Checking sensors...');
    console.log('🔍 Checking sensor availability...');
    setIsAvailable(true); // Accelerometer is always available
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // Pulsing animation effect
  useEffect(() => {
    if (isCounting) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isCounting, pulseAnim]);

  // Update duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isCounting && startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = startTime.getTime();
        setDuration(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCounting, startTime]);

  const startCounting = async () => {
    try {
      // Reset everything
      setSessionSteps(0);
      setStartTime(new Date());
      setDuration(0);
      setIsCounting(true);
      lastZ.current = 0;
      stepState.current = 'down';
      lastStepTime.current = Date.now();
      setDebugInfo('Starting accelerometer...');

      // Use Accelerometer-based step detection
      console.log('🚶 Starting with Accelerometer...');
      
      // Set fast update interval
      Accelerometer.setUpdateInterval(50); // 20 Hz
      
      const subscription = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        
        // Calculate total acceleration magnitude minus gravity
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const acceleration = magnitude - 1.0; // Remove gravity (1g)
        
        const now = Date.now();
        const timeSinceLastStep = now - lastStepTime.current;
        
        // Simple threshold crossing detection
        // When acceleration goes above threshold, we're in "up" state
        // When it comes back down below threshold, that's a step
        if (acceleration > stepThreshold && stepState.current === 'down') {
          stepState.current = 'up';
        } else if (acceleration < -stepThreshold && stepState.current === 'up') {
          // Coming back down - count as step if enough time has passed
          if (timeSinceLastStep > minStepInterval) {
            console.log('👣 STEP! acc:', acceleration.toFixed(3));
            lastStepTime.current = now;
            setSessionSteps(prev => {
              const newSteps = prev + 1;
              // Vibrate briefly on each step for feedback
              Vibration.vibrate(10);
              return newSteps;
            });
            setDebugInfo(`Step! (${acceleration.toFixed(2)}g)`);
          }
          stepState.current = 'down';
        }
        
        lastZ.current = acceleration;
      });
      
      subscriptionRef.current = subscription;
      setDebugInfo('Walking... shake phone to test');
      
    } catch (error) {
      console.error('Error starting step counter:', error);
      Alert.alert('Error', 'Failed to start step counter: ' + String(error));
      setIsCounting(false);
      setDebugInfo('Error: ' + String(error));
    }
  };

  const stopCounting = async () => {
    // Cleanup subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    setIsCounting(false);
    setDebugInfo('Stopped');

    if (sessionSteps === 0) {
      Alert.alert('No Steps Recorded', 'No steps were recorded during this session.');
      resetSession();
      return;
    }

    // Calculate metrics
    const distance = (sessionSteps * 0.762) / 1000; // Average step length in km
    const calories = sessionSteps * 0.04; // Average calories per step

    // Show save confirmation
    Alert.alert(
      'Session Complete! 🎉',
      `Steps: ${sessionSteps.toLocaleString()}\nDistance: ${distance.toFixed(2)} km\nCalories: ${calories.toFixed(0)} kcal\nDuration: ${formatDuration(duration)}`,
      [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: resetSession,
        },
        {
          text: 'Save',
          onPress: () => saveSession({
            startTime: startTime!,
            endTime: new Date(),
            steps: sessionSteps,
            distance: parseFloat(distance.toFixed(2)),
            calories: parseFloat(calories.toFixed(2)),
          }),
        },
      ]
    );
  };

  const saveSession = async (session: StepSession) => {
    setIsSaving(true);
    setDebugInfo('Saving to server...');
    
    try {
      console.log('📤 Sending step data to server:', {
        steps: session.steps,
        distance: session.distance,
        calories: session.calories,
      });
      
      const response = await apiClient.post('/health/steps', {
        steps: session.steps,
        distance: session.distance,
        calories: session.calories,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: duration,
      });
      
      console.log('✅ Step session saved to database:', response.data);
      setDebugInfo('Saved successfully!');
      
      // Vibrate on success
      Vibration.vibrate([0, 100, 50, 100]);
      
      Alert.alert(
        '✅ Session Saved!', 
        `Your ${session.steps.toLocaleString()} steps have been saved to your health record.\n\nDistance: ${session.distance} km\nCalories: ${session.calories} kcal`,
        [{ text: 'Great!', onPress: resetSession }]
      );
    } catch (error: any) {
      console.error('❌ Error saving step session:', error?.response?.data || error?.message || error);
      setDebugInfo('Save failed');
      
      const errorMessage = error?.response?.status === 403 
        ? 'Your session has expired. Please log in again.'
        : error?.response?.status === 401
        ? 'You are not logged in. Please log in to save your steps.'
        : 'Could not connect to the server. Check your internet connection.';
      
      Alert.alert(
        'Save Failed',
        `${errorMessage}\n\nWould you like to try again?`,
        [
          { text: 'Discard', style: 'destructive', onPress: resetSession },
          { text: 'Retry', onPress: () => saveSession(session) },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetSession = () => {
    setSessionSteps(0);
    setStartTime(null);
    setDuration(0);
    lastZ.current = 0;
    stepState.current = 'down';
    lastStepTime.current = 0;
    setDebugInfo('Ready');
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDistance = (): string => {
    return ((sessionSteps * 0.762) / 1000).toFixed(2); // km
  };

  const calculateCalories = (): string => {
    return (sessionSteps * 0.04).toFixed(0); // kcal
  };

  return (
    <>
      {/* Saving Overlay */}
      <Modal
        visible={isSaving}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.savingText}>Saving your steps...</Text>
            <Text style={styles.savingSubtext}>Please wait</Text>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="walk" size={48} color={COLORS.primary} />
          <Text style={styles.title}>Step Counter</Text>
          <Text style={styles.subtitle}>
            {isCounting ? 'Counting your steps...' : 'Start tracking your activity'}
          </Text>
        </View>
      </View>

      {/* Main Counter Display */}
      <View style={styles.counterCard}>
        <Text style={styles.stepLabel}>Steps</Text>
        <Text style={styles.stepCount}>{sessionSteps.toLocaleString()}</Text>

        {isCounting && (
          <View style={styles.statusBadge}>
            <Animated.View
              style={[
                styles.pulsingDot,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={styles.statusText}>Recording</Text>
          </View>
        )}
        
        {/* Debug info */}
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="time-outline" size={28} color={COLORS.primary} />
          <Text style={styles.metricValue}>{formatDuration(duration)}</Text>
          <Text style={styles.metricLabel}>Duration</Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="location-outline" size={28} color={COLORS.success} />
          <Text style={styles.metricValue}>{calculateDistance()}</Text>
          <Text style={styles.metricLabel}>Distance (km)</Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="flame-outline" size={28} color={COLORS.error} />
          <Text style={styles.metricValue}>{calculateCalories()}</Text>
          <Text style={styles.metricLabel}>Calories</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlContainer}>
        {!isCounting ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton, !isAvailable && styles.buttonDisabled]}
            onPress={startCounting}
            disabled={!isAvailable || isSaving}
          >
            <Ionicons name="play" size={28} color={COLORS.text} />
            <Text style={styles.buttonText}>Start Counting</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopCounting}
            disabled={isSaving}
          >
            <Ionicons name="stop" size={28} color={COLORS.text} />
            <Text style={styles.buttonText}>Stop & Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Device Status */}
      <View style={[styles.statusCard, !isAvailable && styles.statusCardError]}>
        <Ionicons
          name={isAvailable ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={isAvailable ? COLORS.success : COLORS.error}
        />
        <Text style={[styles.statusCardText, !isAvailable && styles.statusCardTextError]}>
          {isAvailable
            ? 'Pedometer available and ready'
            : 'Pedometer not available on this device'}
        </Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Keep your phone with you while walking. The counter uses your device's motion sensors to track steps in real-time. Your sessions are automatically saved to track your progress.
          </Text>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for accurate counting:</Text>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark" size={16} color={COLORS.success} />
          <Text style={styles.tipText}>Keep your phone in your pocket or hand</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark" size={16} color={COLORS.success} />
          <Text style={styles.tipText}>Walk at a consistent pace</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark" size={16} color={COLORS.success} />
          <Text style={styles.tipText}>Avoid excessive arm swinging</Text>
        </View>
      </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  counterCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  stepLabel: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  stepCount: {
    fontSize: 72,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  controlContainer: {
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusCardError: {
    backgroundColor: COLORS.error + '20',
  },
  statusCardText: {
    fontSize: 14,
    color: COLORS.success,
    flex: 1,
  },
  statusCardTextError: {
    color: COLORS.error,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '15',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  savingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingCard: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  savingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  savingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default StepCounterScreen;
