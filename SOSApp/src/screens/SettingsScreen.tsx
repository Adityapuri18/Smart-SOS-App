import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors } from '../theme/colors';

interface SettingRowProps {
  iconBg: string;
  iconColor: string;
  icon: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  switchColor: string;
  last?: boolean;
}

function SettingRow({ iconBg, iconColor, icon, label, sublabel, value, onToggle, switchColor, last }: SettingRowProps) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={[styles.iconText, { color: iconColor }]}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: switchColor }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E0E0E0"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [silentSOS, setSilentSOS] = useState(false);
  const [locationShare, setLocationShare] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const nav = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
          <View style={styles.line} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.headerTitle}>Settings</Text>
       
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Safety */}
        <Text style={styles.sectionLabel}>SAFETY</Text>
        <View style={styles.card}>
          <SettingRow
            icon="S" iconBg="#FEE2E2" iconColor={Colors.primary}
            label="Silent SOS Mode"
            sublabel="Send alert without sound or vibration"
            value={silentSOS} onToggle={setSilentSOS}
            switchColor={Colors.primary} />
          <SettingRow
            icon="L" iconBg="#DBEAFE" iconColor={Colors.blue}
            label="Share Live Location"
            sublabel="Share GPS coordinates in SOS events"
            value={locationShare} onToggle={setLocationShare}
            switchColor={Colors.blue} />
        </View>

        {/* Appearance */}
        {/* Security */}
        <Text style={styles.sectionLabel}>SECURITY &amp; NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingRow
            icon="N" iconBg="#FEE2E2" iconColor={Colors.primary}
            label="Push Notifications"
            sublabel="Alert and status notifications"
            value={pushNotifs} onToggle={setPushNotifs}
            switchColor={Colors.primary} last />
        </View>

        {/* App info */}
        <View style={styles.appInfoCard}>
          <View style={styles.appIconBox}>
            <Text style={styles.appIconText}>SOS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>SOS Mobile</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
          <View style={styles.upToDate}>
            <Text style={styles.upToDateText}>Up to date</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: 20,
  },
  headerCircle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)', top: 20, right: 130,
  },
  menuBtn: { padding: 6, justifyContent: 'center', zIndex: 1 },
  line: { width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2 },
  lineShort: { width: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', zIndex: 1 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, zIndex: 1 },

  scroll: { padding: 16 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAAAAA',
    letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, marginTop: 4,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  iconText: { fontSize: 13, fontWeight: '900' },
  rowLabel: { fontSize: 14, color: Colors.textDark, fontWeight: '700' },
  rowSub: { fontSize: 11, color: Colors.textLight, marginTop: 2 },

  appInfoCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  appIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  appIconText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  appName: { fontSize: 14, color: Colors.textDark, fontWeight: '700' },
  appVersion: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  upToDate: {
    backgroundColor: Colors.greenLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  upToDateText: { fontSize: 11, color: Colors.green, fontWeight: '700' },
});
