import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User, LoginCredentials, SignupData, OTPVerification } from '@/services/authService';
import { STORAGE_KEYS } from '@/config/constants';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<{ email: string }>;
  verifyOTP: (data: OTPVerification) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
      ]);

      const tokenValue = storedToken[1];
      const userValue = storedUser[1];

      if (tokenValue && userValue) {
        setToken(tokenValue);
        setUser(JSON.parse(userValue));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      await saveAuthData(response.user, response.token);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (data: SignupData): Promise<{ email: string }> => {
    try {
      await authService.signup(data);
      return { email: data.email };
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (data: OTPVerification) => {
    try {
      const response = await authService.verifyOTP(data);
      await saveAuthData(response.user, response.token);
    } catch (error) {
      throw error;
    }
  };

  const resendOTP = async (email: string) => {
    try {
      await authService.resendOTP(email);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuthData();
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await authService.getCurrentUser();
      updateUser(response.user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const saveAuthData = async (userData: User, tokenValue: string) => {
    setUser(userData);
    setToken(tokenValue);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, tokenValue],
      [STORAGE_KEYS.USER, JSON.stringify(userData)],
    ]);
  };

  const clearAuthData = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    verifyOTP,
    resendOTP,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
