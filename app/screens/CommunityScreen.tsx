import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

interface CommunityScreenProps extends NavigationProps {}

export default function CommunityScreen({ navigation }: CommunityScreenProps) {
  const mostLovedDates = [
    {
      id: '1',
      title: 'Picnic in the park',
      subtitle: 'Enjoy a relaxing afternoon',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4VF-rzhdp9j_rDkbtFdTFvqBu9tZhvqu-RdDOZGncvd4DcufcS3uQ_KFGKw_WeZptj-dhuSNDMVLmh48mSPHEfoB8RR1DaOgT421bhxBScsiRqLmOGd9-MTehnYMW0fdni7A1tfjP6eyVseyM8HOe0yK37yv_aDIGMmXiW8SkMWIzEujhK6u5CZwyXuw_afkxOTU8zU5u_NZTWtVHTb-XXkTMVQW4JUFpUZkXHKIssVyiLg2-3lFXm-ktLh0QI3q5LzqjPGDH-ms',
    },
    {
      id: '2',
      title: 'Beach bonfire',
      subtitle: 'Cozy up by the fire',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTK7IJVYxCzedNDTvyw12CmvXyX0Ntgj_dJIfJJygK2ilB-j6PKtv437QPsejKD1ecxgkzTIN5DDnlKfWRjX92xcDNIyY-s_01irCGDZOqHTrzVqfqnmlELveVxG02GUqAyJ9Eaafw4Lm2JuTcLI608xoziISqLvfqepQZxwatGi6He9XSdhMeRZVIEMnhcZ3FVLBRDfYx32ftr0Oo9-AKLdO4iL7GtLOSRpHYCYdeAyt_2tj_1Z8mrcQBKoLQ9zRQisHmZMqD7I8',
    },
    {
      id: '3',
      title: 'Concert night',
      subtitle: 'Rock out to your favorite band',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUa47pOj8XcAo2LO7GrmjMHJUf7uk0Ivq93GeGBytAgLM3_lJFucrNLMAA9yCRGdon6qrL4-ol6K91aGdlzp2kaREffppKyCZMAvov1StkUQLYKWKSsARF883U-rvgIdRQbhxJ10cgPds5vUTZwFzXltfPQufTcowJRGkjhO24AiHvBJP3L-xA3UIYmHpK_ENVqyfVmEi3k7S1SKPmjuTd85Wpb2oAN5athfp2ZyVpR2_K-YCVhdn2hDYkoOVSMjNqoclWacgmx_A',
    },
  ];

  const trendingDates = [
    {
      id: '4',
      title: 'Cooking class',
      subtitle: 'Learn to make a new dish',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT1TXkDZkOyYPWSq3zBut5M3q1KLuODK9fGmgbYwydSAWoua53pDEMJ2o_R2_TJs08P7N_QYH3XiKlD_mOaZ2iY0-ddqtLab4SyKLKnS-jdXQPK9ambuY-gsWv6ZZD07c991r78udSqI700HJWL4Pwsxjuvcgs-W7qi3R1McemGRaZwLSWkwwHq97SCzs-xZOEQA5tYInZDvFesETeCM1LsDarug4UEdE-1nTUnD2Q_8xAUY_xIJfbYQVfKdsNBxZzsVmFwZqPq9A',
    },
    {
      id: '5',
      title: 'Game night',
      subtitle: 'Play board games together',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcuPkR0MC-HW1_Sr3SDZzM3Rxvts5bk3g6CROFZ_QpvY1CKGnSyV8mjeTzn95mA2IH93yHEVTaA-Xax-zm4GRse1NFR5z3c64ciI6dnmk2WSgrkYIMNQkxNqMjPsENFR5a7oHAmaNICzilFbR2r6zL0D6Y_X1vXlPTeX04Rg6OOrFrWvRomYkkgYIPNHSutps2zoEwqv39uC_CoXsQgaX5AZi-d_U2bvqYG2JyJPBDlSGt8ETSJrwwWnviCf_mttUWxLrIvoxWD3M',
    },
    {
      id: '6',
      title: 'Art gallery visit',
      subtitle: 'Explore creative masterpieces',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4VF-rzhdp9j_rDkbtFdTFvqBu9tZhvqu-RdDOZGncvd4DcufcS3uQ_KFGKw_WeZptj-dhuSNDMVLmh48mSPHEfoB8RR1DaOgT421bhxBScsiRqLmOGd9-MTehnYMW0fdni7A1tfjP6eyVseyM8HOe0yK37yv_aDIGMmXiW8SkMWIzEujhK6u5CZwyXuw_afkxOTU8zU5u_NZTWtVHTb-XXkTMVQW4JUFpUZkXHKIssVyiLg2-3lFXm-ktLh0QI3q5LzqjPGDH-ms',
    },
  ];

  const renderDateCard = (date: any) => (
    <View key={date.id} style={styles.dateCard}>
      <Image
        source={{ uri: date.image_url }}
        style={styles.dateImage}
        resizeMode="cover"
      />
      <View style={styles.dateInfo}>
        <Text style={styles.dateTitle}>{date.title}</Text>
        <Text style={styles.dateSubtitle}>{date.subtitle}</Text>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Inspiration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Most Loved Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most loved dates</Text>
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
          <Text style={styles.sectionTitle}>Trending dates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            {trendingDates.map(renderDateCard)}
          </ScrollView>
        </View>

        {/* Community Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Community Highlights</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1,247</Text>
              <Text style={styles.statLabel}>Dates Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Active Couples</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4.8★</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
          </View>
        </View>

        {/* Submit Your Date */}
        <View style={styles.submitSection}>
          <Text style={styles.submitTitle}>Share Your Date Idea</Text>
          <Text style={styles.submitDescription}>
            Help other couples by sharing your amazing date experiences!
          </Text>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit Date Idea</Text>
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
    width: CARD_WIDTH,
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
});