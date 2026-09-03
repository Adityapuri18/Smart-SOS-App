import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * @deprecated OTPScreen is no longer used. Direct JWT authentication is now implemented.
 * Use LoginScreen and RegisterScreen instead.
 */
export default function OTPScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>OTP Screen - Deprecated</Text>
      <Text style={styles.subtitle}>
        Direct JWT authentication is now implemented. Use LoginScreen instead.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMedium,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
