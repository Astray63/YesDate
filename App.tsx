import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './app/contexts/AuthContext';
import AuthNavigator from './app/components/AuthNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
