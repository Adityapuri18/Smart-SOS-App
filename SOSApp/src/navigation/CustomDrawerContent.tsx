import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

interface MenuItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
  badge?: string;
}

function MenuItem({ icon, label, active, onPress, badge }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, active && styles.menuItemActive]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={[styles.menuIconWrap, active && styles.menuIconWrapActive]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
        {label}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : active ? (
        <View style={styles.activeDot} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function CustomDrawerContent(
  props: DrawerContentComponentProps,
) {
  const { navigation, state } = props;
  const { user, logout } = useAuth();
  const activeRouteName = state.routes[state.index]?.name;

  const navItems = [
    { icon: '🏠', label: 'Home', route: 'HomeTabs' },
    { icon: '👤', label: 'My Profile', route: 'Profile' },
    { icon: '📞', label: 'Contacts', route: 'Contacts' },
    { icon: '🕐', label: 'Alert History', route: 'History' },
    { icon: '⚙️', label: 'Settings', route: 'Settings' },
  ];

  const bottomItems = [
    { icon: 'ℹ️', label: 'About App', route: 'AboutApp' },
    { icon: '🆘', label: 'Help & Support', route: 'HelpSupport' },
  ];

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View style={styles.header}>
        {/* Background circles */}
        <View style={styles.circleBig} />
        <View style={styles.circleSmall} />

        {/* Avatar */}
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.substring(0, 2).toUpperCase() || 'AR'}
            </Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
 
        {/* User info */}
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userPhone}>{user?.phone || 'No phone'}</Text>
 
        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDotGreen} />
          <Text style={styles.statusText}>Protected</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}>
        <Text style={styles.sectionLabel}>MAIN MENU</Text>
        {navItems.map(item => (
          <MenuItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            active={
              activeRouteName === item.route ||
              (item.route === 'HomeTabs' && activeRouteName === 'HomeTabs')
            }
            onPress={() => navigation.navigate(item.route)}
          />
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        {bottomItems.map(item => (
          <MenuItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            active={activeRouteName === item.route}
            onPress={() => navigation.navigate(item.route)}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
          }}>
          <Text style={styles.logoutIcon}>↩</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.version}>SOS Mobile v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFD' },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  circleBig: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -50,
  },
  circleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: -30,
  },
  avatarRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  userPhone: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Menu
  menuScroll: { flex: 1 },
  menuContent: { paddingVertical: 16, paddingHorizontal: 14 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 6,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  menuItemActive: { backgroundColor: '#FEF2F2' },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconWrapActive: { backgroundColor: Colors.primary },
  menuIcon: { fontSize: 18 },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  menuLabelActive: { color: Colors.primary, fontWeight: '700' },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 14,
    marginHorizontal: 4,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginBottom: 10,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
    color: Colors.primary,
  },
  logoutText: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: '#CCCCCC' },
});
