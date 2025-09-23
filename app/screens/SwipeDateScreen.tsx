import React, { useState, useRef, useEffect, JSX } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { getPersonalizedDateIdeas } from '../utils/data';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { theme } from '../utils/theme';
import { NavigationProps, DateIdea } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.7;
const SWIPE_THRESHOLD = screenWidth * 0.3;

interface SwipeDateScreenProps extends NavigationProps {
  route: {
    params?: {
      quizAnswers?: { [key: string]: string };
      roomId?: string;
      city?: string;
    };
  };
}

export default function SwipeDateScreen({ navigation, route }: SwipeDateScreenProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipedCards, setSwipedCards] = useState<{ [key: string]: 'left' | 'right' }>({});
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Animation values for next card preview
  const nextCardTranslateX = useRef(new Animated.Value(0)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.7)).current;

  const currentCard = dates[currentCardIndex];
  const nextCard = dates[currentCardIndex + 1];
  const isLastCard = currentCardIndex >= dates.length - 1;

  useEffect(() => {
    loadDateIdeas();
  }, []);

  const loadDateIdeas = async () => {
    try {
      setLoading(true);
      const quizAnswers = route.params?.quizAnswers || {};
      const userCity = route.params?.city;
      console.log('Quiz answers:', quizAnswers);
      console.log('User city from params:', userCity);
      const dateIdeas = await getPersonalizedDateIdeas(quizAnswers, userCity);
      setDates(dateIdeas);
    } catch (error) {
      console.error('Error loading date ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCard = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      // Reset next card preview animations
      Animated.spring(nextCardTranslateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(nextCardScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(nextCardOpacity, { toValue: 0.7, useNativeDriver: true }),
    ]).start();
  };

  const swipeCard = (direction: 'left' | 'right') => {
    const toValue = direction === 'right' ? screenWidth : -screenWidth;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: direction === 'right' ? 1 : -1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSwipedCards(prev => ({
        ...prev,
        [currentCard.id]: direction,
      }));
      
      if (isLastCard) {
        // Navigate to matches screen with results and roomId
        const matches = Object.entries(swipedCards)
          .filter(([_, direction]) => direction === 'right')
          .map(([cardId]) => dates.find(date => date.id === cardId))
          .filter(Boolean);
        
        const roomId = route.params?.roomId;
        navigation.navigate('Match', { matches, roomId });
      } else {
        setCurrentCardIndex(prev => prev + 1);
        translateX.setValue(0);
        translateY.setValue(0);
        rotate.setValue(0);
        scale.setValue(1);

        // Reset next card preview animations
        nextCardTranslateX.setValue(0);
        nextCardScale.setValue(0.95);
        nextCardOpacity.setValue(0.7);
      }
    });
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;

    translateX.setValue(translationX);
    translateY.setValue(translationY);

    // Rotation based on horizontal movement
    const rotateValue = translationX / screenWidth;
    rotate.setValue(rotateValue);

    // Scale based on movement
    const scaleValue = 1 - Math.abs(translationX) / screenWidth * 0.1;
    scale.setValue(Math.max(scaleValue, 0.9));

    // Next card preview animations based on swipe movement
    if (nextCard) {
      const previewProgress = Math.abs(translationX) / screenWidth;
      const previewOpacity = 0.7 + (previewProgress * 0.3); // 0.7 to 1.0
      const previewScale = 0.95 + (previewProgress * 0.05); // 0.95 to 1.0

      nextCardOpacity.setValue(Math.min(previewOpacity, 1));
      nextCardScale.setValue(Math.min(previewScale, 1));

      // Subtle movement of next card based on swipe direction
      const nextCardMovement = translationX * 0.1; // 10% of main card movement
      nextCardTranslateX.setValue(nextCardMovement);
    }
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 1000) {
        swipeCard(translationX > 0 ? 'right' : 'left');
      } else {
        resetCard();
      }
    }
  };

  const handleButtonPress = (direction: 'left' | 'right') => {
    swipeCard(direction);
  };

  // Helper functions for enhanced UI
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
      'low': '💰 Éco',
      'moderate': '💵 Modéré',
      'high': '💸 Élevé',
      'luxury': '💎 Luxe',
    };
    return costMap[cost] || cost;
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

  const getCategoryPattern = (category: string) => {
    // Return decorative elements based on category
    const patterns: { [key: string]: JSX.Element } = {
      'romantic': <Text style={styles.patternText}>💕 💝 💖</Text>,
      'fun': <Text style={styles.patternText}>🎉 🎊 🎈</Text>,
      'relaxed': <Text style={styles.patternText}>🌸 🌺 🌻</Text>,
      'adventurous': <Text style={styles.patternText}>🗺️ ⛰️ 🌅</Text>,
      'food': <Text style={styles.patternText}>🍽️ 🥂 🍰</Text>,
      'nature': <Text style={styles.patternText}>🌲 🌿 🍃</Text>,
      'culture': <Text style={styles.patternText}>🎭 🎨 🎪</Text>,
      'sport': <Text style={styles.patternText}>⚽ 🏃‍♀️ 🏆</Text>,
    };
    return patterns[category] || <Text style={styles.patternText}>💝 ✨ 💕</Text>;
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

  // Composant visuel sans image
  const DateVisual = ({ card, style }: { card: DateIdea; style: any }) => {
    return (
      <View style={[style, { position: 'relative', backgroundColor: getCategoryGradient(card.category) + '20' }]}>
        {/* Motifs décoratifs */}
        <View style={styles.imageOverlay}>
          {getCategoryPattern(card.category)}
        </View>
        {/* Icône centrale de la catégorie */}
        <View style={styles.centralIconContainer}>
          <Text style={styles.centralIcon}>{getCategoryEmoji(card.category)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Plus de dates disponibles !</Text>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={() => navigation.navigate('Quiz')}
          >
            <Text style={styles.restartButtonText}>Recommencer le quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Idées de Date</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Next card preview */}
        {nextCard && (
          <Animated.View
            style={[
              styles.card,
              styles.backgroundCard,
              {
                transform: [
                  { translateX: nextCardTranslateX },
                  { scale: nextCardScale },
                ],
                opacity: nextCardOpacity,
              },
            ]}
          >
            {/* Modern Card Design for Preview */}
            <View style={styles.cardInner}>
              {/* Visual Section */}
              <DateVisual card={nextCard} style={styles.imageSection} />

              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryEmoji}>{getCategoryEmoji(nextCard.category)}</Text>
                  <Text style={styles.categoryName}>{getCategoryLabel(nextCard.category)}</Text>
                </View>
                {nextCard.cost && (
                  <View style={styles.costBadge}>
                    <Text style={styles.costText}>{getCostLabel(nextCard.cost)}</Text>
                  </View>
                )}
              </View>

              {/* Main Content Area */}
              <View style={styles.mainContent}>
                {/* Icon and Title */}
                <View style={styles.iconTitleSection}>
                  <View style={[styles.iconCircle, { backgroundColor: getCategoryGradient(nextCard.category) + '20' }]}>
                    <Text style={styles.mainIcon}>{getCategoryEmoji(nextCard.category)}</Text>
                  </View>
                  <View style={styles.titleArea}>
                    <Text style={styles.cardTitle}>{nextCard.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.durationText}>⏱️ {nextCard.duration}</Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.description}>{nextCard.description}</Text>

                {/* Details Section */}
                <View style={styles.detailsSection}>
                  {nextCard.area && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>{nextCard.area}</Text>
                    </View>
                  )}

                  <View style={styles.tagsRow}>
                    {nextCard.location_type && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{getLocationTypeLabel(nextCard.location_type)}</Text>
                      </View>
                    )}
                    {nextCard.generated_by === 'ai' && (
                      <View style={styles.aiTag}>
                        <Text style={styles.aiTagText}>✨ IA</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Main card */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: rotateInterpolate },
                  { scale },
                ],
              },
            ]}
          >
            {/* Modern Card Design */}
            <View style={styles.cardInner}>
              {/* Visual Section */}
              <DateVisual card={currentCard} style={styles.imageSection} />

              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryEmoji}>{getCategoryEmoji(currentCard.category)}</Text>
                  <Text style={styles.categoryName}>{getCategoryLabel(currentCard.category)}</Text>
                </View>
                {currentCard.cost && (
                  <View style={styles.costBadge}>
                    <Text style={styles.costText}>{getCostLabel(currentCard.cost)}</Text>
                  </View>
                )}
              </View>

              {/* Main Content Area */}
              <View style={styles.mainContent}>
                {/* Icon and Title */}
                <View style={styles.iconTitleSection}>
                  <View style={[styles.iconCircle, { backgroundColor: getCategoryGradient(currentCard.category) + '20' }]}>
                    <Text style={styles.mainIcon}>{getCategoryEmoji(currentCard.category)}</Text>
                  </View>
                  <View style={styles.titleArea}>
                    <Text style={styles.cardTitle}>{currentCard.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.durationText}>⏱️ {currentCard.duration}</Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.description}>{currentCard.description}</Text>

                {/* Details Section */}
                <View style={styles.detailsSection}>
                  {currentCard.area && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>{currentCard.area}</Text>
                    </View>
                  )}
                  
                  <View style={styles.tagsRow}>
                    {currentCard.location_type && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{getLocationTypeLabel(currentCard.location_type)}</Text>
                      </View>
                    )}
                    {currentCard.generated_by === 'ai' && (
                      <View style={styles.aiTag}>
                        <Text style={styles.aiTagText}>✨ IA</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleButtonPress('left')}
        >
          <Text style={styles.rejectIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleButtonPress('right')}
        >
          <Text style={styles.likeIcon}>♥</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 60,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    flex: 1,
    textAlign: 'center',
    marginRight: theme.spacing.md,
    marginBottom: 4,
  },
  filterButton: {
    padding: theme.spacing.sm,
  },
  filterIcon: {
    fontSize: 24,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.lg,
    position: 'absolute',
    ...theme.shadows.lg,
    overflow: 'hidden',
  },
  backgroundCard: {
    backgroundColor: theme.colors.backgroundLight + '80',
    transform: [{ scale: 0.95 }, { translateY: -16 }],
  },
  cardTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
  },
  cardDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  cardDuration: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '500' as any,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: 100,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  rejectButton: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeButton: {
    backgroundColor: theme.colors.primary,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  superLikeButton: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  rejectIcon: {
    fontSize: 28,
    color: '#ff4458',
  },
  likeIcon: {
    fontSize: 28,
    color: '#ffffff',
  },
  superLikeIcon: {
    fontSize: 24,
    color: '#ffc107',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  restartButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
  },
  restartButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced card styles
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardLight,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  categoryText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
    color: theme.colors.primary,
  },
  costBadge: {
    backgroundColor: theme.colors.mutedLight + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.mutedLight + '40',
  },
  costText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
    color: theme.colors.mutedLight,
  },
  visualSection: {
    flex: 3,
    position: 'relative',
    backgroundColor: theme.colors.backgroundLight,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  durationIcon: {
    fontSize: theme.fonts.sizes.sm,
    marginRight: theme.spacing.xs,
    color: '#ffffff',
  },
  cardContent: {
    flex: 2,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardLight,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  locationIcon: {
    fontSize: theme.fonts.sizes.sm,
    marginRight: theme.spacing.xs,
    color: theme.colors.mutedLight,
  },
  locationText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '500' as any,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tagText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '500' as any,
    color: theme.colors.textLight,
  },
  aiTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  aiTagText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600' as any,
    color: theme.colors.primary,
  },
  // New DA compliant styles without images
  categoryIconContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryIcon: {
    fontSize: 32,
  },
  decorativePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  titleSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  patternText: {
    fontSize: 40,
    lineHeight: 50,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Modern responsive card design
  cardInner: {
    flex: 1,
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
    color: theme.colors.textLight,
  },
  mainContent: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  iconTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainIcon: {
    fontSize: 24,
  },
  titleArea: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  detailsSection: {
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  // Styles pour les images
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight + '80',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  imageSection: {
    height: CARD_HEIGHT * 0.4,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  retryText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  // Styles pour l'icône centrale
  centralIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  centralIcon: {
    fontSize: 30,
  },
});
