import React, { useState } from 'react';
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

const faqs = [
  {
    q: 'How does the SOS alert work?',
    a: 'When you tap the SOS button, the app sends your live GPS location to all saved emergency contacts via SMS and triggers a countdown.',
  },
  {
    q: 'Can I cancel an SOS alert?',
    a: 'Yes! You have a 5-second countdown window. Tap "Cancel Alert" before the countdown ends to prevent the alert from sending.',
  },
  {
    q: 'How many contacts can I add?',
    a: 'You can add up to 10 emergency contacts who will receive your SOS alerts.',
  },
  {
    q: 'Is my location data stored?',
    a: 'Location data is only used during an active SOS event and stored in your local history. We do not share data with third parties.',
  },
  {
    q: 'What is Silent SOS Mode?',
    a: 'Silent SOS sends your alert without any sound or visual notification on your phone — useful in situations where you cannot be discovered.',
  },
];

export default function HelpScreen() {
  const nav = useNavigation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🆘</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Need help?</Text>
            <Text style={styles.bannerSub}>Browse our FAQs or contact our support team</Text>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.supportRow}>
          {[
            { icon: '📧', label: 'Email Us', sub: 'support@sosmobile.com', color: '#EEF5FF' },
            { icon: '📱', label: 'Call Us', sub: '+1 800 SOS HELP', color: '#F0FFF4' },
          ].map((s, i) => (
            <TouchableOpacity key={i} style={[styles.supportCard, { backgroundColor: s.color }]}>
              <Text style={styles.supportIcon}>{s.icon}</Text>
              <Text style={styles.supportLabel}>{s.label}</Text>
              <Text style={styles.supportSub}>{s.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, openIndex === i && styles.faqCardOpen]}
            onPress={() => setOpenIndex(openIndex === i ? null : i)}
            activeOpacity={0.85}>
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, openIndex === i && styles.faqQOpen]}>
                {faq.q}
              </Text>
              <Text style={styles.faqChevron}>{openIndex === i ? '▲' : '▼'}</Text>
            </View>
            {openIndex === i && <Text style={styles.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
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

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, gap: 12,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  bannerIcon: { fontSize: 32 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  bannerSub: { fontSize: 12, color: Colors.textMedium, marginTop: 2 },

  supportRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  supportCard: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  supportIcon: { fontSize: 26, marginBottom: 6 },
  supportLabel: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  supportSub: { fontSize: 10, color: Colors.textMedium, marginTop: 2, textAlign: 'center' },

  faqTitle: {
    fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 12,
  },
  faqCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  faqCardOpen: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textDark, lineHeight: 20 },
  faqQOpen: { color: Colors.primary },
  faqChevron: { fontSize: 11, color: Colors.textLight, marginLeft: 8, marginTop: 3 },
  faqA: {
    fontSize: 13, color: Colors.textMedium, lineHeight: 20,
    marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10,
  },
});
