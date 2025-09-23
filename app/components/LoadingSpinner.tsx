import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
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
    "Analyse de vos préférences...",
    "Recherche d'idées personnalisées...",
    "Génération des suggestions...",
    "Finalisation des recommandations..."
  ],
  currentStep = 0,
  showProgress = true,
  size = 'large',
  message
}: LoadingSpinnerProps) {
  // Animations natives uniquement
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Animations JavaScript uniquement
  const [progressAnim] = useState(new Animated.Value(0));
  const [colorAnim] = useState(new Animated.Value(0));
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Animation de pulsation (native)
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  // Animation de rotation (native)
  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotationAnimation.start();
    return () => rotationAnimation.stop();
  }, [rotateAnim]);

  // Animation de fondu (native)
  useEffect(() => {
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    fadeAnimation.start();
    return () => fadeAnimation.stop();
  }, [fadeAnim]);

  // Animation de progression (JavaScript)
  useEffect(() => {
    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    progressAnimation.start();
    return () => progressAnimation.stop();
  }, [progressAnim]);

  // Animation de couleur (JavaScript)
  useEffect(() => {
    const colorAnimation = Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    colorAnimation.start();
    return () => colorAnimation.stop();
  }, [colorAnim]);

  // Animation des messages
  useEffect(() => {
    if (loadingSteps.length > 1) {
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 2000);

      return () => clearInterval(messageInterval);
    }
  }, [loadingSteps.length]);

  const getSize = () => {
    switch (size) {
      case 'small': return 40;
      case 'medium': return 60;
      case 'large': return 80;
      default: return 80;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return theme.fonts.sizes.sm;
      case 'medium': return theme.fonts.sizes.md;
      case 'large': return theme.fonts.sizes.lg;
      default: return theme.fonts.sizes.lg;
    }
  };

  const spinnerSize = getSize();
  const fontSize = getFontSize();

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth * 0.6],
  });

  // Couleur statique pour éviter les conflits
  const primaryColor = theme.colors.primary;

  const displayMessage = message || loadingSteps[currentMessageIndex] || loadingSteps[0];

  return (
    <View style={styles.container}>
      {/* Spinner principal */}
      <View style={styles.spinnerContainer}>
        <Animated.View
          style={[
            styles.spinner,
            {
              width: spinnerSize,
              height: spinnerSize,
              borderRadius: spinnerSize / 2,
              transform: [
                { rotate: rotateInterpolate },
                { scale: pulseAnim }
              ],
            },
          ]}
        >
          {/* Cercles concentriques */}
          <View style={[styles.spinnerRing, styles.ring1]} />
          <View style={[styles.spinnerRing, styles.ring2]} />
          <View style={[styles.spinnerRing, styles.ring3]} />

          {/* Centre du spinner */}
          <View style={[styles.spinnerCenter, { backgroundColor: primaryColor }]}>
            <Text style={styles.centerIcon}>✨</Text>
          </View>
        </Animated.View>
      </View>

      {/* Message de chargement */}
      <View style={styles.messageContainer}>
        <Animated.Text
          style={[
            styles.loadingMessage,
            {
              fontSize,
              opacity: fadeAnim,
              color: primaryColor,
            },
          ]}
        >
          {displayMessage}
        </Animated.Text>

        {/* Indicateur de progression */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                    backgroundColor: primaryColor,
                  },
                ]}
              />
              {/* Effet de brillance sur la barre de progression */}
              <Animated.View
                style={[
                  styles.progressShimmer,
                  {
                    opacity: progressAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.8, 0],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: primaryColor }]}>
              {Math.round((currentStep / loadingSteps.length) * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Points de suspension animés */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: primaryColor,
                opacity: fadeAnim,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0.9, 1, 1.2],
                      outputRange: [0.8, 1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
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
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.lg,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  spinner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  spinnerRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 999,
  },
  ring1: {
    width: '100%',
    height: '100%',
    borderTopColor: theme.colors.primary,
    borderRightColor: theme.colors.primary + '40',
  },
  ring2: {
    width: '80%',
    height: '80%',
    borderTopColor: theme.colors.primary + '60',
    borderRightColor: theme.colors.primary + '20',
  },
  ring3: {
    width: '60%',
    height: '60%',
    borderTopColor: theme.colors.primary + '80',
    borderRightColor: theme.colors.primary + '10',
  },
  spinnerCenter: {
    width: '40%',
    height: '40%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  centerIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  loadingMessage: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: screenWidth * 0.6,
    height: 4,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.mutedLight,
    fontWeight: '500' as any,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});