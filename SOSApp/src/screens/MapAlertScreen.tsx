import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../theme/colors';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MapAlert'>;
};

interface Alert {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  message?: string;
  active: boolean;
  createdAt: string;
}

export default function MapAlertScreen({ navigation }: Props) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(13);
  const { isSignedIn } = useAuth();

  // Get user location
  useEffect(() => {
    const getUserLocation = async () => {
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
              message: 'This app needs access to your location to show alerts nearby.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!hasPermission) {
          console.error('Location permission denied');
          setLoading(false);
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });

            // Update map center to user location
            setMapCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
      } catch (error) {
        console.error('Error in location permission setup:', error);
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAlerts();
        setAlerts(response.alerts || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Initialize socket.io for real-time updates (if available)
    if (isSignedIn) {
      try {
        const getTokenAsync = async () => {
          const token = await apiService.getToken();
          if (token && !socketService.isConnected()) {
            socketService.connect(token);

            // Listen for new alerts
            socketService.onAlertTriggered((data) => {
              console.log('New alert triggered:', data);
              setAlerts((prevAlerts) => {
                const alertExists = prevAlerts.some((a) => a._id === data.alert?._id);
                if (!alertExists && data.alert) {
                  return [data.alert, ...prevAlerts];
                }
                return prevAlerts;
              });
            });

            // Listen for location updates (real-time every 5 seconds)
            socketService.onAlertLocation((data) => {
              console.log('Alert location updated:', data);
              setAlerts((prevAlerts) =>
                prevAlerts.map((alert) => {
                  if (alert._id === data.id) {
                    return {
                      ...alert,
                      location: {
                        type: 'Point',
                        coordinates: [data.longitude, data.latitude],
                      },
                    };
                  }
                  return alert;
                })
              );

              // Update selected alert if it's the one being updated
              if (selectedAlert && selectedAlert._id === data.id) {
                setSelectedAlert((prevSelected) => {
                  if (prevSelected) {
                    return {
                      ...prevSelected,
                      location: {
                        type: 'Point',
                        coordinates: [data.longitude, data.latitude],
                      },
                    };
                  }
                  return prevSelected;
                });
              }
            });

            // Listen for alert stopped
            socketService.onAlertStopped((data) => {
              console.log('Alert stopped:', data);
              setAlerts((prevAlerts) =>
                prevAlerts.map((alert) => {
                  if (alert._id === data.id) {
                    return { ...alert, active: false };
                  }
                  return alert;
                })
              );
            });
          }
        };

        getTokenAsync();
      } catch (error) {
        console.error('Error setting up socket.io:', error);
      }
    }

    // Fallback: Refresh alerts every 10 seconds if socket.io not available
    const interval = setInterval(fetchAlerts, 10000);
    return () => {
      clearInterval(interval);
      socketService.offAlertLocation();
      socketService.offAlertTriggered();
      socketService.offAlertStopped();
    };
  }, [isSignedIn, selectedAlert]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`;
  };

  const handleMarkerPress = (alert: Alert) => {
    if (!alert?.location?.coordinates) return;
    setSelectedAlert(alert);
    const [longitude, latitude] = alert.location.coordinates;
    setMapCenter({
      lat: latitude,
      lng: longitude,
    });
    setZoom(15);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Alerts</Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              socketService.isConnected() ? styles.statusConnected : styles.statusPolling,
            ]}
          />
          <Text style={styles.statusText}>
            {socketService.isConnected() ? 'Live' : 'Polling'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {userLocation && mapCenter ? (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.mapContainer}
            initialRegion={{
              latitude: mapCenter.lat,
              longitude: mapCenter.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            region={{
              latitude: mapCenter.lat,
              longitude: mapCenter.lng,
              latitudeDelta: zoom === 15 ? 0.01 : 0.05,
              longitudeDelta: zoom === 15 ? 0.01 : 0.05,
            }}
            onPress={() => setSelectedAlert(null)}
          >
            {/* OpenStreetMap Tiles - No API Key Required */}
            <UrlTile
              urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />

            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Your Location"
              pinColor="blue"
            />
            
            {/* Alert markers */}
            {alerts.map((alert) => {
              if (!alert?.location?.coordinates) return null;
              const [longitude, latitude] = alert.location.coordinates;
              return (
                <Marker
                  key={alert._id}
                  coordinate={{ latitude, longitude }}
                  title={alert.active ? 'Active Alert' : 'Resolved Alert'}
                  description={alert.message || 'SOS Alert'}
                  pinColor={alert.active ? 'red' : 'gray'}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMarkerPress(alert);
                  }}
                />
              );
            })}
          </MapView>
        </View>
      ) : (
        <View style={styles.noLocationContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.noLocationText}>Initializing map...</Text>
        </View>
      )}

      {/* Alert details card */}
      {selectedAlert && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>
            {selectedAlert.active ? '🔴 Active' : '✓ Resolved'}
          </Text>
          <Text style={styles.detailsMessage}>{selectedAlert.message || 'SOS Alert'}</Text>
          <Text style={styles.detailsTime}>
            {new Date(selectedAlert.createdAt).toLocaleTimeString()}
          </Text>
          {userLocation && (
            <Text style={styles.detailsDistance}>
              Distance: {calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                selectedAlert.location.coordinates[1],
                selectedAlert.location.coordinates[0]
              )}
            </Text>
          )}
          <TouchableOpacity
            style={styles.directionBtn}
            onPress={() => {
              const [longitude, latitude] = selectedAlert.location.coordinates;
              const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
              Linking.openURL(url).catch((err) => console.error('Failed to open map URL:', err));
            }}>
            <Text style={styles.directionBtnText}>📍 Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textWhite,
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: Colors.green,
  },
  statusPolling: {
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: Colors.textWhite,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noLocationText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    opacity: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  alertMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(200, 200, 200, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'gray',
  },
  activeAlertMarker: {
    backgroundColor: 'rgba(232, 50, 58, 0.8)',
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  alertMarkerText: {
    fontSize: 22,
  },
  detailsCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textWhite,
    marginBottom: 8,
  },
  detailsMessage: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 6,
  },
  detailsTime: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 6,
  },
  detailsDistance: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 12,
  },
  directionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textWhite,
  },
});
