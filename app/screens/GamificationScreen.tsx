import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';
import { getAchievements } from '../utils/data';
import { authService } from '../services/supabase';

interface GamificationScreenProps extends NavigationProps {}

export default function GamificationScreen({ navigation }: GamificationScreenProps) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userDates, setUserDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      
      // Charger les succès
      const achievementsData = await getAchievements();
      setAchievements(achievementsData);
      
      // Pour l'instant, les défis sont vides car ils viendront de la base de données
      setChallenges([]);
      
      // Charger les dates de l'utilisateur
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const userDatesData = await authService.getUserDateTodos(currentUser.id);
          setUserDates(userDatesData || []);
        }
      } catch (error) {
        console.error('Error loading user dates:', error);
        setUserDates([]);
      }
      
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateChallenge = (challengeId: string) => {
    console.log('Activating challenge:', challengeId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Badges</Text>
          <View style={styles.placeholder} />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badges</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYgiks-TAJZUB8_PCQ1S7yLVH19yo9M6r1SA92kH5mZzhZ4rfTfssIK-Ne6RyvxREmFTyCI0_MuDMRX6as-ct2J0RgWeHwvT5_B52WMoI4kze5fK3RPyYfFwkfPq2BM6qHi7_othsNBp2klO-3CcgiY_7MWQ_0bEgsUHIm9KW5w2LmeSz2Hp0Pxd55e5aqtrZmHLiTaoK8VXou44Y1bSQDxAM6d9g_skK5lNl9jN7UKKr3WYnYdZtHHQ7PXLVWS7Gu8b0p3jTgvuc',
              }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.trophyBadge}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userLevel}>Niveau Débutant</Text>
            <Text style={styles.userDescription}>Commencez votre parcours de couple et débloquez des succès !</Text>
          </View>
        </View>

        {/* Dates à faire Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dates à faire</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => {
                // Navigation vers l'écran complet des dates (à implémenter)
                console.log('Navigate to UserDatesScreen');
              }}
            >
              <Text style={styles.seeAllButtonText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {userDates.length === 0 ? (
            <View style={styles.emptyDatesContainer}>
              <Text style={styles.emptyDatesEmoji}>📅</Text>
              <Text style={styles.emptyDatesText}>Aucune date à faire</Text>
              <Text style={styles.emptyDatesSubtext}>Allez swiper pour trouver des idées de dates !</Text>
              <TouchableOpacity
                style={styles.swipeDatesButton}
                onPress={() => navigation.navigate('SwipeDate')}
              >
                <Text style={styles.swipeDatesButtonText}>Découvrir des dates</Text>
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
                  style={styles.moreDatesButton}
                  onPress={() => {
                    console.log('Navigate to UserDatesScreen');
                  }}
                >
                  <Text style={styles.moreDatesText}>
                    +{userDates.length - 3} autres dates
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Succès</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Image
                  source={{ uri: achievement.image_url }}
                  style={styles.achievementImage}
                  resizeMode="cover"
                />
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis</Text>
          <View style={styles.challengesList}>
            {challenges.map((challenge) => (
              <View key={challenge.id} style={styles.challengeCard}>
                <Image
                  source={{ uri: challenge.image_url }}
                  style={styles.challengeImage}
                  resizeMode="cover"
                />
                <View style={styles.challengeContent}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() => handleActivateChallenge(challenge.id)}
                  >
                    <Text style={styles.activateButtonText}>Activer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.mutedLight,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
  },
  placeholder: {
    width: 40,
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
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  trophyBadge: {
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
  trophyEmoji: {
    fontSize: 20,
  },
  profileInfo: {
    alignItems: 'center',
    maxWidth: 280,
  },
  userLevel: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  userDescription: {
    fontSize: theme.fonts.sizes.md,
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
  achievementsList: {
    gap: theme.spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  achievementImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
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
    height: 8,
    backgroundColor: theme.colors.primary + '33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  challengesList: {
    gap: theme.spacing.md,
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  challengeImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  challengeContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  challengeTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  challengeDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    marginBottom: theme.spacing.sm,
  },
  activateButton: {
    backgroundColor: theme.colors.primary + '33',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  activateButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour la section Dates à faire
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
  emptyDatesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
  },
  emptyDatesEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  emptyDatesText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptyDatesSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  swipeDatesButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  swipeDatesButtonText: {
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
  moreDatesButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  moreDatesText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '600' as any,
  },
});
