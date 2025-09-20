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
  const [invitationCode, setInvitationCode] = useState('');
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
        await authService.signIn(email, password);
        navigation.navigate('Quiz');
      } else {
        const { user } = await authService.signUp(email, password, fullName);
        if (user) {
          // If invitation code provided, join partner
          if (invitationCode) {
            await authService.joinPartner(invitationCode, user.id);
            Alert.alert('Succès', 'Vous êtes maintenant connecté à votre partenaire!');
          }
          navigation.navigate('Quiz');
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const generateAndShowInvitationCode = () => {
    const code = authService.generateInvitationCode();
    Alert.alert(
      'Code d\'invitation',
      `Votre code d'invitation: ${code}\n\nPartagez ce code avec votre partenaire pour qu'il puisse vous rejoindre.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isLogin ? 'Connexion' : 'Inscription'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Reconnectez-vous pour continuer'
                : 'Créez votre compte pour commencer'}
            </Text>
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

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Code d'invitation (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={invitationCode}
                  onChangeText={setInvitationCode}
                  placeholder="Code de votre partenaire"
                  autoCapitalize="characters"
                />
                <Text style={styles.helpText}>
                  Entrez le code de votre partenaire pour vous connecter
                </Text>
              </View>
            )}
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

            {!isLogin && (
              <TouchableOpacity
                style={styles.codeButton}
                onPress={generateAndShowInvitationCode}
              >
                <Text style={styles.codeButtonText}>
                  Générer un code d'invitation
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Skip for demo */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('Quiz')}
          >
            <Text style={styles.skipButtonText}>Continuer sans compte (démo)</Text>
          </TouchableOpacity>
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
});