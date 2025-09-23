import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { theme } from '../utils/theme';

interface SuccessPopupProps {
  visible: boolean;
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function SuccessPopup({
  visible,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}: SuccessPopupProps) {
  const [modalVisible, setModalVisible] = useState(visible);
  const [scaleValue] = useState(new Animated.Value(0));
  const [opacityValue] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('🔍 SuccessPopup useEffect - visible:', visible, 'autoClose:', autoClose, 'duration:', duration);
    if (visible) {
      console.log('🎯 SuccessPopup devient visible !');
      setModalVisible(true);
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Fermeture automatique
      if (autoClose) {
        console.log('⏰ Configuration fermeture automatique dans', duration, 'ms');
        const timer = setTimeout(() => {
          console.log('🚪 Fermeture automatique déclenchée');
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      console.log('❌ SuccessPopup est masqué');
    }
  }, [visible]);

  const handleClose = () => {
    // Animation de sortie
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose?.();
    });
  };

  return (
    <>
      {modalVisible && (
        <View style={styles.overlay}>
          <Text style={styles.debugText}>DEBUG: Popup devrait être visible ici</Text>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
                zIndex: 9999,
                elevation: 9999,
              },
            ]}
          >
          {/* Icône de succès */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.icon}>✓</Text>
            </View>
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...theme.shadows.lg,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  icon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  content: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  debugText: {
    color: '#ff0000',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#ffff00',
    padding: 10,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 10000,
  },
});
