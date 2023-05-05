import React from 'react';
import { Platform, TouchableHighlight, Text, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import HomeHomeScreen from '../screens/HomeHomeScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import ShareConceptScreen from '../screens/ShareConceptScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import GiveFeedbackScreen from '../screens/GiveFeedbackScreen';
import CreateUserScreen from '../screens/CreateUserScreen';
import UserLoginScreen from '../screens/UserLoginScreen';
import GroupOptionsScreen from '../screens/GroupOptionsScreen';
import UserBioScreen from '../screens/UserBioScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// HomeStack follows a similar pattern as what is provided here: http://facebook.github.io/react-native/docs/navigation
const Stack1 = createStackNavigator();
function HomeStack() {
  return (
    <Stack1.Navigator>
      <Stack1.Screen
        name="HomeHome"
        component={HomeHomeScreen}
        options={({ navigation }) => (HomeHomeScreen.navigationOptions(navigation))}
      />
      <Stack1.Screen
        name="GroupOptions"
        component={GroupOptionsScreen}
        options={{ title: 'Group options' }}
      />
      <Stack1.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create a group' }}
      />
      <Stack1.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ title: 'Join a Group' }}
      />
    </Stack1.Navigator>
  );
}

const Stack2 = createStackNavigator();
function ShareConceptStack() {
  return (
    <Stack2.Navigator>
      <Stack2.Screen
        name="ShareConcept"
        component={ShareConceptScreen}
        options={ShareConceptScreen.navigationOptions}
      />
    </Stack2.Navigator>
  );
}

const Stack3 = createStackNavigator();
function GiveFeedbackStack() {
  return (
    <Stack3.Navigator>
      <Stack3.Screen
        name="GiveFeedback"
        component={GiveFeedbackScreen}
        options={GiveFeedbackScreen.navigationOptions}
      />
    </Stack3.Navigator>
  );
}

const Stack4 = createStackNavigator();
function GroupMembersStack() {
  return (
    <Stack4.Navigator>
      <Stack4.Screen
        name="GroupMembers"
        component={GroupMembersScreen}
        options={({ route }) => (GroupMembersScreen.navigationOptions(route))}
      />
    </Stack4.Navigator>
  );
}

const Stack5 = createStackNavigator();
function UserBioStack() {
  return (
    <Stack5.Navigator>
      <Stack5.Screen
        name="UserBio"
        component={UserBioScreen}
        options={UserBioScreen.navigationOptions}
      />
    </Stack5.Navigator>
  );
}

// const UserBioStack = createStackNavigator({
//   UserBio: UserBioScreen,
// });

// UserBioStack.navigationOptions = {
//   tabBarLabel: 'You',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon
//       focused={focused}
//       name={Platform.OS === 'ios' ? 'person-circle-outline' : 'person-outline'}
//     />
//   ),
// };

const Tab = createBottomTabNavigator();
export default function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="First" 
        component={HomeStack} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
          <TabBarIcon
            focused={focused}
            name={
              Platform.OS === 'ios'
                ? `ios-information-circle${focused ? '' : '-outline'}`
                : 'md-information-circle'}
          />
          )}}
        listeners={({navigation}) => ({
            tabPress: async e => {
              e.preventDefault();
              navigation.navigate('First', { screen: 'HomeHome' });
            },
          })}/>

      <Tab.Screen 
        name="Second" 
        component={ShareConceptStack} 
        options={{
          tabBarLabel: 'Share',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
                focused={focused}
                name={Platform.OS === 'ios' ? 'ios-images' : 'md-images'}
            />
          )
        }}
        listeners={({navigation}) => ({
          tabPress: async e => {
            e.preventDefault();
            let values = await AsyncStorage.multiGet(['groupName']);
            if (values[0][1] == null) {
              await Alert.alert("You have not entered a group!", "You must specify which group you'd like to share to. Please Enter, Join or Create a group.");
              navigation.navigate('First', { screen: 'HomeHome' });
            } else {
              navigation.navigate('Second');
            }
          },
        })}/>

      <Tab.Screen 
        name="Third" 
        component={GiveFeedbackStack} 
        options={{
          tabBarLabel: 'Feedback',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              name={Platform.OS === 'ios' ? 'ios-heart' : 'md-heart'}
            />
          )
        }}
        listeners={({navigation}) => ({
          tabPress: async e => {
            e.preventDefault();
            let values = await AsyncStorage.multiGet(['groupName']);
            if (values[0][1] == null) {
              await Alert.alert("You are not in a group!", "Please join or create one first.");
              navigation.navigate('First', { screen: 'HomeHome' });
            } else {
              navigation.navigate('Third');
            }
          }
        })}/>

      <Tab.Screen 
        name="Fourth" 
        component={GroupMembersStack}
        options={{
          tabBarLabel: 'Group',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'}
            />
          )}} 
        listeners={({navigation}) => ({
          tabPress: async e => {
            e.preventDefault();
            let values = await AsyncStorage.multiGet(['groupName']);
            if (values[0][1] == null) {
              await Alert.alert("You are not in a group! Please join or create one first to view group members.");
              navigation.navigate('First', { screen: 'HomeHome' });
            } else {
              navigation.navigate('Fourth');
            }
          }
        })}/>

      <Tab.Screen 
        name="Fifth" 
        component={UserBioStack} 
        options={{
          tabBarLabel: 'You',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              name={Platform.OS === 'ios' ? 'person-circle-outline' : 'person-outline'}
            />
          )
        }}/>
    </Tab.Navigator>
  );
}
