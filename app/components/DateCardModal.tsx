import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { DateIdea } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DateCardModalProps {
  visible: boolean;
  onClose: () => void;
  dateIdea: DateIdea | null;
}

export default function DateCardModal({ visible, onClose, dateIdea }: DateCardModalProps) {
  if (!dateIdea) return null;

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'romantic': '💕',
      'fun': '🎉',
      'relaxed': '😌',
      'adventurous': '🗺️',
      'food': '🍽️',
      'nature': '🌲',
      'culture': '🎭',
      'sport': '⚽',
    };
    return emojiMap[category] || '💝';
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: { [key: string]: string } = {
      'romantic': 'Romantique',
      'fun': 'Amusant',
      'relaxed': 'Détendu',
      'adventurous': 'Aventureux',
      'food': 'Gastronomie',
      'nature': 'Nature',
      'culture': 'Culture',
      'sport': 'Sport',
    };
    return labelMap[category] || category;
  };

  const getCostLabel = (cost: string) => {
    const costMap: { [key: string]: string } = {
      'low': '💰 Économique',
      'moderate': '💵 Modéré',
      'high': '💸 Élevé',
      'luxury': '💎 Luxe',
    };
    return costMap[cost] || cost;
  };

  const getLocationTypeLabel = (locationType: string) => {
    const locationMap: { [key: string]: string } = {
      'indoor': 'Intérieur',
      'outdoor': 'Extérieur',
      'city': 'En ville',
      'countryside': 'Campagne',
    };
    return locationMap[locationType] || locationType;
  };

  const getCategoryGradient = (category: string) => {
    const gradientMap: { [key: string]: string } = {
      'romantic': '#ff6b9d',
      'fun': '#ffd93d',
      'relaxed': '#6bcf7f',
      'adventurous': '#ff8c42',
      'food': '#ff6b6b',
      'nature': '#4ecdc4',
      'culture': '#a8e6cf',
      'sport': '#ff8b94',
    };
    return gradientMap[category] || '#f04299';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de l'idée</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={[styles.heroSection, { backgroundColor: getCategoryGradient(dateIdea.category) + '20' }]}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEmoji}>{getCategoryEmoji(dateIdea.category)}</Text>
              <Text style={styles.heroTitle}>{dateIdea.title}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{getCategoryLabel(dateIdea.category)}</Text>
                </View>
                {dateIdea.generated_by === 'ai' && (
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✨ Généré par IA</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{dateIdea.description}</Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <Text style={styles.detailLabel}>Durée</Text>
                <Text style={styles.detailValue}>{dateIdea.duration}</Text>
              </View>

              {dateIdea.cost && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailIcon}>💰</Text>
                  <Text style={styles.detailLabel}>Budget</Text>
                  <Text style={styles.detailValue}>{getCostLabel(dateIdea.cost)}</Text>
                </View>
              )}

              {dateIdea.location_type && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailLabel}>Type de lieu</Text>
                  <Text style={styles.detailValue}>{getLocationTypeLabel(dateIdea.location_type)}</Text>
                </View>
              )}

              {dateIdea.area && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailIcon}>🗺️</Text>
                  <Text style={styles.detailLabel}>Zone</Text>
                  <Text style={styles.detailValue}>{dateIdea.area}</Text>
                </View>
              )}
            </View>

            {/* Additional Info */}
            {dateIdea.generated_by === 'ai' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personnalisation</Text>
                <Text style={styles.personalizationText}>
                  Cette idée a été générée spécialement pour vous en fonction de vos préférences du quiz.
                </Text>
              </View>
            )}

            {/* Tips Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conseils</Text>
              <View style={styles.tipsList}>
                <View style={styles.tip}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>
                    Vérifiez les horaires d'ouverture avant de vous rendre sur place
                  </Text>
                </View>
                <View style={styles.tip}>
                  <Text style={styles.tipIcon}>📱</Text>
                  <Text style={styles.tipText}>
                    N'hésitez pas à réserver à l'avance si nécessaire
                  </Text>
                </View>
                <View style={styles.tip}>
                  <Text style={styles.tipIcon}>☀️</Text>
                  <Text style={styles.tipText}>
                    Consultez la météo pour planifier au mieux votre sortie
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onClose}>
            <Text style={styles.actionButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.cardLight,
  },
  closeIcon: {
    fontSize: 18,
    color: theme.colors.textLight,
    fontWeight: '600' as any,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: theme.fonts.sizes['3xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  categoryBadgeText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
    color: theme.colors.primary,
  },
  aiBadge: {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  aiBadgeText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
    color: theme.colors.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  detailCard: {
    flex: 1,
    minWidth: (screenWidth - theme.spacing.md * 3) / 2,
    backgroundColor: theme.colors.cardLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '500' as any,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    fontWeight: '600' as any,
    textAlign: 'center',
  },
  personalizationText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tipsList: {
    gap: theme.spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  bottomActions: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
});