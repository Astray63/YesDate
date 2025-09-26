import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';

interface ModeChoiceScreenProps extends NavigationProps {
  route: {
    params?: {
      city?: string;
    };
  };
}

export default function ModeChoiceScreen({ navigation, route }: ModeChoiceScreenProps) {
  const userCity = route.params?.city;

  const handleSoloMode = () => {
    // Naviguer vers le quiz en mode solo (pas de room)
    global.currentRoomId = null;
    
    // Si aucune ville n'est définie, demander la localisation d'abord
    if (!userCity) {
      navigation.navigate('CityInput', { 
        returnTo: 'ModeChoice',
        mode: 'solo'
      });
    } else {
      navigation.navigate('Quiz', { city: userCity });
    }
  };

  const handleCoupleMode = () => {
    // Naviguer vers l'écran de création/join de room pour le mode couple
    global.currentRoomId = null;
    navigation.navigate('Room', { city: userCity });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8d7e0', '#f5e9ef', '#f8f6f7']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Titre principal */}
            <View style={styles.header}>
              <Text style={styles.title}>Comment voulez-vous</Text>
              <Text style={styles.title}>trouver vos dates ?</Text>
            </View>

            {/* Description */}
            <Text style={styles.subtitle}>
              Les deux modes vous permettent de découvrir des idées de dates, mais avec des approches différentes
            </Text>

            {/* Boutons de choix */}
            <View style={styles.buttonsContainer}>
              {/* Mode Solo */}
              <TouchableOpacity
                style={[styles.choiceButton, styles.soloButton]}
                onPress={handleSoloMode}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.soloIcon}>😊</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.buttonTitle}>Seul(e)</Text>
                    <Text style={styles.buttonDescription}>
                      Trouvez des idées de dates pour vous-même ou pour vous et votre partenaire
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Mode Couple */}
              <TouchableOpacity
                style={[styles.choiceButton, styles.coupleButton]}
                onPress={handleCoupleMode}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.coupleIcon}>💕</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.buttonTitle}>En couple</Text>
                    <Text style={styles.buttonDescription}>
                      Créez une room partagée pour swiper et matcher ensemble avec votre partenaire
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Note en bas */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Vous pourrez changer de mode plus tard si vous le souhaitez
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as any,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  buttonsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  choiceButton: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  soloButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ff6b9d',
  },
  coupleButton: {
    backgroundColor: '#ff6b9d',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soloIcon: {
    fontSize: 28,
  },
  coupleIcon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  buttonDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
