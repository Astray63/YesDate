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
import { LinearGradient } from 'expo-linear-gradient';

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
  const [matches, setMatches] = useState<DateIdea[]>([]);
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DateIdea | null>(null);
  const [endVisible, setEndVisible] = useState(false);
  const [isCoupleMode, setIsCoupleMode] = useState(false);

  // Récupérer les paramètres de navigation
  const quizAnswers = route.params?.quizAnswers || {};
  const userCity = route.params?.city;
  const roomId = route.params?.roomId;
  const isCoupleModeParam = (route.params as any)?.isCoupleMode || false;

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

  // Measure the cards container to center cards precisely on all devices
  const [containerWidth, setContainerWidth] = useState(screenWidth);
  const [containerHeight, setContainerHeight] = useState(CARD_HEIGHT);

  const centeredCardBaseStyle = React.useMemo(() => {
    // Center the card perfectly within the container
    return {
      left: (containerWidth - CARD_WIDTH) / 2,
      top: Math.max(0, (containerHeight - CARD_HEIGHT) / 2),
    };
  }, [containerWidth, containerHeight]);
  const currentCard = dates[currentCardIndex];
  const nextCard = dates[currentCardIndex + 1];
  const isLastCard = currentCardIndex >= dates.length - 1;

  useEffect(() => {
    setIsCoupleMode(isCoupleModeParam);
    loadDateIdeas();
  }, [isCoupleModeParam]);

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

      // Si c'est un like (swipe vers la droite), ajouter aux matchs
      if (direction === 'right' && currentCard) {
        setMatches(prev => [...prev, currentCard]);
      }

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

  // Fonction helper pour récupérer la police selon le mood
  const getMoodFontFamily = (category: string): string => {
    return theme.fonts.moodFonts[category] || theme.fonts.display;
  };

  // Softer, modern gradients used for card backgrounds
  const getCategoryGradientColors = (category: string): [string, string] => {
    const map: { [key: string]: [string, string] } = {
      romantic: ['#FFE1EC', '#FFC2D9'],
      fun: ['#FFF4C4', '#FFE89A'],
      relaxed: ['#E6FBEA', '#CFF6D8'],
      adventurous: ['#FFE1CC', '#FFC8A3'],
      food: ['#FFE1E1', '#FFCACA'],
      nature: ['#E0FBF7', '#C8F3ED'],
      culture: ['#E9FBF2', '#D1F6E5'],
      sport: ['#FFE4E8', '#FFC8D1'],
    };
    return map[category] || ['#FBE7F1', '#F7D2E6'];
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

  // (Old DateVisual removed — replaced by gradient-based design)

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
          onViewMatches={() => {
            navigation.navigate('Match', { matches });
            setEndVisible(false);
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

      {/* Cards Container - Now takes remaining space above buttons */}
      <View
        style={styles.cardsContainer}
        onLayout={(e) => {
          setContainerWidth(e.nativeEvent.layout.width);
          setContainerHeight(e.nativeEvent.layout.height);
        }}
      >
        {/* Next card preview */}
        {nextCard && (
          <Animated.View
            style={[
              styles.card,
              centeredCardBaseStyle,
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
            <LinearGradient
              colors={getCategoryGradientColors(nextCard.category)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardInner}
            >
              <View style={styles.topRow}>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>
                    {getCategoryEmoji(nextCard.category)} {getCategoryLabel(nextCard.category)}
                  </Text>
                </View>
              </View>

              <View style={styles.centerBlock}>
                <Text style={[
                  styles.titleText,
                  { fontFamily: getMoodFontFamily(nextCard.category) }
                ]}>
                  {nextCard.title}
                </Text>
                <Text style={[
                  styles.subtitleText,
                  { fontFamily: getMoodFontFamily(nextCard.category) }
                ]} numberOfLines={3}>
                  {nextCard.description}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{getCostLabel(nextCard.cost || 'moderate')}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{getLocationTypeLabel(nextCard.location_type || 'city')}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{nextCard.area ? `${nextCard.area} km` : '5 km'}</Text>
                </View>
              </View>
            </LinearGradient>
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
              centeredCardBaseStyle,
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
            <Pressable style={styles.cardPressable} onPress={handleCardPress}>
              <LinearGradient
                colors={getCategoryGradientColors(currentCard.category)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardInner}
              >
                <View style={styles.topRow}>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>
                      {getCategoryEmoji(currentCard.category)} {getCategoryLabel(currentCard.category)}
                    </Text>
                  </View>
                </View>

                <View style={styles.centerBlock}>
                  <Text style={[
                    styles.titleText,
                    { fontFamily: getMoodFontFamily(currentCard.category) }
                  ]}>
                    {currentCard.title}
                  </Text>
                  <Text style={[
                    styles.subtitleText,
                    { fontFamily: getMoodFontFamily(currentCard.category) }
                  ]} numberOfLines={3}>
                    {currentCard.description}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.infoChip}>
                    <Text style={styles.infoChipText}>{getCostLabel(currentCard.cost || 'moderate')}</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Text style={styles.infoChipText}>{getLocationTypeLabel(currentCard.location_type || 'city')}</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Text style={styles.infoChipText}>{currentCard.area ? `${currentCard.area} km` : '5 km'}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Action Buttons - Now positioned at bottom of screen */}
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
        onViewMatches={() => {
          navigation.navigate('Match', { matches });
          setEndVisible(false);
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 140, // Reserve space for the fixed action buttons at bottom
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
    gap: 80,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rejectButton: {
    backgroundColor: '#ffffff',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#ff4757',
    shadowColor: '#ff4757',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  likeButton: {
    backgroundColor: '#ff6b9d',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ff6b9d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  superLikeButton: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  rejectIcon: {
    fontSize: 24,
    color: '#ff4757',
    fontWeight: 'bold',
  },
  likeIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
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
  costBadge: {
    backgroundColor: theme.colors.mutedLight + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.mutedLight + '40',
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
  // Design inspiré exactement de l'image fournie
  simpleCardDesign: {
    flex: 1,
    backgroundColor: '#f8d7e0',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  simpleBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8d7e0',
    borderRadius: 20,
  },
  topLeftInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700' as any,
    color: '#1a1a1a',
    lineHeight: 32,
  },
  distanceCostInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 16,
    color: '#666',
  },
  distanceText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500' as any,
  },
  costText: {
    fontSize: 16,
    color: '#666',
  },
  centerDescription: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '400' as any,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  imageSection: {
    height: CARD_HEIGHT * 0.45,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8d7e0',
  },
  categorySectionTop: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  categoryTextTop: {
    fontSize: 16,
    fontWeight: '700' as any,
    color: '#ff6b9d',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  mainTitleSection: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  mainTitleText: {
    fontSize: 32,
    fontWeight: '800' as any,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 36,
  },
  descriptionSection: {
    position: 'absolute',
    top: '55%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomInfoSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoIcon: {
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as any,
  },

  // Redesigned card styles
  cardPressable: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  centerBlock: {
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  titleText: {
    fontSize: theme.fonts.sizes['3xl'],
    fontWeight: '800' as any,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: theme.spacing.sm,
  },
  subtitleText: {
    fontSize: theme.fonts.sizes.md,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoChip: {
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  infoChipText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600' as any,
  },
});
