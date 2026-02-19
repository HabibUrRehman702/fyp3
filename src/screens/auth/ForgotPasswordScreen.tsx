import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { COLORS, APP_CONFIG } from '@/config/constants';
import { AuthStackParamList } from '@/navigation/AppNavigator';
import apiClient, { handleApiError } from '@/services/api';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

type Step = 'email' | 'otp' | 'newPassword';

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(APP_CONFIG.OTP_LENGTH).fill(''));
  const [verifiedOtp, setVerifiedOtp] = useState(''); // Store verified OTP for password reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (step === 'otp' && countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend, step]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Invalid email format' });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, APP_CONFIG.OTP_LENGTH).split('');
      const newOtpArray = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i + index < APP_CONFIG.OTP_LENGTH) {
          newOtpArray[i + index] = char;
        }
      });
      setOtp(newOtpArray);
      const lastIndex = Math.min(index + pastedOtp.length - 1, APP_CONFIG.OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtpArray = [...otp];
    newOtpArray[index] = value;
    setOtp(newOtpArray);

    if (value && index < APP_CONFIG.OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== APP_CONFIG.OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the complete OTP code');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/verify-reset-otp', { 
        email: email.trim().toLowerCase(), 
        otp: otpCode 
      });
      setVerifiedOtp(otpCode); // Store the verified OTP
      setStep('newPassword');
    } catch (error: any) {
      Alert.alert('Error', handleApiError(error));
      setOtp(Array(APP_CONFIG.OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Prevent double submission
    if (loading) return;

    const newErrors: { [key: string]: string } = {};

    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: verifiedOtp,
        newPassword,
      });
      
      // Handle success - use web-compatible alert
      if (Platform.OS === 'web') {
        window.alert('Password reset successful! Please login with your new password.');
        navigation.navigate('Login');
      } else {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset. Please login with your new password.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(handleApiError(error));
      } else {
        Alert.alert('Error', handleApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      Alert.alert('Success', 'A new OTP has been sent to your email');
      setCanResend(false);
      setCountdown(60);
      setOtp(Array(APP_CONFIG.OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-open-outline" size={50} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a code to reset your password
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={errors.email}
        />

        <Button
          title="Send Reset Code"
          onPress={handleSendOtp}
          loading={loading}
          fullWidth
        />
      </View>
    </>
  );

  const renderOtpStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="keypad-outline" size={50} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Enter the {APP_CONFIG.OTP_LENGTH}-digit code sent to
        </Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled,
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={APP_CONFIG.OTP_LENGTH}
            selectTextOnFocus
            placeholderTextColor={COLORS.textMuted}
          />
        ))}
      </View>

      <Button
        title="Verify Code"
        onPress={handleVerifyOtp}
        loading={loading}
        fullWidth
        disabled={otp.join('').length !== APP_CONFIG.OTP_LENGTH}
      />

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        {canResend ? (
          <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
            <Text style={styles.resendLink}>
              {loading ? 'Sending...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.countdown}>Resend in {countdown}s</Text>
        )}
      </View>
    </>
  );

  const renderNewPasswordStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={50} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>
          Enter a new password for your account
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          icon="lock-closed-outline"
          error={errors.newPassword}
        />

        <Input
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          icon="lock-closed-outline"
          error={errors.confirmPassword}
        />

        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          loading={loading}
          fullWidth
        />
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={styles.gradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (step === 'email') {
              navigation.goBack();
            } else if (step === 'otp') {
              setStep('email');
            } else {
              setStep('otp');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'newPassword' && renderNewPasswordStep()}

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  form: {
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  countdown: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
