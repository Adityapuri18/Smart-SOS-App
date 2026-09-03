import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors } from '../theme/colors';

export default function AboutScreen() {
  const nav = useNavigation();

  const features = [
    { icon: '🆘', title: 'One-Tap SOS', desc: 'Instantly alert all emergency contacts with your live location' },
    { icon: '📍', title: 'Live Location', desc: 'Share real-time GPS coordinates with contacts and authorities' },
    { icon: '📞', title: 'Emergency Contacts', desc: 'Add up to 10 trusted contacts who receive your SOS alerts' },
    { icon: '🔒', title: 'Biometric Security', desc: 'Protect your app and profile with fingerprint or face ID' },
    { icon: '📊', title: 'Alert History', desc: 'Full log of past SOS events with locations and timestamps' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
          <View style={styles.line} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About App</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.appIconWrap}>
            <Text style={styles.appIcon}>🛡️</Text>
          </View>
          <Text style={styles.appName}>SOS Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Your personal safety companion</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What we offer</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for your safety</Text>
          <Text style={styles.footerSub}>© 2026 SOS Mobile. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFD' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  menuBtn: { padding: 6, justifyContent: 'center' },
  line: {
    width: 22, height: 2.5, backgroundColor: '#fff',
    borderRadius: 2, marginVertical: 2,
  },
  lineShort: { width: 14 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '800' },

  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 36,
  },
  appIconWrap: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  appIcon: { fontSize: 46 },
  appName: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  appVersion: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  appTagline: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 6 },

  section: { padding: 20 },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: Colors.textDark,
    marginBottom: 14,
  },
  featureCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12,
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  featureIcon: { fontSize: 22 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 3 },
  featureDesc: { fontSize: 12, color: Colors.textMedium, lineHeight: 17 },

  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 14, color: Colors.textMedium, fontWeight: '500' },
  footerSub: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
});
