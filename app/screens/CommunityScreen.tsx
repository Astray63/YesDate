import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';
import { getCommunityDates, getCommunityStats } from '../utils/data';


interface CommunityScreenProps extends NavigationProps {}

export default function CommunityScreen({ navigation }: CommunityScreenProps) {
  const [mostLovedDates, setMostLovedDates] = useState<any[]>([]);
  const [trendingDates, setTrendingDates] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Responsive measurements (recompute on rotation/resize)
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = Math.max(260, Math.min(width * 0.8, 420));
  const canGoBack = navigation.canGoBack();

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      // Charger les dates préférées
      const mostLoved = await getCommunityDates('most_loved');
      setMostLovedDates(mostLoved);
      
      // Charger les dates tendances
      const trending = await getCommunityDates('trending');
      setTrendingDates(trending);
      
      // Charger les statistiques de la communauté
      const stats = await getCommunityStats();
      setCommunityStats(stats);
      
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDateCard = (date: any) => (
    <View key={date.id} style={[styles.dateCard, { width: cardWidth }]}>
      <Image
        source={{ uri: date.image_url }}
        style={[styles.dateImage, { aspectRatio: isTablet ? 16 / 9 : 3 / 4 }]}
        resizeMode="cover"
      />
      <View style={styles.dateInfo}>
        <Text style={styles.dateTitle}>{date.title}</Text>
        <Text style={styles.dateSubtitle}>{date.subtitle}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          <Text style={styles.headerTitle}>Inspiration</Text>
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
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>Inspiration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Most Loved Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous préférés</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            {mostLovedDates.map(renderDateCard)}
          </ScrollView>
        </View>

        {/* Trending Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous tendances</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            {trendingDates.map(renderDateCard)}
          </ScrollView>
        </View>

        {/* Community Stats */}
        {communityStats && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Points forts de la communauté</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{communityStats.total_dates?.toLocaleString() || '0'}</Text>
                <Text style={styles.statLabel}>Rendez-vous terminés</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{communityStats.success_rate ? `${Math.round(communityStats.success_rate)}%` : '0%'}</Text>
                <Text style={styles.statLabel}>Taux de réussite</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{communityStats.active_couples?.toLocaleString() || '0'}</Text>
                <Text style={styles.statLabel}>Couples actifs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{communityStats.average_rating ? `${communityStats.average_rating}★` : '0★'}</Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>
            </View>
          </View>
        )}

        {/* Submit Your Date */}
        <View style={styles.submitSection}>
          <Text style={styles.submitTitle}>Partagez votre idée de rendez-vous</Text>
          <Text style={styles.submitDescription}>
            Aidez d'autres couples en partageant vos expériences de rendez-vous incroyables !
          </Text>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Soumettre une idée de rendez-vous</Text>
          </TouchableOpacity>
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
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.textLight,
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
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  horizontalScrollContainer: {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    gap: theme.spacing.md,
  },
  dateCard: {
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  dateImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  dateInfo: {
    padding: theme.spacing.md,
  },
  dateTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  dateSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
  },
  statsSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statsTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  submitSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  submitTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  submitDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
