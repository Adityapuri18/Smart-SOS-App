import React, { useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DrawerNavigator from './DrawerNavigator';
import SOSAlertScreen from '../screens/SOSAlertScreen';
import HelpSentScreen from '../screens/HelpSentScreen';
import MapAlertScreen from '../screens/MapAlertScreen';
import AddContactScreen from '../screens/AddContactScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();
const linking = {
  prefixes: ['sosapp://'],
  config: {
    screens: {
      Main: 'home',
      SOSAlert: 'sos',
    },
  },
};

export default function AppNavigator() {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    console.log('[AppNavigator] useEffect running, isSignedIn:', isSignedIn, 'isLoading:', isLoading);
  }, [isSignedIn, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isSignedIn ? (
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen
              name="SOSAlert"
              component={SOSAlertScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="HelpSent"
              component={HelpSentScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="MapAlert"
              component={MapAlertScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="AddContact"
              component={AddContactScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
