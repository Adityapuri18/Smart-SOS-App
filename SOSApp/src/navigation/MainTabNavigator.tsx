import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { MainTabParamList } from '../types/navigation';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = {
  symbol: string;
  label: string;
  focused: boolean;
};

function TabIcon({ symbol, label, focused }: TabIconProps) {
  return (
    <View style={tabStyles.wrapper}>
      <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxActive]}>
        <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
          {symbol}
        </Text>
      </View>
      <Text 
        style={[tabStyles.label, focused && tabStyles.labelFocused]} 
        numberOfLines={1} 
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', paddingTop: 6, minWidth: 70 },
  iconBox: {
    width: 42,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  iconBoxActive: { backgroundColor: '#FFECEC' },
  icon: { fontSize: 18, color: Colors.tabInactive },
  iconFocused: { color: Colors.tabActive },
  label: { fontSize: 10, color: Colors.tabInactive, fontWeight: '500', textAlign: 'center' },
  labelFocused: { color: Colors.tabActive, fontWeight: '700' },
});

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0), // Responsive height
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="📞" label="Contacts" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="🕐" label="History" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
