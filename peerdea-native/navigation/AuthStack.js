import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import CreateUserScreen from '../screens/CreateUserScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import UserLoginScreen from '../screens/UserLoginScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Onboarding' }} />
      <Stack.Screen name="CreateUser" component={CreateUserScreen} options={{ title: 'Sign up' }} />
      <Stack.Screen name="UserLogin" component={UserLoginScreen} options={{ title: 'User login' }} />
    </Stack.Navigator>
  )
}