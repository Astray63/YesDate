import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/supabase';
import { theme } from '../utils/theme';

// Déclarer la variable globale pour stocker le roomId
declare global {
  var currentRoomId: string | null;
}

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import ModeChoiceScreen from '../screens/ModeChoiceScreen';
import RoomScreen from '../screens/RoomScreen';
import CityInputScreen from '../screens/CityInputScreen';
import QuizScreen from '../screens/QuizScreen';
import SwipeDateScreen from '../screens/SwipeDateScreen';
import MatchScreen from '../screens/MatchScreen';
import GamificationScreen from '../screens/GamificationScreen';
import CommunityScreen from '../screens/CommunityScreen';

import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { user, loading } = useAuth();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [waitForAuthPopup, setWaitForAuthPopup] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!loading && user) {
        console.log('🔍 AuthNavigator: Utilisateur connecté, redirection vers le choix de mode...');

        // Vérifier si on doit attendre la popup de connexion
        if (global.currentRoomId === 'auth_popup_pending') {
          console.log('⏳ AuthNavigator: En attente de la popup de connexion...');
          setWaitForAuthPopup(true);
          return;
        }

        // Rediriger directement vers le choix de mode (solo/couple)
        setInitialRoute('ModeChoice');
        global.currentRoomId = null; // Pas de room automatique
      } else if (!loading && !user) {
        // Utilisateur non connecté, rediriger vers l'accueil
        setInitialRoute('Welcome');
        global.currentRoomId = null;
      }
    };

    checkUserStatus();
  }, [user, loading]);

  if (loading || checkingRoom || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.backgroundLight }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Si on attend la popup de connexion, ne pas rediriger
  if (waitForAuthPopup) {
    console.log('🎯 AuthNavigator: Maintien sur l\'écran actuel pour la popup de connexion');
    return null; // Laisser l'écran actuel (AuthScreen) visible
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.backgroundLight },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="ModeChoice" component={ModeChoiceScreen} />
            <Stack.Screen name="CityInput" component={CityInputScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="SwipeDate" component={SwipeDateScreen} />
            <Stack.Screen name="Match" component={MatchScreen} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="Gamification"
              component={GamificationScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Community"
              component={CommunityScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="RoomScreen" component={RoomScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
