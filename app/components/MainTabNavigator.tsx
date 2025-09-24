import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Heart, Lightbulb, Trophy, Search } from 'lucide-react-native';

// Screens
import SwipeDateScreen from '../screens/SwipeDateScreen';
import MatchScreen from '../screens/MatchScreen';
import CommunityScreen from '../screens/CommunityScreen';
import GamificationScreen from '../screens/GamificationScreen';

import { theme } from '../utils/theme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator initialRouteName="SwipeDate"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundLight,
          borderTopColor: theme.colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          marginBottom: 30,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="SwipeDate"
        component={SwipeDateScreen}
        options={{
          tabBarLabel: 'Dates',
          tabBarIcon: ({ color, focused }) => (
            <Search 
              size={focused ? 22 : 18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Match"
        component={MatchScreen}
        options={{
          tabBarLabel: 'Matchs',
          tabBarIcon: ({ color, focused }) => (
            <Heart 
              size={focused ? 22 : 18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Inspiration',
          tabBarIcon: ({ color, focused }) => (
            <Lightbulb 
              size={focused ? 22 : 18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={GamificationScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Trophy 
              size={focused ? 22 : 18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
