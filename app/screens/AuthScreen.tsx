import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';
import { authService } from '../services/supabase';

interface AuthScreenProps extends NavigationProps {}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin && !fullName) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Connexion avec le vrai service Supabase
        await authService.signIn(email, password);
        Alert.alert('Succès', 'Connecté avec succès!');
      } else {
        // Inscription avec le vrai service Supabase
        const { user } = await authService.signUp(email, password, fullName);
        if (user) {
          Alert.alert('Succès', 'Compte créé avec succès! Vérifiez votre email.');
        }
      }
      
      // Navigation vers les rooms après authentification
      navigation.navigate('RoomScreen');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>
                {isLogin ? 'Connexion' : 'Inscription'}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? 'Connectez-vous pour créer votre room à deux'
                  : 'Créez votre compte pour commencer'}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Entrez votre nom complet"
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Entrez votre email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Entrez votre mot de passe"
                secureTextEntry
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? 'Chargement...'
                  : isLogin
                  ? 'Se connecter'
                  : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.secondaryButtonText}>
                {isLogin
                  ? 'Pas de compte ? S\'inscrire'
                  : 'Déjà un compte ? Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.md,
    top: theme.spacing.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '1A',
    borderRadius: 20,
    zIndex: 1,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: theme.fonts.sizes['3xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    backgroundColor: theme.colors.cardLight,
  },
  helpText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.mutedLight,
    marginTop: theme.spacing.xs,
  },
  actions: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500' as any,
  },
  codeButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  codeButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500' as any,
  },
  skipButton: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  skipButtonText: {
    color: theme.colors.mutedLight,
    fontSize: theme.fonts.sizes.xs,
    fontStyle: 'italic',
  },
  sectionContainer: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  separatorText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500' as any,
    color: theme.colors.mutedLight,
  },
  roomOptionContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  roomOptionText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  roomButton: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
  },
  roomButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
});
