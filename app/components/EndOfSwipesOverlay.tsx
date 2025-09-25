import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useTheme } from '../utils/useTheme';

/**
 * API du composant (conforme à la demande)
 */
export interface EndOfSwipesOverlayProps {
  visible: boolean;
  onRetryQuiz: () => void;
  onViewMatches: () => void;
  onClose?: () => void;
  // Aides tests/variantes
  isOfflineOverride?: boolean;
  locationDeniedOverride?: boolean;
}

/**
 * Composant overlay de fin de deck - Design ultra moderne
 * - Interface épurée et élégante inspirée des meilleures apps
 * - Animations fluides et micro-interactions raffinées
 * - Glassmorphism avancé avec effets visuels immersifs
 * - Particules dynamiques et éléments flottants
 * - Support thème adaptatif et accessibilité optimisée
 * - Design cohérent avec l'identité visuelle de l'app
 */
const EndOfSwipesOverlay = memo(function EndOfSwipesOverlay({
  visible,
  onRetryQuiz,
  onViewMatches,
  onClose,
  isOfflineOverride,
  locationDeniedOverride,
}: EndOfSwipesOverlayProps) {
  const theme = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // Resolved flags allowing test overrides and variants
  const offlineResolved = typeof isOfflineOverride === 'boolean' ? isOfflineOverride : isOffline;
  const locationResolved = typeof locationDeniedOverride === 'boolean' ? locationDeniedOverride : locationDenied;

  // Animations principales - Design moderne
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(80)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;

  // Animations flottantes et particules
  const floatY = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // Particules améliorées avec mouvement 3D
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;

  // Micro-interactions boutons
  const primaryButtonScale = useRef(new Animated.Value(1)).current;
  const secondaryButtonScale = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;

  const containerRef = useRef<View | null>(null);
  const mountedRef = useRef(true);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Détection accessibilité: réduire animations
  useEffect(() => {
    mountedRef.current = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (mountedRef.current) setReduceMotion(!!r);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Détection offline légère (sans dépendances)
  useEffect(() => {
    const checkNetwork = async () => {
      if (!visible || !mountedRef.current) return;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch('https://clients3.google.com/generate_204', {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mountedRef.current) setIsOffline(!(res && res.status === 204));
      } catch {
        if (mountedRef.current) setIsOffline(true);
      }
    };
    checkNetwork();
  }, [visible]);

  // Détection permission localisation
  useEffect(() => {
    const checkLocationPerm = async () => {
      if (!visible || !mountedRef.current) return;
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (mountedRef.current) setLocationDenied(!(perm.status === 'granted'));
      } catch {
        if (mountedRef.current) setLocationDenied(false);
      }
    };
    checkLocationPerm();
  }, [visible]);

  // Animations d'entrée ultra modernes
  useEffect(() => {
    if (!visible) {
      // Reset toutes les animations
      opacity.setValue(0);
      translateY.setValue(80);
      scale.setValue(0.7);
      cardRotate.setValue(0);
      floatY.setValue(0);
      shimmer.setValue(0);
      return;
    }

    console.log('end_of_swipes_viewed');

    if (!reduceMotion) {
      // Séquence d'entrée dramatique
      Animated.sequence([
        // Phase 1: Apparition douce
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 500,
            easing: Easing.out(Easing.back(1.3)),
            useNativeDriver: true,
          }),
        ]),
        // Phase 2: Animation finale élégante
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(cardRotate, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Démarrer les animations continues après l'entrée
        startContinuousAnimations();
      });
    } else {
      // Version réduite pour l'accessibilité
      opacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
    }

    // Annonce accessibilité
    setTimeout(() => {
      if (mountedRef.current) {
        AccessibilityInfo.announceForAccessibility('Plus de profils pour le moment. Découvrez de nouvelles options.');
      }
    }, 100);

  }, [visible, reduceMotion]);

  // Animations continues pour un effet vivant
  const startContinuousAnimations = useCallback(() => {
    if (reduceMotion) return;

    // Flottement subtil de la carte
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -6,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 6,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Effet shimmer subtil
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Particules flottantes asynchrones
    const particleAnimations = [
      Animated.loop(
        Animated.timing(particle1, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(particle2, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(particle3, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(particle4, {
          toValue: 1,
          duration: 7000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ];

    floatAnimation.start();
    shimmerAnimation.start();
    particleAnimations.forEach(anim => anim.start());

    return () => {
      floatAnimation.stop();
      shimmerAnimation.stop();
      particleAnimations.forEach(anim => anim.stop());
    };
  }, [reduceMotion, floatY, shimmer, particle1, particle2, particle3, particle4]);

  const title = 'C\'est tout pour aujourd\'hui !';
  const defaultSubtitle = 'De nouveaux profils arrivent chaque jour. Revenez bientôt ou élargissez vos critères.';
  const filtersStrictSubtitle = 'Vos critères sont très précis ! Essayez d\'assouplir vos préférences pour découvrir plus de profils.';
  const locationDisabledSubtitle = 'Activez votre localisation pour découvrir des personnes près de vous.';
  const offlineSubtitle = 'Pas de connexion ? Reconnectez-vous pour voir de nouveaux profils.';

  const subtitleToShow = useMemo(() => {
    if (offlineResolved) return offlineSubtitle;
    if (locationResolved) return locationDisabledSubtitle;
    return defaultSubtitle;
  }, [defaultSubtitle, offlineResolved, locationResolved, offlineSubtitle, locationDisabledSubtitle]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleRetryQuiz = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    console.log('retry_quiz_clicked');
    onRetryQuiz?.();
    onClose?.();
  }, [onRetryQuiz, onClose]);

  const handleViewMatches = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    console.log('view_matches_clicked');
    onViewMatches?.();
    onClose?.();
  }, [onViewMatches, onClose]);

  // Micro-interactions avancées pour les boutons
  const handlePrimaryButtonPressIn = useCallback(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(primaryButtonScale, {
          toValue: 0.96,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reduceMotion, primaryButtonScale, buttonGlow]);

  const handlePrimaryButtonPressOut = useCallback(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(primaryButtonScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reduceMotion, primaryButtonScale, buttonGlow]);

  const handleSecondaryButtonPressIn = useCallback(() => {
    if (!reduceMotion) {
      Animated.timing(secondaryButtonScale, {
        toValue: 0.97,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [reduceMotion, secondaryButtonScale]);

  const handleSecondaryButtonPressOut = useCallback(() => {
    if (!reduceMotion) {
      Animated.timing(secondaryButtonScale, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.back(1.05)),
        useNativeDriver: true,
      }).start();
    }
  }, [reduceMotion, secondaryButtonScale]);

  // Styles dynamiques optimisés
  const memoizedStyles = useMemo(() => ({
    mainCard: [
      styles.mainCard,
      {
        backgroundColor: theme.isDark
          ? 'rgba(42, 21, 31, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme.isDark
          ? 'rgba(240, 66, 153, 0.2)'
          : 'rgba(240, 66, 153, 0.1)',
      },
    ],
    primaryButton: [
      styles.primaryButton,
      {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
      },
    ],
    secondaryButton: [
      styles.secondaryButton,
      {
        borderColor: theme.colors.primary + '60',
        backgroundColor: theme.isDark
          ? 'rgba(240, 66, 153, 0.1)'
          : 'rgba(240, 66, 153, 0.05)',
      },
    ],
    gradientBackground: theme.isDark
      ? ['#0f051a', '#1a0f2e', '#2d1b42']
      : ['#fdf7fc', '#f8f2f6', '#f4eff2'],
  }), [theme.isDark, theme.colors.primary]);

  if (!visible) return null;

  // Interpolations pour les animations
  const cardRotateInterpolate = cardRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  // Particules avec mouvements complexes
  const getParticleTransform = (particle: Animated.Value, delay: number) => {
    const translateX = particle.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [0, 30, -20, 40, 0],
    });
    const translateY = particle.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -60, 0],
    });
    const rotate = particle.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return [{ translateX }, { translateY }, { rotate }];
  };

  return (
    <View
      ref={containerRef}
      testID="endOverlay"
      accessible
      accessibilityRole={'dialog' as unknown as any}
      style={StyleSheet.absoluteFill}
      pointerEvents="auto"
    >
      {/* Arrière-plan avec dégradé sophistiqué */}
      <LinearGradient
        colors={memoizedStyles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Particules flottantes avec mouvements complexes */}
      <Animated.View style={[
        styles.particle,
        styles.particle1,
        { transform: getParticleTransform(particle1, 0) }
      ]}>
        <View style={[styles.modernParticle, styles.heartParticle]} />
      </Animated.View>

      <Animated.View style={[
        styles.particle,
        styles.particle2,
        { transform: getParticleTransform(particle2, 1000) }
      ]}>
        <View style={[styles.modernParticle, styles.starParticle]} />
      </Animated.View>

      <Animated.View style={[
        styles.particle,
        styles.particle3,
        { transform: getParticleTransform(particle3, 2000) }
      ]}>
        <View style={[styles.modernParticle, styles.sparkleParticle]} />
      </Animated.View>

      <Animated.View style={[
        styles.particle,
        styles.particle4,
        { transform: getParticleTransform(particle4, 3000) }
      ]}>
        <View style={[styles.modernParticle, styles.circleParticle]} />
      </Animated.View>

      {/* Contenu principal */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity,
            transform: [
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [
                { translateY: floatY },
                { rotate: cardRotateInterpolate },
              ],
            },
          ]}
          accessible
          accessibilityLabel="Plus de profils disponibles"
          accessibilityHint="Découvrez de nouvelles options pour continuer à explorer"
        >
          <BlurView
            intensity={theme.isDark ? 60 : 80}
            tint={theme.isDark ? 'dark' : 'light'}
            style={memoizedStyles.mainCard}
          >
            {/* Effet shimmer subtil */}
            <Animated.View
              style={[
                styles.shimmerEffect,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />

            {/* Hero section moderne */}
            <View style={styles.heroSection}>
              <View style={styles.iconContainer}>
                <View style={[styles.mainIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={styles.iconEmoji}>🌟</Text>
                </View>
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.modernTitle, { color: theme.colors.text }]}>
                  {title}
                </Text>
                <Text
                  style={[styles.modernSubtitle, { color: theme.colors.muted }]}
                  accessibilityLabel={subtitleToShow}
                >
                  {subtitleToShow}
                </Text>
              </View>
            </View>

            {/* Actions section */}
            <View style={styles.actionsSection}>
              <Animated.View style={{ transform: [{ scale: primaryButtonScale }] }}>
                <TouchableOpacity
                  testID="btnRetryQuiz"
                  accessibilityLabel="Refaire le quiz pour découvrir de nouveaux profils"
                  accessibilityHint="Recommencer le quiz pour ajuster vos préférences"
                  onPress={handleRetryQuiz}
                  onPressIn={handlePrimaryButtonPressIn}
                  onPressOut={handlePrimaryButtonPressOut}
                  style={memoizedStyles.primaryButton}
                  activeOpacity={0.9}
                >
                  <Animated.View
                    style={[
                      styles.buttonGlow,
                      {
                        opacity: buttonGlow,
                        backgroundColor: theme.colors.primary + '30',
                      },
                    ]}
                  />
                  <LinearGradient
                    colors={[
                      'rgba(255,255,255,0.2)',
                      'rgba(255,255,255,0.05)',
                      'rgba(255,255,255,0)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonOverlay}
                  />
                  <Text style={styles.primaryButtonText}>✨ Refaire le quiz</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: secondaryButtonScale }] }}>
                <TouchableOpacity
                  testID="btnViewMatches"
                  accessibilityLabel="Voir mes matchs"
                  onPress={handleViewMatches}
                  onPressIn={handleSecondaryButtonPressIn}
                  onPressOut={handleSecondaryButtonPressOut}
                  style={memoizedStyles.secondaryButton}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                    💕 Voir mes matchs
                  </Text>
                </TouchableOpacity>
              </Animated.View>

            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Wrapper de la carte principale
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 25,
  },

  // Carte principale avec glassmorphism
  mainCard: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 28,
    borderRadius: 28,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },

  // Effet shimmer
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    opacity: 0.1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    zIndex: 1,
  },

  // Particules modernes
  particle: {
    position: 'absolute',
    zIndex: 2,
  },
  particle1: { left: '10%', top: '15%' },
  particle2: { right: '15%', top: '25%' },
  particle3: { left: '70%', top: '12%' },
  particle4: { right: '25%', bottom: '20%' },

  modernParticle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  heartParticle: {
    backgroundColor: '#ff6b9d',
    borderRadius: 8,
    width: 12,
    height: 12,
  },
  starParticle: {
    backgroundColor: '#ffd93d',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  sparkleParticle: {
    backgroundColor: '#4ecdc4',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circleParticle: {
    backgroundColor: '#a8e6cf',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Hero section moderne
  heroSection: {
    alignItems: 'center',
    marginBottom: 36,
    zIndex: 2,
  },

  iconContainer: {
    marginBottom: 24,
  },

  mainIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(240, 66, 153, 0.3)',
  },

  iconEmoji: {
    fontSize: 32,
  },

  textContainer: {
    alignItems: 'center',
  },

  modernTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.8,
    lineHeight: 34,
  },

  modernSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.85,
    maxWidth: 300,
    fontWeight: '500',
  },

  // Section actions
  actionsSection: {
    gap: 16,
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },

  // Bouton principal
  primaryButton: {
    height: 56,
    width: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },

  buttonGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 48,
  },

  buttonOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
    zIndex: 1,
  },

  // Bouton secondaire
  secondaryButton: {
    height: 52,
    width: '100%',
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },

});

export default EndOfSwipesOverlay;