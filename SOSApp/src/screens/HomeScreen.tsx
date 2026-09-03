import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { startVoiceTrigger, stopVoiceTrigger } from '../services/VoiceTriggerService';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<RootNav>();
  const rootNav = useNavigation();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [contactsCount, setContactsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [voiceGuardActive, setVoiceGuardActive] = useState(false);
  const [voiceGuardLoading, setVoiceGuardLoading] = useState(false);

  const heroSize = Math.min(Math.max(240, width * 0.62), 300);
  const ring4Size = heroSize + 58;
  const ring3Size = heroSize + 34;
  const ring2Size = heroSize + 12;
  const ring1Size = heroSize - 18;
  const sosButtonSize = heroSize - 76;
  const greetingName = user?.name?.split(' ')[0] || 'User';
  const avatarText = (user?.name || 'AR')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AR';

  useEffect(() => {
    loadData();
    return () => {
      if (voiceGuardActive) {
        stopVoiceTrigger().catch(() => undefined);
      }
    };
  }, [voiceGuardActive]);

  const loadData = async () => {
    try {
      const contactsRes = await apiService.getContacts();
      setContactsCount(contactsRes?.length || 0);

      const alertsRes = await apiService.getAlerts();
      setAlertsCount(alertsRes?.length || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSOSAlert = () => {
    navigation.navigate('SOSAlert');
  };

  const toggleVoiceGuard = async () => {
    if (voiceGuardLoading) return;

    setVoiceGuardLoading(true);
    if (!voiceGuardActive) {
      const started = await startVoiceTrigger(() => {
        navigation.navigate('SOSAlert');
      });
      setVoiceGuardActive(started);
      if (!started) {
        Alert.alert('Voice Guard', 'Unable to enable voice listening. Please check permissions and try again.');
      }
    } else {
      await stopVoiceTrigger();
      setVoiceGuardActive(false);
    }
    setVoiceGuardLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => navigation.getParent<any>()?.openDrawer()}>
            <View style={styles.line} />
            <View style={[styles.line, styles.lineShort]} />
            <View style={styles.line} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Hello, {greetingName} 👋</Text>
            {/* <View style={styles.safeStatusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.safeStatus}>Protected and ready</Text>
            </View> */}
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.getParent<any>()?.openDrawer()}>
            <Text style={styles.avatarLetters}>{avatarText}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>Emergency Ready</Text>
              <Text style={styles.heroSubtitle}>Tap SOS or activate voice help detection</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeIcon}>🛡️</Text>
            </View>
          </View>

          <View style={styles.sosCard}>
            <View style={[styles.ring4, { width: ring4Size, height: ring4Size }] }>
              <View style={[styles.ring3, { width: ring3Size, height: ring3Size }] }>
                <View style={[styles.ring2, { width: ring2Size, height: ring2Size }] }>
                  <View style={[styles.ring1, { width: ring1Size, height: ring1Size }] }>
                    <TouchableOpacity
                      style={[styles.sosButton, { width: sosButtonSize, height: sosButtonSize, borderRadius: sosButtonSize / 2 }]}
                      onPress={handleSOSAlert}
                      activeOpacity={0.8}>
                      <Text style={styles.sosText}>SOS</Text>
                      <Text style={styles.sosSub}>EMERGENCY</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.tapHint}>Tap for immediate emergency help</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.voiceGuardBadge,
              voiceGuardActive ? styles.guardActive : styles.guardInactive,
            ]}
            onPress={toggleVoiceGuard}
            activeOpacity={0.8}
            disabled={voiceGuardLoading}>
            <Text style={styles.voiceGuardText}>
              {voiceGuardLoading
                ? 'Updating voice guard...'
                : voiceGuardActive
                ? 'Voice Guard active — listening for “Help Help Help”'
                : 'Activate Voice Guard for silent background help listening'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#EEF5FF' }]}
            onPress={() => navigation.navigate('MapAlert')}>
            <Text style={styles.quickIcon}>🗺️</Text>
            <Text style={styles.quickLabel}>Alerts Map</Text>
            <Text style={styles.quickSub}>View on map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#FFF3EE' }]}
            onPress={() => rootNav.dispatch(DrawerActions.openDrawer())}>
            <Text style={styles.quickIcon}>📞</Text>
            <Text style={styles.quickLabel}>Contacts</Text>
            <Text style={styles.quickSub}>{contactsCount} saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#F0FFF4' }]}
            onPress={() => rootNav.dispatch(DrawerActions.openDrawer())}>
            <Text style={styles.quickIcon}>🕐</Text>
            <Text style={styles.quickLabel}>History</Text>
            <Text style={styles.quickSub}>{alertsCount} alerts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  hamburger: { padding: 6, justifyContent: 'center' },
  line: {
    width: 24,
    height: 2.5,
    backgroundColor: Colors.textDark,
    borderRadius: 2,
    marginVertical: 2,
  },
  lineShort: { width: 16 },
  headerCenter: { flex: 1, paddingLeft: 14 },
  greeting: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  safeStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
    marginRight: 6,
  },
  safeStatus: { fontSize: 12, color: Colors.textMedium, fontWeight: '600' },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarLetters: { color: '#fff', fontSize: 14, fontWeight: '800' },
  heroCard: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  heroSubtitle: { fontSize: 12, color: Colors.textMedium, marginTop: 3 },
  heroBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeIcon: { fontSize: 18 },
  sosCard: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  ring4: {
    borderRadius: 999,
    backgroundColor: 'rgba(232,50,58,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring3: {
    borderRadius: 999,
    backgroundColor: 'rgba(232,50,58,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring2: {
    borderRadius: 999,
    backgroundColor: 'rgba(232,50,58,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    borderRadius: 999,
    backgroundColor: 'rgba(232,50,58,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  sosText: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 3 },
  sosSub: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  tapHint: { marginTop: 16, fontSize: 13, color: Colors.textMedium },
  voiceGuardBadge: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  guardActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.14)',
    borderWidth: 1,
    borderColor: Colors.green,
  },
  guardInactive: {
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderWidth: 1,
    borderColor: '#d8dde8',
  },
  voiceGuardText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  quickCard: {
    width: '31.5%',
    minWidth: 96,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIcon: { fontSize: 22, marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: Colors.textDark, marginBottom: 2 },
  quickSub: { fontSize: 10, color: Colors.textMedium, textAlign: 'center' },
});
