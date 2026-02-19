import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { COLORS, SHADOWS, RADIUS, SPACING } from '@/config/constants';
import apiClient from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

const ProfileScreen: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    profileImageUrl: user?.profileImageUrl,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;
  const infoAnim = useRef(new Animated.Value(0)).current;
  const avatarRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(avatarAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(passwordAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(infoAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // Continuous pulse for avatar border
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profileImageUrl: user.profileImageUrl,
      });
    }
  }, [user]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await updateProfilePicture(result.assets[0]);
    }
  };

  const updateProfilePicture = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append('firstName', profileData.firstName);
      formData.append('lastName', profileData.lastName);
      formData.append('email', profileData.email);

      // Create file object for upload
      const fileName = `profile-${Date.now()}.jpg`;
      formData.append('profilePicture', {
        uri: asset.uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      const response = await apiClient.put('/api/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.user) {
        await refreshUser();
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error: any) {
      console.error('Profile picture update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setUpdating(false);
    }
  };

  const deleteProfilePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await apiClient.delete('/api/auth/delete-profile-picture');
              await refreshUser();
              Alert.alert('Success', 'Profile picture deleted successfully');
            } catch (error: any) {
              console.error('Delete profile picture error:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete profile picture');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const updateProfile = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append('firstName', profileData.firstName.trim());
      formData.append('lastName', profileData.lastName.trim());
      formData.append('email', profileData.email.trim());

      const response = await apiClient.put('/api/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.user) {
        await refreshUser();
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    try {
      setUpdating(true);

      await apiClient.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      Alert.alert('Success', 'Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordFields(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use browser confirm on web
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        logout();
      }
    } else {
      // Use native Alert on mobile
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: logout,
          },
        ]
      );
    }
  };

  const hasProfileChanges =
    profileData.firstName !== (user?.firstName || '') ||
    profileData.lastName !== (user?.lastName || '') ||
    profileData.email !== (user?.email || '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <Animated.View
          style={[
            styles.headerContainer,
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
            style={styles.headerGradient}
          >
            <View style={styles.headerDecorations}>
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
            </View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </LinearGradient>
        </Animated.View>

        {/* Profile Picture Section */}
        <Animated.View 
          style={[
            styles.avatarSection,
            {
              opacity: avatarAnim,
              transform: [
                {
                  scale: avatarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.avatarWrapper}>
            <Animated.View style={[styles.avatarGlow, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.avatarContainer}>
              {profileData.profileImageUrl ? (
                <Image
                  source={{ uri: `${apiClient.defaults.baseURL}${profileData.profileImageUrl}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={[COLORS.primary + '40', COLORS.secondary + '40']}
                  style={styles.avatarPlaceholder}
                >
                  <Ionicons name="person" size={50} color={COLORS.primary} />
                </LinearGradient>
              )}
              {updating && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="white" size="large" />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage} disabled={updating}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.cameraButtonGradient}
              >
                <Ionicons name="camera" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          <Text style={styles.userEmail}>{profileData.email}</Text>

          {profileData.profileImageUrl && (
            <TouchableOpacity style={styles.deletePhotoButton} onPress={deleteProfilePicture}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              <Text style={styles.deletePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Personal Information Card */}
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              opacity: formAnim,
              transform: [{
                translateY: formAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profileData.firstName}
                  onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
                  placeholder="Enter first name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profileData.lastName}
                  onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
                  placeholder="Enter last name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder="Enter email"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {hasProfileChanges && (
              <TouchableOpacity style={styles.updateButton} onPress={updateProfile} disabled={updating}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.updateButtonGradient}
                >
                  {updating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.updateButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Password Section Card */}
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              opacity: passwordAnim,
              transform: [{
                translateY: passwordAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => setShowPasswordFields(!showPasswordFields)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.cardTitle}>Security</Text>
              <View style={styles.expandIcon}>
                <Ionicons
                  name={showPasswordFields ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </View>
            </View>

            {showPasswordFields && (
              <View style={styles.passwordSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="key-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                      placeholder="Enter current password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                      placeholder="Enter new password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                      placeholder="Confirm new password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.changePasswordButton} onPress={changePassword} disabled={updating}>
                  <LinearGradient
                    colors={[COLORS.warning, '#FF9800']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.changePasswordGradient}
                  >
                    {updating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={18} color="white" />
                        <Text style={styles.changePasswordText}>Update Password</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Account Information Card */}
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              opacity: infoAnim,
              transform: [{
                translateY: infoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.cardTitle}>Account Details</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Account Type</Text>
                  <Text style={styles.infoValue}>{user?.userType}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.secondary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View 
          style={[
            styles.logoutContainer,
            {
              opacity: infoAnim,
              transform: [{
                translateY: infoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutButtonInner}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

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
  headerContainer: {
    marginBottom: -60,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 80,
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
    bottom: 20,
    left: -30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.primary + '30',
    top: -5,
    left: -5,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    ...SHADOWS.large,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    ...SHADOWS.medium,
  },
  cameraButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  deletePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error + '15',
  },
  deletePhotoText: {
    fontSize: 13,
    color: COLORS.error,
    marginLeft: 6,
    fontWeight: '500',
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginLeft: 14,
  },
  textInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  updateButton: {
    marginTop: 8,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 16,
    paddingTop: 20,
  },
  changePasswordButton: {
    marginTop: 8,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  changePasswordGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  changePasswordText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: COLORS.error + '10',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});

export default ProfileScreen;
