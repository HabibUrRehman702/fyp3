// Placeholder screens - Replace with full implementations

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/config/constants';
import { API_BASE_URL } from '@/config/constants';

export const SignupScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Signup Screen - To be implemented</Text>
    <Text style={styles.subtext}>Features: Email, password, OTP flow</Text>
  </View>
);

export const OTPScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>OTP Verification - To be implemented</Text>
    <Text style={styles.subtext}>Features: 6-digit OTP input, resend</Text>
  </View>
);

export const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Home Dashboard - To be implemented</Text>
    <Text style={styles.subtext}>Features: Quick stats, recent analyses, appointments</Text>
  </View>
);

export const XRayScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Camera roll permissions are required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setResult(null);
    }
  };

  const analyzeXray = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      const token = await AsyncStorage.getItem('@kneeklinic:token');
      const formData = new FormData();
      
      // Handle web vs native differently
      if (Platform.OS === 'web') {
        // On web, fetch the image as a blob
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        const file = new File([blob], 'xray.jpg', { type: 'image/jpeg' });
        formData.append('xray', file);
      } else {
        // Native mobile
        formData.append('xray', {
          uri: selectedImage.uri,
          name: 'xray.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/xray/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.message) {
        setResult(data.analysis);
        Alert.alert('Analysis Complete', `KL Grade: ${data.analysis.klGrade} (${data.analysis.severity})`);
      } else {
        Alert.alert('Analysis Failed', data.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze X-ray. Please check your connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>X-Ray Analysis</Text>

      {!selectedImage ? (
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadText}>Select X-Ray Image</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />

          {analyzing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeXray}>
              <Text style={styles.analyzeText}>Analyze X-Ray</Text>
            </TouchableOpacity>
          )}

          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Analysis Result</Text>
              <Text style={styles.resultGrade}>KL Grade: {result.klGrade}</Text>
              <Text style={styles.resultLabel}>{result.severity}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export const AppointmentsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Appointments - To be implemented</Text>
    <Text style={styles.subtext}>Features: List, book, reschedule, cancel</Text>
  </View>
);

export const MessagesScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Messages - To be implemented</Text>
    <Text style={styles.subtext}>Features: Conversations list, unread counts</Text>
  </View>
);

export const CommunityScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Community - To be implemented</Text>
    <Text style={styles.subtext}>Features: Posts, replies, likes</Text>
  </View>
);

export const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Profile - To be implemented</Text>
    <Text style={styles.subtext}>Features: Edit profile, change password, logout</Text>
  </View>
);

export const ProgressScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Progress Tracking - To be implemented</Text>
    <Text style={styles.subtext}>Features: Charts, timeline, trends</Text>
  </View>
);

export const AnalysisDetailScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Analysis Details - To be implemented</Text>
    <Text style={styles.subtext}>Features: X-ray image, KL grade, recommendations</Text>
  </View>
);

export const BookAppointmentScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Book Appointment - To be implemented</Text>
    <Text style={styles.subtext}>Features: Doctor selection, date/time picker</Text>
  </View>
);

export const ConversationScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Conversation - To be implemented</Text>
    <Text style={styles.subtext}>Features: Message thread, send messages</Text>
  </View>
);

export const PostDetailScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Post Details - To be implemented</Text>
    <Text style={styles.subtext}>Features: Post content, replies, likes</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  },
  analyzeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: 10,
  },
  resultContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  resultGrade: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 5,
  },
  resultLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
