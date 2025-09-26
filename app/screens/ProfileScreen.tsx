import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';
import { getAchievements } from '../utils/data';
import { authService } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';

interface ProfileScreenProps extends NavigationProps {}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userDates, setUserDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    totalDates: 0,
    completedDates: 0,
    matches: 0,
    points: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 100
  });

  useEffect(() => {
    loadProfileData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      // Demander les permissions pour la galerie
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('Permission requise', 'Les permissions de la galerie sont nécessaires pour changer votre avatar.');
      }

      // Demander les permissions pour l'appareil photo
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission requise', 'Les permissions de l\'appareil photo sont nécessaires pour prendre des photos.');
      }
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Charger le profil utilisateur
      const currentUser = await authService.getCurrentUserWithProfile();
      if (currentUser) {
        setUserProfile(currentUser.profile);
        setEditingProfile(currentUser.profile);
      }

      // Charger les succès
      const achievementsData = await getAchievements();
      setAchievements(achievementsData);

      // Charger les dates de l'utilisateur
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const userDatesData = await authService.getUserDateTodos(user.id);
          setUserDates(userDatesData || []);

          // Calculer les statistiques
          const completedDates = userDatesData?.filter((date: any) => date.status === 'completed').length || 0;
          const totalDates = userDatesData?.length || 0;

          setUserStats(prev => ({
            ...prev,
            totalDates,
            completedDates,
            points: completedDates * 10 + achievementsData.length * 5,
            experience: completedDates * 10 + achievementsData.length * 5,
            level: Math.floor((completedDates * 10 + achievementsData.length * 5) / 100) + 1,
            nextLevelExp: ((Math.floor((completedDates * 10 + achievementsData.length * 5) / 100) + 1) * 100)
          }));
        }
      } catch (error) {
        console.error('Error loading user dates:', error);
        setUserDates([]);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      Alert.alert(
        'Changer l\'avatar',
        'Comment voulez-vous sélectionner votre photo ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: '📷 Appareil photo',
            onPress: async () => {
              const cameraResult = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!cameraResult.canceled && cameraResult.assets[0]) {
                await updateAvatar(cameraResult.assets[0].uri);
              }
            }
          },
          {
            text: '🖼️ Galerie',
            onPress: async () => {
              const galleryResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!galleryResult.canceled && galleryResult.assets[0]) {
                await updateAvatar(galleryResult.assets[0].uri);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const updateAvatar = async (imageUri: string) => {
    try {
      // Mettre à jour l'avatar localement
      setUserProfile((prev: any) => ({
        ...prev,
        avatar_url: imageUri
      }));

      setEditingProfile((prev: any) => ({
        ...prev,
        avatar_url: imageUri
      }));

      // Sauvegarder automatiquement dans Supabase
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        await authService.updateUserProfile(currentUser.id, {
          avatar_url: imageUri,
        });
        console.log('✅ Avatar mis à jour avec succès');
        Alert.alert('Succès', 'Votre avatar a été mis à jour !');
      }
    } catch (saveError) {
      console.error('Erreur lors de la sauvegarde:', saveError);
      Alert.alert('Info', 'Avatar changé localement. Il sera sauvegardé lors de la prochaine synchronisation.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Sauvegarder les modifications du profil
      if (editingProfile) {
        await authService.updateUserProfile(editingProfile.id, {
          full_name: editingProfile.full_name,
          avatar_url: editingProfile.avatar_url,
        });
        setUserProfile(editingProfile);
      }
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              console.log('✅ Déconnexion réussie, fermeture du modal...');

              // Fermer le modal Profile
              navigation.goBack();

              // Forcer une vérification de l'état d'authentification après un délai
              setTimeout(() => {
                // Déclencher une vérification d'authentification
                // Le AuthNavigator devrait détecter automatiquement le changement
                console.log('🔄 Déclenchement de la vérification d\'authentification...');
              }, 200);

            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        },
      ]
    );
  };

  const handleViewAllDates = () => {
    // Navigation vers l'écran complet des dates (à implémenter)
    console.log('Navigate to UserDatesScreen');
  };

  const handleViewAllAchievements = () => {
    // Navigation vers l'écran complet des succès (à implémenter)
    console.log('Navigate to AchievementsScreen');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Confidentialité', 'Fonctionnalité à implémenter');
  };

  const handleHelpSupport = () => {
    Alert.alert('Aide & Support', 'Questions fréquentes à implémenter');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          Alert.alert('Info', 'La suppression de compte n\'est pas encore disponible');
        }},
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            <Image
              source={{
                uri: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelEmoji}>⭐</Text>
            </View>
            <View style={styles.editAvatarOverlay}>
              <Text style={styles.editAvatarText}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {userProfile?.full_name || 'Utilisateur'}
            </Text>
            <Text style={styles.userEmail}>
              {userProfile?.email || 'email@exemple.com'}
            </Text>
            <Text style={styles.userLevel}>Niveau Débutant</Text>
            <Text style={styles.userDescription}>
              Membre depuis {new Date().getFullYear()}
            </Text>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userDates.length}</Text>
              <Text style={styles.statLabel}>Dates</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{achievements.length}</Text>
              <Text style={styles.statLabel}>Succès</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Matchs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Dates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Dates</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleViewAllDates}
            >
              <Text style={styles.seeAllButtonText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {userDates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>Aucune date pour l'instant</Text>
              <Text style={styles.emptySubtext}>Allez swiper pour trouver des idées de dates !</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('SwipeDate')}
              >
                <Text style={styles.actionButtonText}>Découvrir des dates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.datesList}>
              {userDates.slice(0, 3).map((date) => (
                <View key={date.id} style={styles.dateCard}>
                  <Image
                    source={{ uri: date.date_idea?.image_url || 'https://via.placeholder.com/60' }}
                    style={styles.dateImage}
                    resizeMode="cover"
                  />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateTitle} numberOfLines={1}>
                      {date.date_idea?.title || 'Date sans titre'}
                    </Text>
                    <View style={styles.dateMeta}>
                      <Text style={styles.dateStatus}>
                        {date.status === 'todo' ? 'À faire' :
                         date.status === 'planned' ? 'Planifié' : 'Terminé'}
                      </Text>
                      {date.date_idea?.duration && (
                        <Text style={styles.dateDuration}>⏱️ {date.date_idea.duration}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {userDates.length > 3 && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={handleViewAllDates}
                >
                  <Text style={styles.moreText}>
                    +{userDates.length - 3} autres dates
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Succès</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleViewAllAchievements}
            >
              <Text style={styles.seeAllButtonText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementsList}>
            {achievements.slice(0, 3).map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Image
                  source={{ uri: achievement.image_url }}
                  style={styles.achievementImage}
                  resizeMode="cover"
                />
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${achievement.progress || 0}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}

            {achievements.length > 3 && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={handleViewAllAchievements}
              >
                <Text style={styles.moreText}>
                  +{achievements.length - 3} autres succès
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>Recevoir des notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Profil privé</Text>
                <Text style={styles.settingDescription}>Masquer mon profil aux autres</Text>
              </View>
              <Switch
                value={privateProfile}
                onValueChange={setPrivateProfile}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={privateProfile ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Confidentialité</Text>
                <Text style={styles.settingDescription}>Gérer mes données personnelles</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Aide & Support</Text>
                <Text style={styles.settingDescription}>Questions fréquentes</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>

          <View style={styles.accountActions}>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={handleLogout}
            >
              <Text style={styles.accountButtonText}>Se déconnecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accountButton, styles.deleteButton]}
              onPress={() => Alert.alert('Attention', 'La suppression du compte n\'est pas encore disponible')}
            >
              <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>YesDate v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight + 'CC',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  editIcon: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.backgroundLight,
  },
  editAvatarText: {
    fontSize: 16,
    color: '#ffffff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primary + '33',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.backgroundLight,
  },
  levelEmoji: {
    fontSize: 20,
  },
  profileInfo: {
    alignItems: 'center',
    maxWidth: 280,
  },
  userName: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  userLevel: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  userDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  seeAllButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  seeAllButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '600' as any,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: 80,
    ...theme.shadows.sm,
  },
  statNumber: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '600' as any,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
  },
  datesList: {
    gap: theme.spacing.sm,
  },
  dateCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  dateImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
  },
  dateInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dateTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateStatus: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '600' as any,
    backgroundColor: theme.colors.primary + '1A',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  dateDuration: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.mutedLight,
  },
  achievementsList: {
    gap: theme.spacing.sm,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  achievementImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
  },
  achievementContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  achievementTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  achievementDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.primary + '33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  settingsList: {
    gap: theme.spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
  },
  settingArrow: {
    fontSize: 20,
    color: theme.colors.mutedLight,
  },
  accountActions: {
    gap: theme.spacing.sm,
  },
  accountButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  accountButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
  },
  deleteButton: {
    backgroundColor: '#ff4757',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  moreButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  moreText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '600' as any,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
