import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
  route: RouteProp<RootStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [phoneOrEmail, setPhoneOrEmail] = useState(route.params?.phoneOrEmail || '');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { requestPasswordReset, resetPassword } = useAuth();

  const handleRequestReset = async () => {
    if (!phoneOrEmail.trim()) {
      Alert.alert('Error', 'Please enter phone number or email');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(phoneOrEmail);
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your phone/email. Enter the token to reset your password.'
      );
      setStep('reset');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to request password reset.');
      console.error('Request reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim()) {
      Alert.alert('Error', 'Please enter the reset token');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      Alert.alert('Success', 'Password has been reset successfully!');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to reset password.');
      console.error('Reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shield Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.shield}>
            <Text style={styles.shieldText}>🔐</Text>
          </View>
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === 'request'
            ? 'Enter your phone or email to receive reset instructions'
            : 'Enter the reset token and your new password'}
        </Text>

        <View style={styles.card}>
          {step === 'request' ? (
            <>
              <Text style={styles.label}>Phone or Email</Text>
              <View style={styles.inputRow}>
                <Text style={styles.icon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 000-0000 or email@example.com"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="email-address"
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                  editable={!loading}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.textWhite} />
                ) : (
                  <Text style={styles.buttonText}>Request Reset</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Reset Token</Text>
              <View style={styles.inputRow}>
                <Text style={styles.icon}>🔑</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter token from email/SMS"
                  placeholderTextColor={Colors.textLight}
                  value={resetToken}
                  onChangeText={setResetToken}
                  editable={!loading}
                />
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputRow}>
                <Text style={styles.icon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!loading}
                />
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Text style={styles.icon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={styles.showPasswordRow}
                onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showPasswordText}>
                  {showPassword ? '👁️ Hide Password' : '👁️ Show Password'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.textWhite} />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backRow}
                onPress={() => setStep('request')}
                disabled={loading}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}>
            <Text style={styles.loginText}>
              Remember your password?{' '}
              <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  shield: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E8F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldText: {
    fontSize: 32,
    color: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: Colors.textMedium,
    marginBottom: 10,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.textDark,
  },
  showPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  showPasswordText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backRow: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  backText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginRow: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.textMedium,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
