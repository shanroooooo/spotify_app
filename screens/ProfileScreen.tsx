import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { Title } from '../components/StyledComponents';
import { theme } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

const db = SQLite.openDatabaseSync('spotify.db');

const ProfileScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const navigation = useNavigation();
  const [editEmailModalVisible, setEditEmailModalVisible] = useState(false);
  const [editUsernameModalVisible, setEditUsernameModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [updating, setUpdating] = useState(false);
  const [changePassModalVisible, setChangePassModalVisible] = useState(false);
  const [changePassEmail, setChangePassEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Get current user's email from AsyncStorage
        const currentUserEmail = await AsyncStorage.getItem('profile_email');
        if (!currentUserEmail) {
          // No user is logged in
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        // Get user data for the logged-in user only
        const users = await db.getAllAsync('SELECT * FROM users WHERE email = ?', [currentUserEmail]);
        if (!users || users.length === 0) {
          // User not found in database, clear session and redirect to login
          await AsyncStorage.removeItem('user_token');
          await AsyncStorage.removeItem('profile_username');
          await AsyncStorage.removeItem('profile_email');
          await AsyncStorage.removeItem('profile_image');
          await AsyncStorage.removeItem('profile_image_updated');
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
        
        setUser(users[0]);
        const savedImage = await AsyncStorage.getItem('profile_image');
        if (savedImage) setProfileImage(savedImage);
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load user data. Please try logging in again.');
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem('profile_image', result.assets[0].uri);
      await AsyncStorage.setItem('profile_image_updated', 'true');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('profile_username');
    await AsyncStorage.removeItem('profile_email');
    (navigation as any).reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const getProfileImageSource = () => {
    if (!profileImage) return require('../assets/mc.png');
    if (profileImage.startsWith && profileImage.startsWith('asset:')) {
      const assetName = profileImage.replace('asset:', '');
      if (assetName === 'mc.png') return require('../assets/mc.png');
    }
    return { uri: profileImage };
  };

  const pickAssetImage = async (assetName: string) => {
    setProfileImage(`asset:${assetName}`);
    await AsyncStorage.setItem('profile_image', `asset:${assetName}`);
    await AsyncStorage.setItem('profile_image_updated', 'true');
  };

  const openEditEmailModal = () => {
    setNewEmail(user?.email || '');
    setEditEmailModalVisible(true);
  };
  const closeEditEmailModal = () => {
    setEditEmailModalVisible(false);
    setNewEmail('');
  };
  const openEditUsernameModal = () => {
    setNewUsername(user?.username || '');
    setEditUsernameModalVisible(true);
  };
  const closeEditUsernameModal = () => {
    setEditUsernameModalVisible(false);
    setNewUsername('');
  };

  const validateEmail = (email: string) => {
    return /^\S+@\S+\.\S+$/.test(email);
  };
  const validateUsername = (username: string) => {
    // Allow letters, numbers, spaces, and dashes, at least 1 character
    return username.length >= 1 && /^[a-zA-Z0-9 \\-]+$/.test(username);
  };

  const saveEmail = async () => {
    if (!validateEmail(newEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setUpdating(true);
    try {
      await db.runAsync('UPDATE users SET email = ? WHERE id = ?', [newEmail, user.id]);
      setUser({ ...user, email: newEmail });
      closeEditEmailModal();
    } catch (e) {
      Alert.alert('Error', 'Failed to update email.');
    } finally {
      setUpdating(false);
    }
  };
  const saveUsername = async () => {
    if (!validateUsername(newUsername)) {
      Alert.alert(
        'Invalid Username',
        'Usernames can include letters, numbers, spaces, and dashes. Minimum 1 character.'
      );
      return;
    }
    setUpdating(true);
    try {
      await db.runAsync('UPDATE users SET username = ? WHERE id = ?', [newUsername, user.id]);
      setUser({ ...user, username: newUsername });
      closeEditUsernameModal();
    } catch (e) {
      Alert.alert('Error', 'Failed to update username.');
    } finally {
      setUpdating(false);
    }
  };

  // Function to generate a random salt
  const generateSalt = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let salt = '';
    for (let i = 0; i < length; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  };

  // Function to hash password with salt
  const hashPassword = async (password: string, salt: string) => {
    // Use the same order as registration and login: salt + password
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      salt + password
    );
    return hash;
  };

  const openChangePassModal = () => {
    setChangePassEmail('');
    setOldPassword('');
    setNewPassword('');
    setChangePassModalVisible(true);
  };
  const closeChangePassModal = () => {
    setChangePassModalVisible(false);
    setChangePassEmail('');
    setOldPassword('');
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (changePassEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      Alert.alert('Error', 'Email does not match your account.');
      return;
    }
    if (oldPassword.length < 1) {
      Alert.alert('Error', 'Please enter your old password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    setChangingPass(true);
    try {
      // Check old password
      const oldHash = await hashPassword(oldPassword, user.salt);
      if (oldHash !== user.password) {
        Alert.alert('Error', 'Old password is incorrect.');
        setChangingPass(false);
        return;
      }
      // Generate new salt and hash
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);
      await db.runAsync('UPDATE users SET password = ?, salt = ? WHERE id = ?', [newHash, newSalt, user.id]);
      setUser({ ...user, password: newHash, salt: newSalt });
      closeChangePassModal();
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Text style={styles.text}>No user data found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
          <Image
            source={getProfileImageSource()}
            style={styles.avatar}
          />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.title}>User Information</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{user.username}</Text>
            </View>
            <TouchableOpacity onPress={openEditUsernameModal} style={{ padding: 4 }}>
              <Feather name="edit" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <TouchableOpacity onPress={openEditEmailModal} style={{ padding: 4 }}>
              <Feather name="edit" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>Password Security</Text>
          <Text style={styles.label}>Password Hash (SHA-256):</Text>
          <Text style={styles.explanation}>
            This is the hashed version of your password, generated using SHA-256 and a unique salt. The actual password is never stored.
          </Text>
          <Text style={styles.code}>{user.password}</Text>
          <Text style={styles.label}>Salt:</Text>
          <Text style={styles.explanation}>
            The salt is a random string added to your password before hashing, making each hash unique and more secure.
          </Text>
          <Text style={styles.code}>{user.salt}</Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.primary, marginTop: 0, marginBottom: 20 }]}
          onPress={openChangePassModal}
        >
          <Text style={[styles.logoutButtonText, { color: '#fff' }]}>Change Password - {user.username}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log Out - {user.username}</Text>
        </TouchableOpacity>
        <Modal
          visible={editEmailModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeEditEmailModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Email</Text>
              <TextInput
                style={styles.modalInput}
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter new email"
                editable={!updating}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity onPress={closeEditEmailModal} style={styles.modalButton} disabled={updating}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEmail} style={[styles.modalButton, { backgroundColor: theme.colors.primary }]} disabled={updating}>
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>{updating ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={editUsernameModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeEditUsernameModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Username</Text>
              <TextInput
                style={styles.modalInput}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
                placeholder="Enter new username"
                editable={!updating}
              />
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 8, marginBottom: -8 }}>
                Usernames can include letters, numbers, spaces, and dashes. Minimum 1 character.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity onPress={closeEditUsernameModal} style={styles.modalButton} disabled={updating}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveUsername} style={[styles.modalButton, { backgroundColor: theme.colors.primary }]} disabled={updating}>
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>{updating ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={changePassModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeChangePassModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: '#fff' }]}>Change Password</Text>
              <TextInput
                style={[styles.modalInput, { color: '#fff' }]}
                value={changePassEmail}
                onChangeText={setChangePassEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter your email"
                placeholderTextColor="#aaa"
                editable={!changingPass}
              />
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <TextInput
                  style={[styles.modalInput, { color: '#fff', paddingRight: 40 }]}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter old password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showOldPassword}
                  editable={!changingPass}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 10, top: 14 }}
                  onPress={() => setShowOldPassword((prev) => !prev)}
                >
                  <Feather name={showOldPassword ? 'eye' : 'eye-off'} size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <TextInput
                  style={[styles.modalInput, { color: '#fff', paddingRight: 40 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showNewPassword}
                  editable={!changingPass}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 10, top: 14 }}
                  onPress={() => setShowNewPassword((prev) => !prev)}
                >
                  <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#fff', fontSize: 13, marginTop: 8, marginBottom: -8 }}>
                New password must be at least 6 characters.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity onPress={closeChangePassModal} style={styles.modalButton} disabled={changingPass}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChangePassword} style={[styles.modalButton, { backgroundColor: theme.colors.primary }]} disabled={changingPass}>
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>{changingPass ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  avatarWrapper: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.colors.primary },
  changePhotoText: { color: theme.colors.primary, textAlign: 'center', marginTop: 8, fontWeight: 'bold' },
  section: { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 },
  label: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 10 },
  value: { fontSize: 18, color: theme.colors.text, marginBottom: 10 },
  code: { fontSize: 14, color: theme.colors.primary, backgroundColor: '#1a1a1a', padding: 10, borderRadius: 5, marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  text: { fontSize: 16, color: theme.colors.text, textAlign: 'center' },
  explanation: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6, fontStyle: 'italic' },
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: theme.colors.surface,
  },
  modalButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 