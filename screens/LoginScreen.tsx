import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title } from '../components/StyledComponents';
import { theme } from '../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation types

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  salt: string;
};

const db = SQLite.openDatabaseSync('spotify.db');

const LoginScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Get user by email
      console.log('Attempting login with email:', email.trim());
      const users = await db.getAllAsync<User>('SELECT * FROM users WHERE email = ?', [email.trim()]);
      console.log('Found users:', users);
      
      if (!users || users.length === 0) {
        Alert.alert('Error', 'Invalid email or password');
        setIsLoading(false);
        return;
      }
      
      const user = users[0];
      console.log('Found user:', { ...user, password: '[REDACTED]' });
      
      // Hash the entered password with the stored salt
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        user.salt + password
      );
      console.log('Password verification:', {
        enteredHash: hash,
        storedHash: user.password,
        match: hash === user.password
      });
      
      if (hash === user.password) {
        // Store user session data
        await AsyncStorage.setItem('user_token', 'logged_in');
        await AsyncStorage.setItem('profile_username', user.username);
        await AsyncStorage.setItem('profile_email', user.email);
        
        console.log('Login successful, navigating to Dashboard');
        navigation.navigate('Dashboard');
      } else {
        console.log('Password hash mismatch');
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsResetting(true);
    try {
      const users = await db.getAllAsync<User>('SELECT * FROM users WHERE email = ?', [resetEmail.trim()]);
      if (!users || users.length === 0) {
        Alert.alert('Error', 'No account found with this email address');
        return;
      }

      // Simple verification - ask for username
      const user = users[0];
      Alert.prompt(
        'Verify Account',
        'Please enter your username to verify your account:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsResetting(false)
          },
          {
            text: 'Verify',
            onPress: (username) => {
              if (username === user.username) {
                setShowNewPassword(true);
              } else {
                Alert.alert('Error', 'Incorrect username');
                setIsResetting(false);
              }
            }
          }
        ],
        'plain-text'
      );
    } catch (error) {
      console.error('Error during password reset:', error);
      Alert.alert('Error', 'An error occurred while verifying your email');
      setIsResetting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsResetting(true);
    try {
      const users = await db.getAllAsync('SELECT * FROM users WHERE email = ?', [resetEmail.trim()]);
      if (!users || users.length === 0) {
        Alert.alert('Error', 'Account not found');
        return;
      }

      const user = users[0];
      const salt = Math.random().toString(36).substring(2, 15);
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + newPassword
      );

      await db.runAsync(
        'UPDATE users SET password = ?, salt = ? WHERE email = ?',
        [hashedPassword, salt, resetEmail.trim()]
      );

      Alert.alert('Success', 'Password has been reset successfully');
      closeForgotPasswordModal();
    } catch (error) {
      console.error('Error during password reset:', error);
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setForgotPasswordModalVisible(false);
    setResetEmail('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setIsResetting(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/mc.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Title style={styles.title}>Welcome Back</Title>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => setForgotPasswordModalVisible(true)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={forgotPasswordModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeForgotPasswordModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              
              {!showNewPassword ? (
                <>
                  <Text style={styles.modalSubtitle}>
                    Enter your email address to reset your password
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isResetting}
                  />
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      onPress={closeForgotPasswordModal}
                      disabled={isResetting}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      onPress={handleForgotPassword}
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                          Continue
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalSubtitle}>
                    Create a new password for your account
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.modalInput, styles.passwordInput]}
                      placeholder="New Password"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      editable={!isResetting}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={showNewPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.modalInput, styles.passwordInput]}
                      placeholder="Confirm New Password"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry={!showNewPassword}
                      editable={!isResetting}
                    />
                  </View>
                  <Text style={styles.passwordHint}>
                    Password must be at least 6 characters long
                  </Text>
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      onPress={() => setShowNewPassword(false)}
                      disabled={isResetting}
                    >
                      <Text style={styles.modalButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      onPress={handleResetPassword}
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                          Reset Password
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    color: theme.colors.text,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50, // Make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
});

export default LoginScreen; 