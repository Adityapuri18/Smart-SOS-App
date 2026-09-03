import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HelpSent'>;
  route: RouteProp<RootStackParamList, 'HelpSent'>;
};

export default function HelpSentScreen({ navigation, route }: Props) {
  const notifiedCount = route.params?.notifiedCount || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />

      {/* Green Checkmark */}
      <View style={styles.checkOuter}>
        <View style={styles.checkInner}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      </View>

      <Text style={styles.title}>Help Sent!</Text>
      <Text style={styles.subtitle}>
        Your live location has been shared with {notifiedCount} {notifiedCount === 1 ? 'contact' : 'contacts'} and local authorities.
      </Text>

      {/* Location Card */}
      <View style={styles.locationCard}>
        <Text style={styles.locationIcon}>📍</Text>
        <View>
          <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
          <Text style={styles.locationValue}>Fetching satellite fix...</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.safeBtn}
        onPress={() => {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }}>
        <Text style={styles.safeBtnText}>I am Safe Now</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  checkOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(52,199,89,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 38,
    color: Colors.textWhite,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textWhite,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 50,
    gap: 12,
  },
  locationIcon: { fontSize: 22 },
  locationLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  safeBtn: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  safeBtnText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});
