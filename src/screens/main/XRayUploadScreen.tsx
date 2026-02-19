import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, API_BASE_URL, STORAGE_KEYS, SHADOWS, RADIUS, SPACING } from '@/config/constants';
import apiClient from '@/services/api';

interface AnalysisResult {
  id: string;
  klGrade: string;
  severity: string;
  riskScore: number;
  oaStatus: boolean;
  recommendations?: string[];
}

// KL Grade information and recommendations
const getKLGradeInfo = (grade: string) => {
  const gradeNum = parseInt(grade);
  
  switch (gradeNum) {
    case 0:
      return {
        label: 'Normal',
        color: '#10B981', // green
        icon: 'checkmark-circle' as const,
        description: 'No signs of osteoarthritis detected.',
        recommendations: [
          '✅ Maintain a healthy weight to reduce joint stress',
          '✅ Continue regular low-impact exercises (swimming, cycling)',
          '✅ Eat a balanced diet rich in calcium and vitamin D',
          '✅ Stay active to keep joints flexible',
          '✅ Schedule annual check-ups to monitor joint health',
        ],
      };
    case 1:
      return {
        label: 'Doubtful',
        color: '#10B981', // green
        icon: 'checkmark-circle' as const,
        description: 'Minor changes detected, but likely normal aging.',
        recommendations: [
          '✅ Maintain regular physical activity',
          '✅ Focus on strengthening exercises for leg muscles',
          '✅ Keep a healthy body weight',
          '✅ Consider glucosamine supplements (consult doctor)',
          '✅ Monitor for any new symptoms',
        ],
      };
    case 2:
      return {
        label: 'Mild OA',
        color: '#F59E0B', // amber
        icon: 'alert-circle' as const,
        description: 'Mild osteoarthritis with minimal joint space narrowing.',
        recommendations: [
          '⚠️ Consult an orthopedic specialist for evaluation',
          '⚠️ Start physical therapy exercises',
          '⚠️ Consider anti-inflammatory medications if needed',
          '⚠️ Use supportive footwear and knee braces',
          '⚠️ Avoid high-impact activities (running, jumping)',
          '⚠️ Apply ice/heat therapy for pain relief',
        ],
      };
    case 3:
      return {
        label: 'Moderate OA',
        color: '#EF4444', // red
        icon: 'warning' as const,
        description: 'Moderate osteoarthritis with noticeable joint damage.',
        recommendations: [
          '🔴 Schedule appointment with orthopedic specialist immediately',
          '🔴 Regular physical therapy is essential',
          '🔴 Consider corticosteroid injections for pain relief',
          '🔴 Use walking aids if needed (cane, walker)',
          '🔴 Weight management is critical',
          '🔴 Avoid prolonged standing or walking',
          '🔴 Discuss viscosupplementation with your doctor',
        ],
      };
    case 4:
      return {
        label: 'Severe OA',
        color: '#DC2626', // dark red
        icon: 'warning' as const,
        description: 'Severe osteoarthritis with significant joint damage.',
        recommendations: [
          '🚨 Urgent consultation with orthopedic surgeon required',
          '🚨 Discuss surgical options (knee replacement)',
          '🚨 Pain management with specialist guidance',
          '🚨 Use mobility aids to reduce joint stress',
          '🚨 Consider aquatic therapy for gentle exercise',
          '🚨 Prepare for potential surgical intervention',
          '🚨 Arrange support for daily activities if needed',
        ],
      };
    default:
      return {
        label: 'Unknown',
        color: '#6B7280',
        icon: 'help-circle' as const,
        description: 'Unable to determine KL grade.',
        recommendations: ['Please consult a healthcare professional.'],
      };
  }
};

const XRayUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzedImage, setAnalyzedImage] = useState<string | null>(null);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const uploadAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(uploadAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // Continuous pulse for upload icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Animate when results appear
    if (analysisResult) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    }
  }, [analysisResult]);

  const requestPermissions = async () => {
    // On web, permissions are handled differently
    if (Platform.OS === 'web') {
      return true; // Web doesn't require explicit permissions for file picker
    }

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to upload X-rays.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    // On web, camera might not be available, so we'll use gallery picker instead
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Not Available',
        'Camera is not available on web. Please use "Select from Gallery" instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadFile = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select an X-ray image first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // For web platform, we need to handle file upload differently
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, fetching image as blob');
        console.log('📍 Image URI:', selectedImage);
        
        // On web, fetch the image as a blob
        const blobResponse = await fetch(selectedImage);
        console.log('✅ Fetch response:', blobResponse.status, blobResponse.statusText);
        
        const blob = await blobResponse.blob();
        console.log('📦 Blob created:', {
          size: blob.size,
          type: blob.type,
        });
        
        const filename = 'xray_' + Date.now() + '.jpg';
        
        // Create a File object from the blob
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        console.log('📄 File object created:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        
        formData.append('xray', file);
        console.log('✅ File appended to FormData with key "xray"');

        // Get auth token
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        
        // Use native fetch for web uploads (axios has issues with FormData on web)
        console.log('🚀 Sending request via native fetch...');
        const uploadResponse = await fetch(`${API_BASE_URL}/api/ai/analyze-xray`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const responseData = await uploadResponse.json();
        console.log('✅ Upload Response:', responseData);

        if (!uploadResponse.ok) {
          throw new Error(responseData.message || 'Upload failed');
        }

        const analysisData = responseData.analysis;
        
        // Store the analyzed image and results
        setAnalyzedImage(selectedImage);
        setAnalysisResult(analysisData);
        setSelectedImage(null);
      } else {
        // For native mobile (iOS/Android)
        const filename = selectedImage.split('/').pop() || 'xray.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('xray', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);

        console.log('📤 Uploading FormData:', formData);
        console.log('📊 Selected Image:', selectedImage);

        const response = await apiClient.post('/ai/analyze-xray', formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(progress);
            console.log(`📊 Upload Progress: ${progress}%`);
          },
        });

        console.log('✅ Upload Response:', response.data);

        const analysisData = response.data.analysis;
        
        // Store the analyzed image and results
        setAnalyzedImage(selectedImage);
        setAnalysisResult(analysisData);
        setSelectedImage(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload X-ray. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
  };

  const startNewAnalysis = () => {
    setAnalysisResult(null);
    setAnalyzedImage(null);
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="scan" size={28} color="white" />
              </View>
              <Text style={styles.title}>X-Ray Analysis</Text>
              <Text style={styles.subtitle}>AI-powered knee health assessment</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          {/* Analysis Results Display */}
          {analysisResult && analyzedImage && (
            <Animated.View 
              style={[
                styles.resultsContainer,
                {
                  opacity: resultAnim,
                  transform: [{
                    scale: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  }],
                },
              ]}
            >
              {/* Success Header */}
              <View style={styles.successHeader}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Analysis Complete!</Text>
              </View>

              {/* X-Ray Image */}
              <View style={styles.resultImageContainer}>
                <Image 
                  source={{ uri: analyzedImage }} 
                  style={styles.resultImage} 
                  resizeMode="contain" 
                />
              </View>

              {/* KL Grade Badge */}
              <LinearGradient
                colors={[getKLGradeInfo(analysisResult.klGrade).color, getKLGradeInfo(analysisResult.klGrade).color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradeBadge}
              >
                <Ionicons 
                  name={getKLGradeInfo(analysisResult.klGrade).icon} 
                  size={28} 
                  color="white" 
                />
                <View style={styles.gradeTextContainer}>
                  <Text style={styles.gradeLabel}>KL Grade {analysisResult.klGrade}</Text>
                  <Text style={styles.gradeValue}>{getKLGradeInfo(analysisResult.klGrade).label}</Text>
                </View>
              </LinearGradient>

            {/* Analysis Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Analysis Details</Text>
              
              <View style={styles.detailRow}>
                <Ionicons name="fitness" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Severity:</Text>
                <Text style={styles.detailValue}>{analysisResult.severity}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="speedometer" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Risk Score:</Text>
                <Text style={styles.detailValue}>{analysisResult.riskScore}%</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="medical" size={20} color={analysisResult.oaStatus ? '#EF4444' : '#10B981'} />
                <Text style={styles.detailLabel}>OA Status:</Text>
                <Text style={[styles.detailValue, { color: analysisResult.oaStatus ? '#EF4444' : '#10B981' }]}>
                  {analysisResult.oaStatus ? 'Detected' : 'Not Detected'}
                </Text>
              </View>

              <Text style={styles.gradeDescription}>
                {getKLGradeInfo(analysisResult.klGrade).description}
              </Text>
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsCard}>
              <View style={styles.recommendationsHeader}>
                <Ionicons name="bulb" size={24} color={COLORS.primary} />
                <Text style={styles.recommendationsTitle}>Recommendations</Text>
              </View>
              
              {getKLGradeInfo(analysisResult.klGrade).recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.homeButton}
                onPress={() => navigation.navigate('Home' as never)}
              >
                <Ionicons name="home" size={20} color="white" />
                <Text style={styles.homeButtonText}>View Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.newAnalysisButton}
                onPress={startNewAnalysis}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Upload Section - Only show when no results */}
        {!analysisResult && (
          <>
            <Text style={styles.subtitle}>
              Choose how you'd like to upload your X-ray image
            </Text>

            {/* Upload Options */}
            <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
            <Ionicons name="camera" size={32} color={COLORS.primary} />
            <Text style={styles.optionText}>Take Photo</Text>
            <Text style={styles.optionSubtext}>Use camera to capture X-ray</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={pickFromGallery}>
            <Ionicons name="images" size={32} color={COLORS.primary} />
            <Text style={styles.optionText}>From Gallery</Text>
            <Text style={styles.optionSubtext}>Select from photo library</Text>
          </TouchableOpacity>
        </View>

        {/* Selected File Preview */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Selected Image:</Text>

            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity style={styles.removeButton} onPress={clearSelection}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upload Button */}
        {selectedImage && (
          <View style={styles.uploadContainer}>
            {isUploading && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={uploadFile}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Text style={styles.uploadButtonText}>Upload X-Ray</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Supported Formats:</Text>
              <Text style={styles.infoText}>
                • JPEG, PNG images{'\n'}
                • Maximum file size: 10MB
              </Text>

              <Text style={styles.infoTitle}>Tips:</Text>
              <Text style={styles.infoText}>
                • Ensure good lighting when taking photos{'\n'}
                • Position X-ray clearly in frame{'\n'}
                • Avoid blurry or distorted images
              </Text>
            </View>
          </>
        )}
        </View>
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
  headerWrapper: {
    marginBottom: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
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
  headerContent: {
    alignItems: 'center',
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  resultsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    ...SHADOWS.card,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#10B98115',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  optionSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  imagePreview: {
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  uploadContainer: {
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  // Results Display Styles
  resultImageContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  resultImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  gradeTextContainer: {
    marginLeft: 12,
  },
  gradeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  gradeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  gradeDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
  },
  recommendationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recommendationText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  homeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  newAnalysisButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  newAnalysisButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default XRayUploadScreen;