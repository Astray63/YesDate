import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';
import { authService } from '../services/supabase';

interface RoomScreenProps extends NavigationProps {}

export default function RoomScreen({ navigation }: RoomScreenProps) {
  const [userFixedCode, setUserFixedCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Get user profile with fixed room code
    const loadUserProfile = async () => {
      try {
        const userProfile = await authService.getCurrentUserWithProfile();
        if (userProfile) {
          setUserProfile(userProfile.profile);
          setUserFixedCode(userProfile.profile.fixed_room_code);
        }
      } catch (error: any) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  const createRoom = async () => {
    if (!userProfile) {
      Alert.alert('Erreur', 'Profil utilisateur non chargé');
      return;
    }

    setLoading(true);
    try {
      // Create room using user's fixed code
      const room = await authService.createRoom(userProfile.id);
      
      Alert.alert(
        'Succès',
        `Room créée avec votre code fixe: ${userFixedCode}\n\nPartagez ce code avec votre partenaire!`,
        [{ text: 'OK' }]
      );
      
      // Navigate to quiz with room info
      navigation.navigate('Quiz', { 
        roomId: room.id, 
        roomCode: room.room_code, 
        isRoomCreator: true 
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!joinCode) {
      Alert.alert('Erreur', 'Veuillez entrer un code de room');
      return;
    }

    if (!userProfile) {
      Alert.alert('Erreur', 'Profil utilisateur non chargé');
      return;
    }

    setLoading(true);
    try {
      // Join room using the service
      const room = await authService.joinRoom(joinCode, userProfile.id);
      
      Alert.alert('Succès', 'Vous avez rejoint la room!');
      
      // Navigate to quiz with room info
      navigation.navigate('Quiz', { 
        roomId: room.id, 
        roomCode: room.room_code, 
        isRoomMember: true 
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de rejoindre la room');
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
              <Text style={styles.title}>Room à Deux</Text>
              <Text style={styles.subtitle}>
                Créez une room ou rejoignez votre partenaire pour commencer l'aventure
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Section Créer Room */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Votre Code Fixe</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Code de Room Personnel</Text>
                <TextInput
                  style={styles.input}
                  value={userFixedCode}
                  placeholder="Chargement..."
                  editable={false}
                />
              </View>
              <Text style={styles.helpText}>
                Ce code est unique et permanent. Partagez-le avec votre partenaire pour qu'il puisse vous rejoindre.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, (!userFixedCode || loading) && styles.disabledButton]}
                onPress={createRoom}
                disabled={!userFixedCode || loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Création...' : 'Créer la Room'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OU</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Section Rejoindre Room */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Rejoindre une Room</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Code de Room</Text>
                <TextInput
                  style={styles.input}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="Entrez le code de votre partenaire"
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, (!joinCode || loading) && styles.disabledButton]}
                onPress={joinRoom}
                disabled={!joinCode || loading}
              >
                <Text style={styles.primaryButtonText}>
                  Rejoindre la Room
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* No back button - flux linéaire obligatoire */}
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
  authButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  authButtonText: {
    color: theme.colors.mutedLight,
    fontSize: theme.fonts.sizes.sm,
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
