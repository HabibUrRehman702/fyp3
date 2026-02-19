import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../config/constants';

interface SensorCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  value: string;
  unit: string;
  description: string;
  statusText: string;
  isActive: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({ icon, name, value, unit, description, statusText, isActive }) => (
  <View style={[styles.card, { backgroundColor: COLORS.white }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconContainer, { 
        backgroundColor: isActive ? COLORS.primary : COLORS.error,
        shadowColor: isActive ? COLORS.primary : COLORS.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }]}>
        <Ionicons name={icon} size={32} color={COLORS.white} />
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isActive ? COLORS.success : COLORS.error }]} />
        <Text style={[styles.statusText, { color: isActive ? COLORS.success : COLORS.error }]}>
          {statusText}
        </Text>
      </View>
    </View>

    <View style={styles.cardContent}>
      <Text style={styles.sensorName}>{name}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.sensorValue}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
    
    {/* Progress bar for visual feedback */}
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { 
        backgroundColor: isActive ? COLORS.primary : COLORS.border,
        width: isActive ? '85%' : '15%'
      }]} />
    </View>
  </View>
);

const IoTKneeBandScreen: React.FC = () => {
  const navigation = useNavigation();
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  const sensors = [
    {
      icon: 'compass-outline' as keyof typeof Ionicons.glyphMap,
      name: 'Motion Sensor',
      value: '--',
      unit: 'MPU6050 - Motion & Orientation',
      description: 'Continuously tracks knee movement patterns and spatial orientation for activity monitoring.',
      statusText: 'Active',
      isActive: true,
    },
    {
      icon: 'contract-outline' as keyof typeof Ionicons.glyphMap,
      name: 'Pressure Sensor',
      value: '--',
      unit: 'Force Sensor - Applied Pressure',
      description: 'Measures pressure distribution across the knee joint to detect abnormal loading.',
      statusText: 'Active',
      isActive: true,
    },
    {
      icon: 'speedometer-outline' as keyof typeof Ionicons.glyphMap,
      name: 'Angle Sensor',
      value: '--',
      unit: 'Flex Sensor - Knee Bend Angle',
      description: 'Monitors knee flexion and extension angles during movement and rehabilitation exercises.',
      statusText: 'Inactive',
      isActive: false,
    },
    {
      icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap,
      name: 'Temperature Sensor',
      value: '--',
      unit: 'Skin Temperature (°C)',
      description: 'Tracks skin temperature around the knee to monitor inflammation and healing progress.',
      statusText: 'Active',
      isActive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IoT Knee Band Monitoring</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>IoT Knee Band</Text>
          <Text style={styles.subtitle}>
            Real-time sensor data from your wearable knee device for continuous health monitoring
          </Text>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={styles.connectionIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: bluetoothEnabled ? COLORS.success : COLORS.error }]} />
            <Ionicons name="bluetooth" size={20} color={bluetoothEnabled ? COLORS.success : COLORS.error} />
            <View style={styles.connectionTextContainer}>
              <Text style={styles.connectionStatusLabel}>Connection Status</Text>
              <Text style={[styles.connectionStatusValue, { color: bluetoothEnabled ? COLORS.success : COLORS.error }]}>
                {bluetoothEnabled ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: bluetoothEnabled ? COLORS.success : COLORS.primary }]}
            onPress={() => setBluetoothEnabled(!bluetoothEnabled)}
            activeOpacity={0.8}
          >
            <Ionicons name={bluetoothEnabled ? 'power' : 'bluetooth'} size={16} color={COLORS.white} />
            <Text style={styles.statusButtonText}>{bluetoothEnabled ? 'Disable' : 'Enable'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {sensors.map((sensor, index) => (
            <SensorCard
              key={index}
              icon={sensor.icon}
              name={sensor.name}
              value={sensor.value}
              unit={sensor.unit}
              description={sensor.description}
              statusText={sensor.statusText}
              isActive={sensor.isActive}
            />
          ))}
        </View>

        {/* Sensor Measurement Purposes */}
        <View style={styles.measurementPurposesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Sensor Measurement Purposes</Text>
          </View>
          
          <View style={styles.purposesGrid}>
            <View style={styles.purposeItem}>
              <View style={styles.purposeHeader}>
                <Ionicons name="compass-outline" size={20} color={COLORS.primary} />
                <Text style={styles.purposeSensorName}>Motion Sensor</Text>
              </View>
              <Text style={styles.purposeText}>
                Measures acceleration, gyroscope data, and orientation to analyze gait patterns, detect abnormal movements, and monitor rehabilitation progress.
              </Text>
            </View>

            <View style={styles.purposeItem}>
              <View style={styles.purposeHeader}>
                <Ionicons name="contract-outline" size={20} color={COLORS.primary} />
                <Text style={styles.purposeSensorName}>Pressure Sensor</Text>
              </View>
              <Text style={styles.purposeText}>
                Detects uneven weight distribution, monitors joint loading during activities, and helps prevent injury by identifying pressure points.
              </Text>
            </View>

            <View style={styles.purposeItem}>
              <View style={styles.purposeHeader}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
                <Text style={styles.purposeSensorName}>Angle Sensor</Text>
              </View>
              <Text style={styles.purposeText}>
                Tracks range of motion, measures joint angles during exercises, and provides feedback for proper rehabilitation techniques.
              </Text>
            </View>

            <View style={styles.purposeItem}>
              <View style={styles.purposeHeader}>
                <Ionicons name="thermometer-outline" size={20} color={COLORS.primary} />
                <Text style={styles.purposeSensorName}>Temperature Sensor</Text>
              </View>
              <Text style={styles.purposeText}>
                Monitors inflammation levels, detects early signs of infection, and tracks healing progress through temperature variations.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 8,
  },
  connectionTextContainer: {
    marginLeft: 8,
  },
  connectionStatusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  connectionStatusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  connectionDetails: {
    alignItems: 'flex-end',
  },
  statusButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  statusButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    borderRadius: 14,
    padding: 14,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    alignItems: 'center',
  },
  sensorName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  unit: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressContainer: {
    marginTop: 16,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  measurementPurposesSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
  },
  purposesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  purposeItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  purposeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  purposeSensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 10,
  },
  purposeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default IoTKneeBandScreen;
