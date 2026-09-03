import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

export default function ProfileScreen() {
  const nav = useNavigation();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const contacts = await apiService.getContacts();
      const alerts = await apiService.getAlerts();
      setContactsCount(contacts?.length || 0);
      setAlertsCount(alerts?.length || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await logout();
            nav.reset({ index: 0, routes: [{ name: 'Login' as never }] });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
          <View style={styles.line} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditing(!editing)}>
          <Text style={styles.editText}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.hero}>
          <View style={styles.circleBg1} />
          <View style={styles.circleBg2} />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {user?.name?.substring(0, 2).toUpperCase() || 'AR'}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.phone}>{user?.phone || 'Phone not set'}</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Protected & Active</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{contactsCount}</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{alertsCount}</Text>
            <Text style={styles.statLabel}>Alerts Sent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>∞</Text>
            <Text style={styles.statLabel}>Protected</Text>
          </View>
        </View>

        {/* Personal Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#EEF5FF' }]}>
              <Text style={styles.sectionIcon}>👤</Text>
            </View>
            <Text style={styles.sectionTitle}>Personal Info</Text>
          </View>
          {[
            { label: 'Full Name', value: user?.name || 'Not set' },
            { label: 'Email', value: user?.email || 'Not set' },
            { label: 'Phone', value: user?.phone || 'Not set' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFD' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14,
  },
  backBtn: { padding: 6, justifyContent: 'center' },
  line: {
    width: 22, height: 2.5, backgroundColor: '#fff',
    borderRadius: 2, marginVertical: 2,
  },
  lineShort: { width: 14 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '800' },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  editText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },

  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingBottom: 36,
    paddingTop: 10,
    overflow: 'hidden',
  },
  circleBg1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  circleBg2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -30,
  },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 26, fontWeight: '900' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4, width: 16, height: 16,
    borderRadius: 8, backgroundColor: '#34C759', borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  phone: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 12 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#34C759', marginRight: 7,
  },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20, marginTop: -20,
    backgroundColor: '#fff', borderRadius: 18,
    paddingVertical: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 14, elevation: 6,
    marginBottom: 16,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', color: Colors.textDark },
  statLabel: { fontSize: 11, color: Colors.textMedium, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 14,
  },
  sectionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textDark },
  editLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  medGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  medCell: { width: '50%', paddingVertical: 8, paddingRight: 8 },
  medCellLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.textLight,
    letterSpacing: 0.8, marginBottom: 4,
  },
  medCellValue: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  conditionRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  conditionValue: { fontSize: 14, color: Colors.textDark, marginTop: 4, lineHeight: 20 },

  infoRow: { paddingVertical: 12 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 14, color: Colors.textDark, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, backgroundColor: '#FEF2F2',
    borderRadius: 14, padding: 16, gap: 10,
  },
  logoutIcon: { fontSize: 20, color: Colors.primary },
  logoutText: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
});
