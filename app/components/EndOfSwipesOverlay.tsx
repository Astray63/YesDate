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
 * Composant overlay de fin de deck (Tinder-like)
 * - Full screen non-bloquant OS
 * - Accessible (role="dialog"), dismissible
 * - Dégradé + glassmorphism, micro-animations, haptique légère
 * - Prise en charge dark/light via useTheme
 * - Sans state global
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

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const containerRef = useRef<View | null>(null);

  // Détection accessibilité: réduire animations
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (mounted) setReduceMotion(!!r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Détection offline légère (sans dépendances)
  useEffect(() => {
    let mounted = true;
    const checkNetwork = async () => {
      if (!visible) return;
      try {
        // endpoint léger de no-content
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch('https://clients3.google.com/generate_204', {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mounted) setIsOffline(!(res && res.status === 204));
      } catch {
        if (mounted) setIsOffline(true);
      }
    };
    checkNetwork();
    return () => {
      mounted = false;
    };
  }, [visible]);

  // Détection permission localisation (variante "Localisation désactivée")
  useEffect(() => {
    let mounted = true;
    const checkLocationPerm = async () => {
      if (!visible) return;
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (mounted) setLocationDenied(!(perm.status === 'granted'));
      } catch {
        if (mounted) setLocationDenied(false);
      }
    };
    checkLocationPerm();
    return () => {
      mounted = false;
    };
  }, [visible]);

  // Apparition (fade + slide) + parallax float
  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(20);
      floatY.setValue(0);
      return;
    }

    console.log('end_of_swipes_viewed');

    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -4,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      opacity.setValue(1);
      translateY.setValue(0);
    }

    // Annonce accessibilité
    AccessibilityInfo.announceForAccessibility('Plus de profils pour le moment. Revenez plus tard ou ajustez vos critères.');

  }, [visible, reduceMotion, opacity, translateY, floatY]);

  const title = 'Plus de profils pour le moment';
  const defaultSubtitle = 'Revenez plus tard ou ajustez vos critères pour découvrir de nouvelles personnes.';
  const filtersStrictSubtitle = 'Vos critères sont très sélectifs. Essayez d’élargir pour voir plus de profils.';
  const locationDisabledSubtitle = 'Activez votre localisation pour trouver des profils près de vous.';
  const offlineSubtitle = 'Vous êtes hors ligne. Reconnectez-vous pour voir de nouveaux profils.';

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
      await Haptics.selectionAsync();
    } catch {}
    console.log('retry_quiz_clicked');
    onRetryQuiz?.();
    onClose?.();
  }, [onRetryQuiz, onClose]);

  const handleViewMatches = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    console.log('view_matches_clicked');
    onViewMatches?.();
    onClose?.();
  }, [onViewMatches, onClose]);

  if (!visible) return null;

  return (
    <View
      ref={containerRef}
      testID="endOverlay"
      accessible
      accessibilityRole={'dialog' as unknown as any}
      style={StyleSheet.absoluteFill}
      pointerEvents="auto"
    >
      <LinearGradient
        colors={[
          theme.isDark ? '#0e0a0c' : '#f5e9ef',
          theme.isDark ? '#1b0f16' : '#f8f6f7',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <Animated.View
        style={[
          styles.center,
          { opacity, transform: [{ translateY }] },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ translateY: floatY }] },
          ]}
          accessible
          accessibilityLabel="Fin des profils"
        >
          <BlurView intensity={theme.isDark ? 40 : 60} tint={theme.isDark ? 'dark' : 'light'} style={styles.glassCard}>
            <View style={[styles.illustrationWrap]}>
              <Text style={[styles.emoji, { color: theme.colors.text }]} aria-hidden>✨💕</Text>
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.muted }]}
              accessibilityLabel={subtitleToShow}
            >
              {subtitleToShow}
            </Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                testID="btnRetryQuiz"
                accessibilityLabel="Refaire le quiz"
                onPress={handleRetryQuiz}
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryText}>Refaire le quiz</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                testID="btnViewMatches"
                accessibilityLabel="Voir les matchs"
                onPress={handleViewMatches}
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryText}>Voir les matchs</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="btnClose"
              accessibilityLabel="Fermer"
              onPress={handleClose}
              style={[styles.closeBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              activeOpacity={0.9}
            >
              <Text style={[styles.closeText, { color: theme.colors.muted }]}>Fermer</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '92%',
    maxWidth: 440,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  glassCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 8,
  },
  buttonsRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    minHeight: 48,
    minWidth: 220,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryGrid: {
    marginTop: 14,
    gap: 10,
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontWeight: '600',
    fontSize: 14,
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default EndOfSwipesOverlay;