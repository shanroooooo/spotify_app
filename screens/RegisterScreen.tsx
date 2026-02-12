import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { Title } from '../components/StyledComponents';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';



type RootStackParamList = { Login: undefined };
type NavigationProp = StackNavigationProp<RootStackParamList>;

// Use openDatabaseSync for compatibility
const db = SQLite.openDatabaseSync('spotify.db');

const SignUpScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ passwordMatch: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Use async IIFE for execAsync
    (async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          email TEXT UNIQUE,
          password TEXT,
          salt TEXT
        );
      `);
      // Try to add the column if it doesn't exist
      try {
        await db.execAsync('ALTER TABLE users ADD COLUMN username TEXT;');
      } catch (e) {
        // Ignore error if column already exists
      }
    })();
  }, []);

  const handleSignUp = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrors({ passwordMatch: true });
      return;
    }

    setErrors({ passwordMatch: false });
    setIsSubmitting(true);

    try {
      // Check if email already exists
      const existingUsers = await db.getAllAsync('SELECT * FROM users WHERE email = ?', [form.email]);
      if (existingUsers && existingUsers.length > 0) {
        Alert.alert('Error', 'An account with this email already exists.');
        setIsSubmitting(false);
        return;
      }

      const salt = Math.random().toString(36).substring(2, 15);
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + form.password
      );

      // Insert new user without deleting others
      await db.runAsync(
        'INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?);',
        [form.username, form.email, hashedPassword, salt]
      );

      // prevents any old session data from interfering with the new registration
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('profile_username');
      await AsyncStorage.removeItem('profile_email');
      await AsyncStorage.removeItem('profile_image');
      await AsyncStorage.removeItem('profile_image_updated');

      Alert.alert('Success', 'Account created successfully!');
      setForm({ username: '', email: '', password: '', confirmPassword: '' });
      navigation.navigate('Login');
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE constraint failed')) {
        Alert.alert('Error', 'Failed to create account. Email may already exist.');
      } else {
        Alert.alert('Error', 'Failed to create account.');
      }
      console.error('Error during signup:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <Title style={styles.title}>Create Account</Title>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={theme.colors.textSecondary}
              value={form.username}
              onChangeText={t => setForm(f => ({ ...f, username: t }))}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              value={form.email}
              onChangeText={t => setForm(f => ({ ...f, email: t }))}
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
                value={form.password}
                secureTextEntry={!showPassword}
                onChangeText={t => setForm(f => ({ ...f, password: t }))}
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

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={form.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                onChangeText={t => setForm(f => ({ ...f, confirmPassword: t }))}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {errors.passwordMatch && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}

          <TouchableOpacity
            style={[styles.signUpButton, isSubmitting && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;