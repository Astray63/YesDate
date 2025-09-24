import React, { useState, useRef, useEffect, JSX } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { getPersonalizedDateIdeas, ProgressCallback } from '../utils/data';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { theme } from '../utils/theme';
import { NavigationProps, DateIdea } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import DateCardModal from '../components/DateCardModal';
import EndOfSwipesOverlay from '../components/EndOfSwipesOverlay';

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DateIdea | null>(null);
  const [endVisible, setEndVisible] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;

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

  // Animation d'entrée pour les cartes
  useEffect(() => {
    if (dates.length > 0 && !loading) {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dates.length, loading]);

  // Quand il n'y a pas de cartes après chargement, afficher l'overlay
  useEffect(() => {
    if (!loading && dates.length === 0) {
      setEndVisible(true);
    }
  }, [loading, dates.length]);

  const loadDateIdeas = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      setLoadingMessage('Initializing...');

      const quizAnswers = route.params?.quizAnswers || {};
      const userCity = route.params?.city;
      console.log('Quiz answers:', quizAnswers);
      console.log('User city from params:', userCity);

      // Callback de progression pour mettre à jour l'interface
      const onProgress: ProgressCallback = (message: string, progress: number) => {
        setLoadingMessage(message);
        setLoadingProgress(progress);
      };

      const dateIdeas = await getPersonalizedDateIdeas(quizAnswers, userCity, onProgress);
      setDates(dateIdeas);
    } catch (error) {
      console.error('Error loading date ideas:', error);
      setLoadingMessage('Error loading suggestions. Please try again.');
      setLoadingProgress(0);
    } finally {
      // Petite pause pour que l'utilisateur voie le message de fin
      setTimeout(() => {
        setLoading(false);
      }, 1000);
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

      // Check if there are more cards after this swipe
      const hasMoreCards = currentCardIndex < dates.length - 1;

      if (!hasMoreCards) {
        // Fin du deck: afficher l'overlay de fin
        setEndVisible(true);
        return;
      } else {
        // Move to next card
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
    if (endVisible) {
      // empêcher le swipe quand l'overlay est visible
      return;
    }
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Si le mouvement est très petit, on considère que c'est un tap
      if (Math.abs(translationX) < 10 && Math.abs(velocityX) < 100) {
        handleCardPress();
        resetCard();
        return;
      }
      
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

  const handleCardPress = () => {
    if (currentCard) {
      setSelectedCard(currentCard);
      setModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedCard(null);
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

  // Composant visuel inspiré du design moderne
  const DateVisual = ({ card, style }: { card: DateIdea; style: any }) => {
    return (
      <View style={[style, { position: 'relative' }]}>
        {/* Fond avec dégradé inspiré de l'image */}
        <View style={styles.gradientBackground} />

        {/* Motifs décoratifs subtils */}
        <View style={styles.patternOverlay}>
          <Text style={styles.patternIcon}>{getCategoryEmoji(card.category)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          message={loadingMessage}
          showProgress={true}
          size="large"
        />
      </SafeAreaView>
    );
  }

  if (!currentCard) {
    // Afficher l'overlay de fin lorsque plus aucune carte
    return (
      <SafeAreaView style={styles.container}>
        <EndOfSwipesOverlay
          visible={true}
          onRetryQuiz={() => {
            navigation.navigate('Quiz');
            setEndVisible(false);
          }}
          onExpandFilters={() => {
            // Exemple: ouvrir un panneau de filtres (à intégrer selon votre app)
            console.log('Assouplir mes critères');
          }}
          onRefresh={() => loadDateIdeas()}
          onEnableNotifications={() => console.log('Notifications activées')}
          onOpenSettings={() => console.log('Ouverture des réglages')}
          onExpandRadius={() => {
            console.log('Étendre le rayon de recherche');
            // Exemple minimal: relancer une recherche
            loadDateIdeas();
          }}
          onClose={() => setEndVisible(false)}
        />
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
            {/* Nouveau design pour l'aperçu */}
            <View style={styles.newCardDesign}>
              {/* Section visuelle avec fond sombre */}
              <DateVisual card={nextCard} style={styles.imageSection} />

              {/* Section d'informations en haut */}
              <View style={styles.topInfoSection}>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>📍 {nextCard.area || 'Paris'}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>📏 5 km</Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>💰 {getCostLabel(nextCard.cost || 'moderate')}</Text>
                </View>
              </View>

              {/* Section centrale avec titre */}
              <View style={styles.centerContent}>
                <Text style={styles.mainTitle}>{nextCard.title}</Text>

                <View style={styles.indicatorsRow}>
                  <View style={styles.yesdateIndicator}>
                    <Text style={styles.yesdateText}>YESDATE</Text>
                  </View>
                  <View style={styles.moodIndicator}>
                    <Text style={styles.moodText}>{getCategoryLabel(nextCard.category)}</Text>
                  </View>
                </View>
              </View>

              {/* Grand indicateur LIKE sur le côté */}
              <View style={styles.likeIndicator}>
                <Text style={styles.likeText}>LIKE</Text>
              </View>

              {/* Section d'informations en bas */}
              <View style={styles.bottomInfoSection}>
                <View style={styles.bottomInfoRow}>
                  <View style={styles.bottomInfoItem}>
                    <Text style={styles.bottomInfoIcon}>📍</Text>
                    <Text style={styles.bottomInfoText}>2,3 km</Text>
                  </View>
                  <View style={styles.bottomInfoItem}>
                    <Text style={styles.bottomInfoIcon}>⏱️</Text>
                    <Text style={styles.bottomInfoText}>{nextCard.duration}</Text>
                  </View>
                  <View style={styles.bottomInfoItem}>
                    <Text style={styles.bottomInfoIcon}>💰</Text>
                    <Text style={styles.bottomInfoText}>{getCostLabel(nextCard.cost || 'moderate')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Main card - Nouveau design inspiré de l'image */}
        <PanGestureHandler
          enabled={!endVisible}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX },
                  { translateY: Animated.add(translateY, cardTranslateY) },
                  { rotate: rotateInterpolate },
                  { scale },
                ],
                opacity: cardOpacity,
              },
            ]}
          >
            <Pressable style={styles.newCardDesign} onPress={handleCardPress}>
              {/* Section visuelle avec fond sombre */}
              <DateVisual card={currentCard} style={styles.imageSection} />

              {/* Section d'informations en haut */}
              <View style={styles.topInfoSection}>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>📍 {currentCard.area || 'Paris'}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>📏 5 km</Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>💰 {getCostLabel(currentCard.cost || 'moderate')}</Text>
                </View>
              </View>

              {/* Section centrale avec titre */}
              <View style={styles.centerContent}>
                <Text style={styles.mainTitle}>{currentCard.title}</Text>

                <View style={styles.indicatorsRow}>
                  <View style={styles.yesdateIndicator}>
                    <Text style={styles.yesdateText}>YESDATE</Text>
                  </View>
                  <View style={styles.moodIndicator}>
                    <Text style={styles.moodText}>{getCategoryLabel(currentCard.category)}</Text>
                  </View>
                </View>
              </View>

              {/* Grand indicateur LIKE sur le côté */}
              <View style={styles.likeIndicator}>
                <Text style={styles.likeText}>LIKE</Text>
              </View>

              {/* Section d'informations en bas */}
              <View style={styles.bottomInfoSection}>
                <View style={styles.bottomInfoRow}>
                  <View style={styles.bottomInfoItem}>
                    <Text style={styles.bottomInfoIcon}>📍</Text>
                    <Text style={styles.bottomInfoText}>2,3 km</Text>
                  </View>
                  <View style={styles.bottomInfoItem}>
                    <Text style={styles.bottomInfoIcon}>⏱️</Text>
                    <Text style={styles.bottomInfoText}>{currentCard.duration}</Text>
                  </View>
                  <View style={styles.bottomInfoItem}>
                    <Text style={styles.bottomInfoIcon}>💰</Text>
                    <Text style={styles.bottomInfoText}>{getCostLabel(currentCard.cost || 'moderate')}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
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

      {/* Modal pour les détails de la carte */}
      <DateCardModal
        visible={modalVisible}
        onClose={handleModalClose}
        dateIdea={selectedCard}
      />

      {/* Overlay de fin de deck */}
      <EndOfSwipesOverlay
        visible={endVisible}
        onRetryQuiz={() => {
          navigation.navigate('Quiz');
          setEndVisible(false);
        }}
        onExpandFilters={() => {
          console.log('Assouplir mes critères');
        }}
        onRefresh={() => loadDateIdeas()}
        onEnableNotifications={() => console.log('Notifications activées')}
        onOpenSettings={() => console.log('Ouverture des réglages')}
        onExpandRadius={() => {
          console.log('Étendre le rayon de recherche');
          loadDateIdeas();
        }}
        onClose={() => setEndVisible(false)}
      />
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
    fontWeight: '800' as any,
    color: '#1a1a1a',
    lineHeight: 32,
    marginBottom: 4,
    letterSpacing: -0.5,
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
    paddingVertical: theme.spacing.lg,
    gap: 100,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#ff4757',
    shadowColor: '#ff4757',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  likeButton: {
    backgroundColor: theme.colors.primary,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  superLikeButton: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  rejectIcon: {
    fontSize: 32,
    color: '#ff4757',
  },
  likeIcon: {
    fontSize: 36,
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
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tagText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
    color: '#333333',
    letterSpacing: 0.3,
  },
  aiTag: {
    backgroundColor: '#667eea',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiTagText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
    color: '#ffffff',
    letterSpacing: 0.5,
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
    fontSize: 60,
    lineHeight: 70,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Nouveau design de carte inspiré de l'image
  newCardDesign: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  iconTitleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainIcon: {
    fontSize: 28,
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  durationText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '600' as any,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    fontWeight: '400' as any,
  },
  detailsSection: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: theme.borderRadius.md,
  },
  detailIcon: {
    fontSize: 18,
  },
  detailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '500' as any,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  // Styles pour les images
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  imageSection: {
    height: CARD_HEIGHT * 0.45,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  retryText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  // Nouveau design inspiré de l'image
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: theme.borderRadius.lg,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 120,
    color: theme.colors.primary,
  },
  // Section d'informations en haut
  topInfoSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  infoPill: {
    backgroundColor: 'rgba(248, 246, 247, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(248, 246, 247, 0.2)',
  },
  infoText: {
    color: theme.colors.textDark,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
  },
  // Section centrale avec titre
  centerContent: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '800' as any,
    color: theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: theme.spacing.lg,
  },
  // Indicateurs YESDATE et ambiance
  indicatorsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  yesdateIndicator: {
    backgroundColor: 'rgba(248, 246, 247, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(248, 246, 247, 0.3)',
  },
  yesdateText: {
    color: theme.colors.textDark,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
    letterSpacing: 1,
  },
  moodIndicator: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  moodText: {
    color: theme.colors.textDark,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
    letterSpacing: 1,
  },
  // Grand indicateur LIKE sur le côté
  likeIndicator: {
    position: 'absolute',
    right: -25,
    top: '50%',
    transform: [{ translateY: -50 }, { rotate: '15deg' }],
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 20,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  likeText: {
    fontSize: 24,
    fontWeight: '900' as any,
    color: theme.colors.textDark,
    letterSpacing: 2,
  },
  // Section d'informations en bas
  bottomInfoSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 16, 25, 0.8)',
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  bottomInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bottomInfoIcon: {
    fontSize: 18,
    color: theme.colors.textDark,
  },
  bottomInfoText: {
    color: theme.colors.textDark,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600' as any,
  },
});
