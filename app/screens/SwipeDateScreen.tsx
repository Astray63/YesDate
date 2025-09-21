import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { theme } from '../utils/theme';
import { NavigationProps, DateIdea } from '../types';
import { getPersonalizedDateIdeas } from '../utils/data';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_HEIGHT = screenHeight * 0.6;
const SWIPE_THRESHOLD = screenWidth * 0.3;

interface SwipeDateScreenProps extends NavigationProps {
  route: {
    params?: {
      quizAnswers?: { [key: string]: string };
      roomId?: string;
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

  const currentCard = dates[currentCardIndex];
  const isLastCard = currentCardIndex >= dates.length - 1;

  useEffect(() => {
    loadDateIdeas();
  }, []);

  const loadDateIdeas = async () => {
    try {
      setLoading(true);
      const quizAnswers = route.params?.quizAnswers || {};
      const dateIdeas = await getPersonalizedDateIdeas(quizAnswers);
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
        {/* Background card */}
        <View style={[styles.card, styles.backgroundCard]} />
        
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
            {/* Image Section */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentCard.image_url }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
              <View style={styles.imageTextOverlay}>
                <Text style={styles.cardTitle}>{currentCard.title}</Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.cardContent}>
              <Text style={styles.cardDescription}>
                {currentCard.description}
              </Text>
              <Text style={styles.cardDuration}>{currentCard.duration}</Text>
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
  imageContainer: {
    flex: 3,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  imageTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: '#ffffff',
  },
  cardContent: {
    flex: 2,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
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
});
