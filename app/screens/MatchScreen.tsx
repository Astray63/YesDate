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
import { NavigationProps, DateIdea } from '../types';

interface MatchScreenProps extends NavigationProps {
  route: {
    params?: {
      matches?: DateIdea[];
    };
  };
}

export default function MatchScreen({ navigation, route }: MatchScreenProps) {
  const matches = route.params?.matches || [];

  const handlePlanDate = (dateIdea: DateIdea) => {
    // Navigate to planning screen or show planning modal
    console.log('Planning date:', dateIdea.title);
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
        <Text style={styles.headerTitle}>Matchs</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Vos matchs</Text>

        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucun match pour le moment !
            </Text>
            <Text style={styles.emptySubtext}>
              Retournez swiper pour trouver plus de dates
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.navigate('SwipeDate')}
            >
              <Text style={styles.retryButtonText}>Continuer à swiper</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.matchesList}>
            {matches.map((match, index) => (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchContent}>
                  <View style={styles.matchTextContainer}>
                    <Text style={styles.matchLabel}>Match</Text>
                    <Text style={styles.matchTitle}>{match.title}</Text>
                    <Text style={styles.matchDescription}>
                      {match.description.length > 80
                        ? `${match.description.substring(0, 80)}...`
                        : match.description}
                    </Text>
                    <TouchableOpacity
                      style={styles.planButton}
                      onPress={() => handlePlanDate(match)}
                    >
                      <Text style={styles.planButtonText}>Planifier</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.matchImageContainer}>
                    <Image
                      source={{ uri: match.image_url }}
                      style={styles.matchImage}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sample matches for demo */}
        {matches.length === 0 && (
          <View style={styles.matchesList}>
            <View style={styles.matchCard}>
              <View style={styles.matchContent}>
                <View style={styles.matchTextContainer}>
                  <Text style={styles.matchLabel}>Match</Text>
                  <Text style={styles.matchTitle}>Soirée jeux de société</Text>
                  <Text style={styles.matchDescription}>
                    Découvrez de nouveaux jeux de société à deux.
                  </Text>
                  <TouchableOpacity style={styles.planButton}>
                    <Text style={styles.planButtonText}>Planifier</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.matchImageContainer}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoXY-f4WGN1sdChI7-sBZWEsusilK5HOEgLVAmTkwPIfuZHB7rwMhJ32UQbnlyOXby-4AqLkt0tGHdesF31m5L-be4BQ6mZF9qfJAn8XG3hV5YTathzX_tG_JaaNjT5MsZ7SDWuqtyxzxAm6RnPFlgkzS-fO8RAqmmVXQG456aoh8A90jVrVoP1SvEpmIPv4dvjPbxYGnaz0Kl3RlNKGiH0lCpgqbtnaliSiEYlhdp0Mc2s6L6u7v4nn4Lt9K163wfuGHecJNmaOk',
                    }}
                    style={styles.matchImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>

            <View style={styles.matchCard}>
              <View style={styles.matchContent}>
                <View style={styles.matchTextContainer}>
                  <Text style={styles.matchLabel}>Match</Text>
                  <Text style={styles.matchTitle}>Cours de cuisine</Text>
                  <Text style={styles.matchDescription}>
                    Apprenez à cuisiner un nouveau plat ensemble.
                  </Text>
                  <TouchableOpacity style={styles.planButton}>
                    <Text style={styles.planButtonText}>Planifier</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.matchImageContainer}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2jwZA2c7GEjxuI2k6arLDI2uTmyLOEJOs45x8urdXDGZct1VDSplhr4aabykYsM2iuDzuLvGh2BUK52_34RWBIrNmHUdost7Spkc9QwvHDZ9-lKMnUeI3dJkbwrry0YBwfhL51qwimM77hO8VsDrLkR8c3KSCVpx6F1XSmp8heegUJ4tuzr_E5dkmslfBgW5xnwRGW3_AsTIFGVi_gsLNZqrSdzJ8UGFEg4qq4Z2dQA8nLuDC8_eldalaNFWvcAK_4e9AsuWHQGo',
                    }}
                    style={styles.matchImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>

            <View style={styles.matchCard}>
              <View style={styles.matchContent}>
                <View style={styles.matchTextContainer}>
                  <Text style={styles.matchLabel}>Match</Text>
                  <Text style={styles.matchTitle}>Randonnée en montagne</Text>
                  <Text style={styles.matchDescription}>
                    Profitez de la nature et de vues imprenables.
                  </Text>
                  <TouchableOpacity style={styles.planButton}>
                    <Text style={styles.planButtonText}>Planifier</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.matchImageContainer}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrVjawXYkbqoAn8QmrZC_xeU8q4zCRnSBz77JYfNgOzvKgI5mjulo28DsgyELWJ-pD19kds_Tl8WKxSrTt8qAQdR5B4iJz5l76RFPbLUuVd-DWsD2O31C4ykg2dzjWIiAf2NvSXzhmt-qcHDM_VivBzyN1TOd4gEF7MOWCQHrlaf2epJxH5dFF-0LaWm-Q4OnPv_okjG1v3O4Np_81YeILiOKFTZfEoIs6mnRb2zj_DiN5Em5TUnQuZ9JcdT90IOgclvSsQP2IaW0',
                    }}
                    style={styles.matchImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          </View>
        )}
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
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '1A',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
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
  sectionTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginVertical: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  matchesList: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  matchCard: {
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  matchContent: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  matchTextContainer: {
    flex: 2,
    justifyContent: 'space-between',
  },
  matchLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '500' as any,
    marginBottom: theme.spacing.xs,
  },
  matchTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  matchDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  planButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    ...theme.shadows.sm,
  },
  planButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
  },
  matchImageContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  matchImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
});