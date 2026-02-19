import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/config/constants';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/services/api';

interface Appointment {
  _id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
  type: string;
  notes?: string;
}

type RootStackParamList = {
  MainTabs: undefined;
};

type AppointmentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<AppointmentsScreenNavigationProp>();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload appointments when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [])
  );

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/appointments');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Show empty state on error
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
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

  const handleBookAppointment = () => {
    const calUrl = 'https://cal.com/habibkhan-rajah-xo7wnk/30min';
    
    Linking.canOpenURL(calUrl).then(supported => {
      if (supported) {
        Linking.openURL(calUrl);
        // After opening cal.com, show a dialog to add the appointment
        setTimeout(() => {
          showAlert(
            'Add Appointment',
            'After booking on Cal.com, would you like to add this appointment to your list?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Add Appointment',
                onPress: () => promptAddAppointment()
              }
            ]
          );
        }, 2000);
      } else {
        showAlert('Error', 'Cannot open booking page');
      }
    }).catch(err => {
      console.error('Error opening URL:', err);
      showAlert('Error', 'Failed to open booking page');
    });
  };

  const promptAddAppointment = async () => {
    // Create a default appointment - in a real app you'd get these details from cal.com webhook
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await apiClient.post('/appointments', {
        doctorName: 'Dr. Habib Khan',
        specialty: 'Orthopedic Specialist',
        date: tomorrow.toISOString(),
        time: '10:00 AM',
        type: 'Consultation',
        notes: 'Booked via Cal.com'
      });
      
      showAlert('Success', 'Appointment added successfully!');
      loadAppointments();
    } catch (error) {
      console.error('Error adding appointment:', error);
      showAlert('Error', 'Failed to add appointment');
    }
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    // Open cal.com for rescheduling
    const calUrl = 'https://cal.com/habibkhan-rajah-xo7wnk/30min';
    
    showAlert(
      'Reschedule Appointment',
      'You will be redirected to Cal.com to select a new time. After booking, the appointment will be updated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reschedule',
          onPress: async () => {
            try {
              // Mark the appointment as rescheduled
              await apiClient.put(`/appointments/${appointmentId}`, {
                status: 'rescheduled'
              });
              
              // Open cal.com for rebooking
              Linking.openURL(calUrl);
              
              // Prompt to add new appointment
              setTimeout(() => {
                showAlert(
                  'Add New Appointment',
                  'After selecting a new time on Cal.com, would you like to add the new appointment?',
                  [
                    { text: 'No', style: 'cancel', onPress: () => loadAppointments() },
                    { text: 'Add', onPress: () => { promptAddAppointment(); } }
                  ]
                );
              }, 2000);
            } catch (error) {
              console.error('Error rescheduling:', error);
              showAlert('Error', 'Failed to reschedule appointment');
            }
          }
        }
      ]
    );
  };

  const handleCancelAppointment = (appointmentId: string) => {
    showAlert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/appointments/${appointmentId}`);
              showAlert('Success', 'Appointment cancelled successfully');
              loadAppointments();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              showAlert('Error', 'Failed to cancel appointment');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return COLORS.primary;
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'rescheduled': return '#F59E0B';
      default: return COLORS.textMuted;
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <View
      key={appointment._id}
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        margin: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 4 }}>
            {appointment.doctorName}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 8 }}>
            {appointment.specialty}
          </Text>
        </View>
        <View style={{
          backgroundColor: getStatusColor(appointment.status),
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        }}>
          <Text style={{ fontSize: 12, color: 'white', fontWeight: '600', textTransform: 'capitalize' }}>
            {appointment.status}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, color: COLORS.text }}>
          {formatDate(appointment.date)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, color: COLORS.text }}>
          {appointment.time}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="medical-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, color: COLORS.text }}>
          {appointment.type}
        </Text>
      </View>

      {appointment.notes && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ fontSize: 14, color: COLORS.textMuted, flex: 1 }}>
            {appointment.notes}
          </Text>
        </View>
      )}

      {appointment.status === 'upcoming' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 16,
              flex: 1,
              marginRight: 8,
              alignItems: 'center',
            }}
            onPress={() => handleRescheduleAppointment(appointment._id)}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 16,
              flex: 1,
              marginLeft: 8,
              alignItems: 'center',
            }}
            onPress={() => handleCancelAppointment(appointment._id)}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming');
  const pastAppointments = appointments.filter(apt => apt.status !== 'upcoming');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.text }}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 }}>
          Appointments
        </Text>
        <Text style={{ fontSize: 16, color: COLORS.textMuted }}>
          Manage your healthcare appointments
        </Text>
      </View>

      {/* Book New Appointment Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          onPress={handleBookAppointment}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Book New Appointment
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>
            Upcoming Appointments
          </Text>
          {upcomingAppointments.map(renderAppointmentCard)}
        </View>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>
            Past Appointments
          </Text>
          {pastAppointments.map(renderAppointmentCard)}
        </View>
      )}

      {/* Empty State */}
      {appointments.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 100 }}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>
            No Appointments Yet
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 }}>
            Book your first appointment to start your knee health journey
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}
            onPress={handleBookAppointment}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Book Appointment
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default AppointmentsScreen;
