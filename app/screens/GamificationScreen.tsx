import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';
import { achievements } from '../utils/data';

interface GamificationScreenProps extends NavigationProps {}

export default function GamificationScreen({ navigation }: GamificationScreenProps) {
  const userLevel = 'Couple 80% foodie 🍣';
  const userDescription = "Vous êtes une paire née au paradis culinaire ! Continuez à explorer de nouvelles saveurs ensemble.";

  const challenges = [
    {
      id: '1',
      title: 'Organiser un rendez-vous surprise',
      description: 'Rendez-vous romantique',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwM5qI5FLlitbNKN4X6vB2qEhzLJ5cYHC5hjW8qtREH-5sDtmOvZ2rqAZ5avdBbuUU00u5dnMmsOXcQrlbjh8Isv4S95R9I3tD-DUle8DtzkoeOaHXDoAcopq_wubLPY9hfbVkk1SvLWkEqkrIhPkOY3c-slWtT9UTCLINDCu6Dtkoj_lOjovpvmsN-MrzzpsHMfzu18L8zzoAaKN81QNgulv-DUGgg8RHR6bfjKFm2N8llrI43TUDaoNz_dzi755fguL8eJzfmC0',
      is_active: false,
    },
    {
      id: '2',
      title: 'Avoir une conversation profonde',
      description: 'Renforcement de la communication',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCB8o2lYDzZi1nxKz8YOy_hTbs5gBL_woZmnohUD3ps7Gt7TeDM-q_y1VWk66kmtuVE_TyNoZsaoA1_vV6s2oWQxgTZZdrcL1oT3qcT3arGdy5ULaj1ny7LBaG6OWtGPaf8EUbFSxWtBP40Mp1s1g2vPvszwDpcW7gc-UvwTwoOiV4Yk9BJcC7dMEhJ9z-DeFxMaBjBcyIZhlGYkZFXYmzQgRamsG-PKP7Xu39DyO_W_1pXkUdUckpBt1Q-5gNMNjwiJumwpPCf83w',
      is_active: false,
    },
  ];

  const handleActivateChallenge = (challengeId: string) => {
    console.log('Activating challenge:', challengeId);
  };

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
            <Text style={styles.userLevel}>{userLevel}</Text>
            <Text style={styles.userDescription}>{userDescription}</Text>
          </View>
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
});
