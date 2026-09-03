import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { apiService } from '../services/apiService';

interface AlertItem {
  id: string;
  date: string;
  time: string;
  location: string;
  status: 'resolved' | 'active';
}

export default function HistoryScreen() {
  const nav = useNavigation();
  const [historyData, setHistoryData] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiService.getAlerts();
      if (data && Array.isArray(data)) {
        const mappedData = data.map((item: any) => {
          const dateObj = new Date(item.createdAt);
          return {
            id: item._id,
            date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            location: item.location?.coordinates 
              ? `${item.location.coordinates[1].toFixed(4)}, ${item.location.coordinates[0].toFixed(4)}`
              : 'Unknown Location',
            status: item.active ? 'active' : 'resolved' as const,
          };
        });
        setHistoryData(mappedData);
      }
    } catch (error) {
      console.error('Error loading alert history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderItem = ({ item, index }: { item: AlertItem; index: number }) => (
    <View style={styles.timelineRow}>
      {/* Connector */}
      <View style={styles.connectorWrap}>
        <View style={styles.connectorDot} />
        {index < historyData.length - 1 && <View style={styles.connectorLine} />}
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardTop}>
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>SOS ALERT</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'resolved' ? Colors.greenLight : '#FEF2F2' }
          ]}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: item.status === 'resolved' ? Colors.green : Colors.primary }
            ]} />
            <Text style={[
              styles.statusText, 
              { color: item.status === 'resolved' ? Colors.green : Colors.primary }
            ]}>
              {item.status === 'resolved' ? 'Resolved' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Date/Time */}
        <View style={styles.dateRow}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.timeDot}>•</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <View style={styles.locationIconWrap}>
            <Text style={styles.locationIcon}>📍</Text>
          </View>
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>

        {/* View button */}
        <TouchableOpacity style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View Details</Text>
          <Text style={styles.viewBtnArrow}> ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
          <View style={styles.line} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Alert History</Text>
          <Text style={styles.headerSub}>Track all your past SOS events</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{historyData.length}</Text>
          <Text style={styles.statLbl}>Total Alerts</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: Colors.greenLight }]}>
          <Text style={[styles.statNum, { color: Colors.green }]}>
            {historyData.filter(a => a.status === 'resolved').length}
          </Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: Colors.blueLight }]}>
          <Text style={[styles.statNum, { color: Colors.blue }]}>
            {historyData.filter(a => a.status === 'active').length}
          </Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={historyData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No Alert History</Text>
              <Text style={styles.emptySub}>Your past safety alerts will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  emptySub: { fontSize: 14, color: Colors.textMedium, marginTop: 8 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    overflow: 'hidden',
  },
  headerBg: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -70, right: -40,
  },
  menuBtn: { padding: 6, justifyContent: 'center', zIndex: 1 },
  line: { width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2 },
  lineShort: { width: 14 },
  headerCenter: { flex: 1, paddingLeft: 12, zIndex: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  statBox: {
    flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, color: Colors.textMedium, marginTop: 2, fontWeight: '500' },

  // Timeline list
  list: { paddingHorizontal: 16, paddingTop: 10 },
  timelineRow: { flexDirection: 'row', marginBottom: 12 },
  connectorWrap: { width: 28, alignItems: 'center', paddingTop: 18 },
  connectorDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.primary, borderWidth: 3, borderColor: '#FEE2E2',
  },
  connectorLine: {
    width: 2, flex: 1, backgroundColor: '#FECACA', marginTop: 4,
  },

  // Alert card
  card: {
    flex: 1,
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    marginLeft: 8,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sosBadge: {
    backgroundColor: '#FEF2F2', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  sosBadgeText: {
    color: Colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  dateIcon: { fontSize: 12 },
  dateText: { fontSize: 13, color: Colors.textDark, fontWeight: '600' },
  timeDot: { color: Colors.textLight, fontSize: 12 },
  timeText: { fontSize: 12, color: Colors.textMedium },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  locationIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  locationIcon: { fontSize: 12 },
  locationText: { flex: 1, fontSize: 12, color: Colors.textMedium },

  viewBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: 10,
  },
  viewBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  viewBtnArrow: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
});
