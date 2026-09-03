import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../theme/colors';
import { apiService } from '../services/apiService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SOSAlert'>;
};

export default function SOSAlertScreen({ navigation }: Props) {
  const [count, setCount] = useState(5);
  const [isAlertSent, setIsAlertSent] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const alertIdRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Request location permissions and get current location
  useEffect(() => {
    const getLocation = async () => {
      try {
        let hasPermission = false;
        if (Platform.OS === 'ios') {
          Geolocation.requestAuthorization();
          hasPermission = true;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'SOS Alert needs your location to notify emergency contacts.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!hasPermission) {
          setLocationError('Location permission denied');
          setIsLoadingLocation(false);
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setIsLoadingLocation(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Failed to get location');
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
      } catch (error: any) {
        console.error('Error getting location:', error);
        setLocationError('Failed to get location');
        setIsLoadingLocation(false);
      }
    };

    getLocation();
  }, []);

  // Send alert to backend when location is available
  const sendAlert = useCallback(async () => {
    try {
      if (!location) {
        Alert.alert('Error', 'Location not available. Please try again.');
        return;
      }

      const locationLink = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=18/${location.latitude}/${location.longitude}`;
      const message = `SOS! Emergency alert activated. Location: ${locationLink}`;

      console.log('[SOS] Triggering alert to backend...');
      const response = await apiService.triggerAlert(location.latitude, location.longitude, message);
      
      console.log('[SOS] Backend response:', response);
      alertIdRef.current = response?.alert?._id || null;
      
      // Get notification status from backend response
      const backendNotified = response?.notified || 0;
      const backendEnabled = response?.notificationsEnabled || false;
      
      setNotifiedCount(backendNotified);
      setNotificationsEnabled(backendEnabled);
      
      if (backendEnabled) {
        setBackendMessage(`✅ SMS & Call notifications sent to ${backendNotified} contact${backendNotified !== 1 ? 's' : ''}`);
        console.log(`[SOS] Backend successfully notified ${backendNotified} contacts via Twilio`);
      } else {
        setBackendMessage(`⚠️ Twilio not configured. Alert created but SMS/calls not sent.`);
        console.warn('[SOS] Twilio SMS/calls not available on backend');
      }
      
      setIsAlertSent(true);
      startLocationTracking();
    } catch (error: any) {
      console.error('[SOS] Error sending alert:', error);
      setBackendMessage(`❌ Error: ${error?.message || 'Failed to send alert'}`);
      Alert.alert('Error', error?.message || 'Failed to send alert. Please try again.');
    }
  }, [location]);

  useEffect(() => {
    if (location && !isAlertSent) {
      sendAlert();
    }
  }, [location, isAlertSent, sendAlert]);

  // Live location tracking every 5 seconds
  const startLocationTracking = () => {
    if (!alertIdRef.current) return;

    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    watchIdRef.current = Geolocation.watchPosition(
      async (position) => {
        if (alertIdRef.current) {
          try {
            await apiService.updateAlertLocation(
              alertIdRef.current,
              position.coords.latitude,
              position.coords.longitude
            );
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      },
      (error) => console.error('Location watch error:', error),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (count <= 0 && isAlertSent) {
      navigation.replace('HelpSent', { notifiedCount: notifiedCount });
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, navigation, isAlertSent, notifiedCount]);

  const handleCancelAlert = async () => {
    try {
      Alert.alert(
        'Cancel Alert?',
        'Are you sure you want to cancel the emergency alert?',
        [
          {
            text: 'No, keep alert',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Yes, cancel',
            onPress: async () => {
              if (alertIdRef.current) {
                await apiService.stopAlert(alertIdRef.current);
              }
              navigation.goBack();
            },
            style: 'destructive',
          },
        ]
      );
    } catch (error) {
      console.error('Error canceling alert:', error);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />

      <Text style={styles.title}>Emergency Alert</Text>
      <Text style={styles.subtitle}>Notifying your emergency contacts</Text>

      {isLoadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : locationError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setIsLoadingLocation(true);
              setLocationError(null);
              Geolocation.getCurrentPosition(
                (position) => {
                  setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  });
                  setIsLoadingLocation(false);
                },
                (err) => {
                  console.error('Retry location error:', err);
                  setLocationError('Failed to get location');
                  setIsLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
              );
            }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Countdown Circle */}
          <View style={styles.countdownOuter}>
            <View style={styles.countdownInner}>
              <Text style={styles.countdownText}>{count}</Text>
            </View>
          </View>

          {isAlertSent && (
            <View style={styles.statusContainer}>
              <Text style={styles.sentIndicator}>✓ Alert Sent</Text>
              {location && (
                <Text style={styles.locationText}>
                  📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              )}
              {backendMessage && (
                <View style={styles.backendMessageContainer}>
                  <Text style={styles.backendMessageText}>{backendMessage}</Text>
                </View>
              )}
              {notificationsEnabled && notifiedCount > 0 && (
                <Text style={styles.contactsInfo}>
                  {notifiedCount} contact{notifiedCount !== 1 ? 's' : ''} receiving SMS & calls
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelAlert}>
            <Text style={styles.cancelText}>✕   Cancel Alert</Text>
          </TouchableOpacity>
        </>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textWhite,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 50,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textWhite,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textWhite,
    fontWeight: '600',
  },
  countdownOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(232,50,58,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  statusContainer: {
    marginBottom: 40,
  },
  sentIndicator: {
    fontSize: 14,
    color: Colors.green,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  calledText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactsInfo: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  cancelBtn: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  contactsStatusContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  backendMessageContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  contactStatusText: {
    fontSize: 12,
    color: Colors.textLight,
    marginVertical: 4,
    fontWeight: '500',
  },
  backendMessageText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
    textAlign: 'center',
  },
});
