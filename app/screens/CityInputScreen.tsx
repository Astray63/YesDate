import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  FlatList,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { getCitySuggestions, getCurrentLocationCity } from '../utils/data';
import { theme } from '../utils/theme';
import AppleMapView from '../components/AppleMapView';

type CityInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CityInput'>;
type CityInputScreenRouteProp = RouteProp<RootStackParamList, 'CityInput'>;

const CityInputScreen: React.FC = () => {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
    city?: string;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const navigation = useNavigation<CityInputScreenNavigationProp>();
  const route = useRoute<CityInputScreenRouteProp>();
  const { returnTo, mode } = route.params || {};

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const inputScaleAnim = new Animated.Value(1);
  const buttonScaleAnim = new Animated.Value(1);

  // Fermer les suggestions quand on appuie en dehors
  useEffect(() => {
    const dismissSuggestions = () => {
      setShowSuggestions(false);
    };

    if (showSuggestions) {
      const timeoutId = setTimeout(dismissSuggestions, 10000); // Fermer après 10 secondes
      return () => clearTimeout(timeoutId);
    }
  }, [showSuggestions]);

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    const requestLocationOnLoad = async () => {
      try {
        const { getCurrentLocationCity } = await import('../utils/data');
        const currentCity = await getCurrentLocationCity();
        if (currentCity) {
          setCity(currentCity);
        }
      } catch (error) {
        console.log('Geolocation not available or denied');
      }
    };

    const timeoutId = setTimeout(requestLocationOnLoad, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Fonction pour demander la géolocalisation
  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      // Pour ce cas spécifique, on garde Alert.alert car c'est une confirmation avec choix
      Alert.alert(
        'Localisation',
        'Voulez-vous que nous utilisions votre position actuelle pour détecter automatiquement votre ville ?',
        [
          {
            text: 'Non, je préfère saisir manuellement',
            style: 'cancel',
            onPress: () => setLocationLoading(false),
          },
          {
            text: 'Oui, utiliser ma position',
            onPress: async () => {
              try {
                const currentCity = await getCurrentLocationCity();
                if (currentCity) {
                  setCity(currentCity);
                  Alert.alert('Ville détectée !', `Nous avons détecté que vous êtes à ${currentCity}. Vous pouvez modifier cette ville si nécessaire.`);
                } else {
                  Alert.alert('Localisation indisponible', 'Nous n\'avons pas pu détecter votre ville automatiquement. Vous pouvez la saisir manuellement.');
                }
              } catch (error) {
                Alert.alert('Erreur de localisation', 'Une erreur est survenue lors de la détection de votre position. Vous pouvez saisir votre ville manuellement.');
              } finally {
                setLocationLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setLocationLoading(false);
      Alert.alert('Erreur', 'Impossible d\'accéder à la géolocalisation. Vous pouvez saisir votre ville manuellement.');
    }
  };

  // Fonction pour gérer les changements de texte avec autocomplétion
  const handleCityChange = (text: string) => {
    setCity(text);
    if (text.length >= 2) {
      const citySuggestions = getCitySuggestions(text);
      setSuggestions(citySuggestions);
      setShowSuggestions(citySuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Gestion du focus de l'input
  const handleInputFocus = () => {
    setInputFocused(true);
    Animated.spring(inputScaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();

    if (city.length >= 2) {
      const citySuggestions = getCitySuggestions(city);
      setSuggestions(citySuggestions);
      setShowSuggestions(citySuggestions.length > 0);
    }
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    Animated.spring(inputScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Animation du bouton
  const animateButton = () => {
    Animated.sequence([
      Animated.spring(buttonScaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      })
    ]).start();
  };

  // Fonction pour sélectionner une suggestion
  const selectSuggestion = (selectedCity: string) => {
    setCity(selectedCity);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // Fonction pour gérer la sélection de localisation depuis la carte
  const handleLocationSelect = (location: {
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
    city?: string;
  }) => {
    setSelectedLocation(location);
    setCity(location.city || location.name);
    setShowMap(false);
    Alert.alert(
      'Localisation sélectionnée',
      `Vous avez sélectionné : ${location.name}. ${location.city ? `Ville : ${location.city}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const handleContinue = async () => {
    if (!city.trim()) {
      Alert.alert('Ville requise', 'Veuillez entrer le nom de votre ville.');
      return;
    }

    animateButton();
    setLoading(true);

    try {
      let coordinates = null;
      let validatedCity = city.trim();

      // Si on a une localisation sélectionnée depuis la carte, utiliser ses coordonnées
      if (selectedLocation) {
        coordinates = selectedLocation.coordinates;
        validatedCity = selectedLocation.city || selectedLocation.name;
      } else {
        // Sinon, valider que la ville existe en obtenant ses coordonnées
        const { getCityCoordinates } = require('../utils/data');
        coordinates = await getCityCoordinates(city.trim());

        if (!coordinates) {
          Alert.alert('Ville introuvable', 'Cette ville n\'a pas été trouvée. Veuillez vérifier l\'orthographe et réessayer.');
          return;
        }
      }

      // Si on vient du mode solo, aller directement au quiz sans repasser par ModeChoice
      if (mode === 'solo') {
        // Mode solo : naviguer directement vers le quiz
        navigation.navigate('Quiz', {
          city: validatedCity,
          coordinates: coordinates
        });
      } else if (mode === 'couple') {
        // Mode couple : naviguer vers l'écran Room
        navigation.navigate('Room', {
          city: validatedCity,
          coordinates: coordinates
        });
      } else if (returnTo === 'ModeChoice') {
        // Si on doit retourner à ModeChoice (autres cas), naviguer là-bas avec la ville
        navigation.navigate('ModeChoice', {
          city: validatedCity,
          coordinates: coordinates
        });
      } else {
        // Comportement par défaut : naviguer vers le quiz
        navigation.navigate('Quiz', {
          city: validatedCity,
          coordinates: coordinates
        });
      }
    } catch (error) {
      console.error('Error validating city:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la validation de la ville. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#ff6b9d', '#ffc0cb', '#ffffff']}
      locations={[0, 0.3, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header moderne avec icône */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={Math.min(20, Dimensions.get('window').width * 0.045)} color={theme.colors.textLight} />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <View style={styles.titleContainer}>
                  <Ionicons name="location" size={32} color={theme.colors.primary} style={styles.locationIcon} />
                  <Text style={styles.title}>Où êtes-vous ?</Text>
                </View>
                <Text style={styles.subtitle}>
                  Trouvez l'amour près de chez vous ✨
                </Text>
              </View>
            </View>

            {/* Section carte principale */}
            <View style={styles.mainContent}>
              <View style={styles.mapSection}>
                <View style={styles.mapContainer}>
                  <AppleMapView
                    selectedCity={city}
                    onLocationSelect={handleLocationSelect}
                    style={styles.mapView}
                  />
                </View>
              </View>
            </View>

            {/* Section du bas avec style Tinder - maintenant fixe en bas */}
            <View style={styles.bottomSection}>
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  style={[styles.continueButton, loading && styles.buttonDisabled]}
                  onPress={handleContinue}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={loading ? ['#cccccc', '#aaaaaa'] : [theme.colors.primary, '#ff8fab']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.continueButtonText}>Continuer</Text>
                        <Ionicons name="arrow-forward" size={Math.min(20, Dimensions.get('window').width * 0.05)} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.infoText}>
                💕 Sélectionnez votre zone et continuez
              </Text>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.max(theme.spacing.md, Dimensions.get('window').width * 0.04),
  },
  header: {
    paddingVertical: Math.max(theme.spacing.md, Dimensions.get('window').height * 0.025),
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.sm,
    top: Math.max(theme.spacing.md, Dimensions.get('window').height * 0.02),
    width: Math.min(40, Dimensions.get('window').width * 0.09),
    height: Math.min(40, Dimensions.get('window').width * 0.09),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: Math.min(20, Dimensions.get('window').width * 0.045),
    zIndex: 1,
    ...theme.shadows.lg,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(60, Dimensions.get('window').width * 0.15),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationIcon: {
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: Math.min(theme.fonts.sizes['4xl'], Dimensions.get('window').width * 0.08),
    fontWeight: '800' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(theme.fonts.sizes.lg, Dimensions.get('window').width * 0.04),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500' as any,
  },
  mainContent: {
    flex: 1,
    paddingBottom: theme.spacing.lg,
  },
  mapSection: {
    height: Dimensions.get('window').width < 380
      ? Math.min(Dimensions.get('window').height * 0.35, 300) // Smaller screens
      : Math.min(Dimensions.get('window').height * 0.4, 400), // Normal screens
    marginTop: theme.spacing.lg,
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  mapContainer: {
    flex: 1,
    borderRadius: Math.min(16, Dimensions.get('window').width * 0.04),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mapView: {
    flex: 1,
    borderRadius: Math.min(12, Dimensions.get('window').width * 0.03),
  },
  bottomSection: {
    paddingTop: Math.max(theme.spacing.md, Dimensions.get('window').height * 0.02),
    paddingBottom: Math.max(theme.spacing.xl, Dimensions.get('window').height * 0.04),
    gap: Math.max(theme.spacing.md, Dimensions.get('window').height * 0.015),
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopLeftRadius: Math.min(theme.borderRadius.xl, Dimensions.get('window').width * 0.05),
    borderTopRightRadius: Math.min(theme.borderRadius.xl, Dimensions.get('window').width * 0.05),
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  continueButton: {
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.lg,
    elevation: 8,
    width: Math.min(Dimensions.get('window').width - (theme.spacing.lg * 2), 350),
    alignSelf: 'center',
  },
  buttonGradient: {
    paddingVertical: Math.max(theme.spacing.lg, Dimensions.get('window').height * 0.02),
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: Math.min(theme.fonts.sizes.xl, Dimensions.get('window').width * 0.045),
    fontWeight: '700' as any,
    marginRight: theme.spacing.sm,
  },
  buttonIcon: {
    marginLeft: theme.spacing.xs,
  },
  infoText: {
    fontSize: Math.min(theme.fonts.sizes.md, Dimensions.get('window').width * 0.035),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Math.max(theme.spacing.lg, Dimensions.get('window').width * 0.04),
    fontWeight: '500' as any,
    opacity: 0.8,
  },
});

export default CityInputScreen;
