import React, { useEffect, useState, useRef } from 'react';
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
import ProfileScreen from '../screens/ProfileScreen';

import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { user, loading } = useAuth();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [waitForAuthPopup, setWaitForAuthPopup] = useState(false);
  const [authCheckTrigger, setAuthCheckTrigger] = useState(0);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!loading) {
        if (user) {
          console.log('🔍 AuthNavigator: Utilisateur connecté, redirection vers le choix de mode...');

          // Vérifier si on doit attendre la popup de connexion
          if (global.currentRoomId === 'auth_popup_pending') {
            console.log('⏳ AuthNavigator: En attente de la popup de connexion...');
            setWaitForAuthPopup(true);
            return;
          }

          // Attendre que le navigateur soit prêt avant de naviguer
          const navigateToModeChoice = () => {
            if (navigationRef.current) {
              console.log('🎯 AuthNavigator: Navigation vers ModeChoice');
              navigationRef.current.navigate('ModeChoice');
            } else {
              // Si le navigateur n'est pas encore prêt, réessayer dans 100ms
              setTimeout(navigateToModeChoice, 100);
            }
          };

          setInitialRoute('Welcome'); // Commencer par Welcome
          global.currentRoomId = null; // Pas de room automatique

          // Naviguer vers ModeChoice après un court délai
          setTimeout(navigateToModeChoice, 200);
        } else {
          // Utilisateur non connecté, rediriger vers l'accueil
          console.log('🔍 AuthNavigator: Utilisateur non connecté, redirection vers Welcome');
          setInitialRoute('Welcome');
          global.currentRoomId = null;

          // Forcer la navigation vers Welcome si le navigateur est prêt
          if (navigationRef.current) {
            navigationRef.current.navigate('Welcome');
          }
        }
      }
    };

    checkUserStatus();
  }, [user, loading, authCheckTrigger]);

  // Vérification périodique de l'état d'authentification pour détecter les déconnexions
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser && user) {
          console.log('🔄 AuthNavigator: Déconnexion détectée, mise à jour de l\'état...');
          // Forcer la mise à jour de l'état d'authentification
          setAuthCheckTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.log('🔄 AuthNavigator: Erreur lors de la vérification d\'authentification:', error);
      }
    };

    // Vérifier l'état d'authentification toutes les 2 secondes
    const interval = setInterval(checkAuthStatus, 2000);

    return () => clearInterval(interval);
  }, [user]);

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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.backgroundLight },
        }}
      >
        {/* Écrans pour utilisateurs non connectés */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />

        {/* Écrans pour utilisateurs connectés */}
        <Stack.Screen name="ModeChoice" component={ModeChoiceScreen} />
        <Stack.Screen name="CityInput" component={CityInputScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="SwipeDate" component={SwipeDateScreen} />
        <Stack.Screen name="Match" component={MatchScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="Room" component={RoomScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
