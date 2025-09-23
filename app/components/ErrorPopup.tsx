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

interface ErrorPopupProps {
  visible: boolean;
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorPopup({
  visible,
  title,
  message,
  onClose,
  autoClose = false,
  duration = 4000,
  type = 'error',
}: ErrorPopupProps) {
  const [modalVisible, setModalVisible] = useState(visible);
  const [scaleValue] = useState(new Animated.Value(0));
  const [opacityValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
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
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
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

  const getIconAndColor = () => {
    switch (type) {
      case 'warning':
        return {
          icon: '⚠',
          backgroundColor: theme.colors.primary + '20',
          borderColor: theme.colors.primary,
          iconColor: theme.colors.primary,
        };
      case 'info':
        return {
          icon: 'ℹ',
          backgroundColor: theme.colors.primary + '15',
          borderColor: theme.colors.primary,
          iconColor: theme.colors.primary,
        };
      default: // error
        return {
          icon: '✕',
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444',
          iconColor: '#ef4444',
        };
    }
  };

  const { icon, backgroundColor, borderColor, iconColor } = getIconAndColor();

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleValue }],
              opacity: opacityValue,
            },
          ]}
        >
          {/* Icône */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor, borderColor }]}>
              <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
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
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  icon: {
    fontSize: 28,
    fontWeight: 'bold',
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
});
