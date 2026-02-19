import apiClient, { ApiResponse, handleApiError } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  userType: 'patient';
}

export interface OTPVerification {
  email: string;
  otp: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'patient';
  profileImageUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  authenticated: boolean;
  message?: string;
}

class AuthService {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Login attempt:', { email: credentials.email });
      console.log('📍 API Base URL:', apiClient.defaults.baseURL);
      
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      console.log('✅ Login successful:', {
        userId: response.data.user._id,
        email: response.data.user.email,
        hasToken: !!response.data.token,
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', handleApiError(error));
      throw new Error(handleApiError(error));
    }
  }

  // Signup (Step 1 - Send OTP)
  async signup(data: SignupData): Promise<ApiResponse> {
    try {
      console.log('📝 Signup attempt:', { email: data.email, userType: data.userType });
      
      const response = await apiClient.post<ApiResponse>('/auth/signup', data);
      
      console.log('✅ OTP sent successfully to:', data.email);
      return response.data;
    } catch (error) {
      console.error('❌ Signup failed:', handleApiError(error));
      throw new Error(handleApiError(error));
    }
  }

  // Verify OTP (Step 2 - Complete Signup)
  async verifyOTP(data: OTPVerification): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/verify-otp', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Resend OTP
  async resendOTP(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ user: User | null; authenticated: boolean; hasCompletedRegistration: boolean }> {
    try {
      const response = await apiClient.get('/auth/user');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Update profile
  async updateProfile(formData: FormData): Promise<{ user: User; message: string }> {
    try {
      const response = await apiClient.put('/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.put<ApiResponse>('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Delete profile picture
  async deleteProfilePicture(): Promise<{ user: User; message: string }> {
    try {
      const response = await apiClient.delete('/api/auth/delete-profile-picture');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
  }
}

export const authService = new AuthService();
