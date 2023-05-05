import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import MainTabNavigator from './MainTabNavigator';
import AuthStack from './AuthStack';
import AuthLoadingScreen from './AuthLoadingScreen';
import MaintenanceScreen from './MaintenanceScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLoading" headerMode="none">
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
