import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  loadingSteps?: string[];
  currentStep?: number;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function LoadingSpinner({
  loadingSteps = [
    "✨ Analyse de vos préférences romantiques",
    "💕 Recherche des lieux les plus enchanteurs",
    "🌟 Création d'expériences sur mesure",
    "🎭 Personnalisation selon vos goûts",
    "💎 Sélection des meilleures suggestions",
    "🎉 Finalisation de votre sélection parfaite",
    "🌹 Ajout de la touche magique finale"
  ],
  currentStep = 0,
  showProgress = true,
  size = 'large',
  message
}: LoadingSpinnerProps) {
  
  // États pour les animations
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Valeurs d'animation natives (useNativeDriver: false)
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const messageTranslateY = useRef(new Animated.Value(0)).current;
  const particleValue = useRef(new Animated.Value(0)).current;
  const breatheValue = useRef(new Animated.Value(1)).current;
  
  // Valeurs d'animation JavaScript (useNativeDriver: false)
  const progressValue = useRef(new Animated.Value(0)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  // Animation de rotation principale
  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    spinAnimation.start();
    return () => spinAnimation.stop();
  }, []);

  // Animation de pulsation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Animation de respiration pour l'effet de glow
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheValue, {
          toValue: 1.15,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(breatheValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, []);

  // Animation de l'effet glow (tout en natif pour éviter le mix JS/native sur le même noeud)
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowValue, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowValue, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  // Animation des particules
  useEffect(() => {
    const particleAnimation = Animated.loop(
      Animated.timing(particleValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    particleAnimation.start();
    return () => particleAnimation.stop();
  }, []);

  // Animation de progression fluide
  useEffect(() => {
    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    progressAnimation.start();
    return () => progressAnimation.stop();
  }, []);

  // Transition fluide des messages
  const transitionToNextMessage = () => {
    setIsTransitioning(true);
    
    Animated.parallel([
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(messageTranslateY, {
        toValue: -20,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingSteps.length);
      messageTranslateY.setValue(20);
      
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(messageTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  // Gestion du changement de messages
  useEffect(() => {
    if (loadingSteps.length > 1) {
      const messageInterval = setInterval(() => {
        transitionToNextMessage();
      }, 2000);

      return () => clearInterval(messageInterval);
    }
  }, [loadingSteps.length]);

  const getSize = () => {
    switch (size) {
      case 'small': return 60;
      case 'medium': return 80;
      case 'large': return 100;
      default: return 100;
    }
  };

  const spinnerSize = getSize();
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth * 0.7],
  });

  const glowOpacity = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const displayMessage = message || loadingSteps[currentMessageIndex] || loadingSteps[0];

  return (
    <View style={styles.container}>
      {/* Effet de fond avec dégradé */}
      <LinearGradient
        colors={['rgba(255, 107, 157, 0.05)', 'rgba(255, 107, 157, 0.02)', 'transparent']}
        style={styles.backgroundGradient}
      />

      {/* Particules flottantes */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${15 + index * 12}%`,
                top: `${20 + (index % 3) * 25}%`,
                transform: [
                  {
                    translateY: particleValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -30 - index * 5],
                    }),
                  },
                  {
                    scale: particleValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ],
                opacity: particleValue.interpolate({
                  inputRange: [0, 0.3, 0.7, 1],
                  outputRange: [0, 0.8, 0.8, 0],
                }),
              },
            ]}
          >
            <Text style={styles.particleEmoji}>
              {['✨', '💫', '⭐', '🌟', '💎', '🔮'][index]}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Conteneur principal du spinner */}
      <View style={styles.spinnerContainer}>
        {/* Effet de glow animé */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              width: spinnerSize + 40,
              height: spinnerSize + 40,
              opacity: glowOpacity,
              transform: [{ scale: breatheValue }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 107, 157, 0.4)', 'rgba(255, 107, 157, 0.1)', 'transparent']}
            style={styles.glowGradient}
          />
        </Animated.View>

        {/* Spinner principal */}
        <Animated.View
          style={[
            styles.spinner,
            {
              width: spinnerSize,
              height: spinnerSize,
              transform: [
                { rotate: spin },
                { scale: pulseValue },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#ff6b9d', '#ff8fab', '#ffb3c1']}
            style={styles.spinnerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Anneaux concentriques */}
            <View style={[styles.ring, styles.outerRing]} />
            <View style={[styles.ring, styles.middleRing]} />
            <View style={[styles.ring, styles.innerRing]} />
            
            {/* Centre du spinner */}
            <View style={styles.spinnerCenter}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.centerGradient}
              >
                <Text style={styles.centerIcon}>💕</Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Message de chargement avec transition */}
      <View style={styles.messageContainer}>
        <Animated.View
          style={[
            styles.messageWrapper,
            {
              opacity: messageOpacity,
              transform: [{ translateY: messageTranslateY }],
            },
          ]}
        >
          <Text style={styles.loadingMessage}>
            {displayMessage}
          </Text>
        </Animated.View>

        {/* Indicateur de progression sophistiqué */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={styles.progressBackground}>
                <LinearGradient
                  colors={['rgba(255, 107, 157, 0.1)', 'rgba(255, 107, 157, 0.05)']}
                  style={styles.progressBackgroundGradient}
                />
              </Animated.View>
              
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth,
                  },
                ]}
              >
                <LinearGradient
                  colors={['#ff6b9d', '#ff8fab', '#ffb3c1']}
                  style={styles.progressGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                
                {/* Effet de brillance */}
                <Animated.View
                  style={[
                    styles.progressShimmer,
                    {
                      opacity: progressValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0],
                      }),
                    },
                  ]}
                />
              </Animated.View>
            </View>
            
            <Text style={styles.progressText}>
              Création en cours...
            </Text>
          </View>
        )}
      </View>

      {/* Points décoratifs animés */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.decorativeDot,
              {
                opacity: pulseValue.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.6, 1],
                }),
                transform: [
                  {
                    scale: pulseValue.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#ff6b9d', '#ffb3c1']}
              style={styles.dotGradient}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    paddingHorizontal: theme.spacing.xl,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
  particleEmoji: {
    fontSize: 16,
    opacity: 0.7,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl * 2,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 999,
  },
  spinner: {
    borderRadius: 999,
    shadowColor: '#ff6b9d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  spinnerGradient: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  outerRing: {
    width: '90%',
    height: '90%',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  middleRing: {
    width: '70%',
    height: '70%',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
  },
  innerRing: {
    width: '50%',
    height: '50%',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.5)',
  },
  spinnerCenter: {
    width: '35%',
    height: '35%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  centerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    fontSize: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    minHeight: 80,
  },
  messageWrapper: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  progressTrack: {
    width: screenWidth * 0.7,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressBackgroundGradient: {
    flex: 1,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressGradient: {
    flex: 1,
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  decorativeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  dotGradient: {
    flex: 1,
  },
});