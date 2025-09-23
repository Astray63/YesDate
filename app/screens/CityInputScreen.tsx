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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { getCitySuggestions, getCurrentLocationCity } from '../utils/data';

type CityInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CityInput'>;

const CityInputScreen: React.FC = () => {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigation = useNavigation<CityInputScreenNavigationProp>();

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

  // Fonction pour demander la géolocalisation
  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
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
                  Alert.alert('Ville détectée', `Nous avons détecté que vous êtes à ${currentCity}. Vous pouvez modifier cette ville si nécessaire.`);
                } else {
                  Alert.alert(
                    'Localisation indisponible',
                    'Nous n\'avons pas pu détecter votre ville automatiquement. Vous pouvez la saisir manuellement.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Erreur de localisation',
                  'Une erreur est survenue lors de la détection de votre position. Vous pouvez saisir votre ville manuellement.',
                  [{ text: 'OK' }]
                );
              } finally {
                setLocationLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setLocationLoading(false);
      Alert.alert(
        'Erreur',
        'Impossible d\'accéder à la géolocalisation. Vous pouvez saisir votre ville manuellement.',
        [{ text: 'OK' }]
      );
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

  // Fonction pour sélectionner une suggestion
  const selectSuggestion = (selectedCity: string) => {
    setCity(selectedCity);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleContinue = async () => {
    if (!city.trim()) {
      Alert.alert('Ville requise', 'Veuillez entrer le nom de votre ville.');
      return;
    }

    setLoading(true);
    
    try {
      // Valider que la ville existe en obtenant ses coordonnées
      const { getCityCoordinates } = require('../utils/data');
      const coordinates = await getCityCoordinates(city.trim());
      
      if (!coordinates) {
        Alert.alert('Ville introuvable', 'Cette ville n\'a pas été trouvée. Veuillez vérifier l\'orthographe et réessayer.');
        return;
      }

      // Naviguer vers le quiz avec la ville
      navigation.navigate('Quiz', { city: city.trim() });
    } catch (error) {
      console.error('Error validating city:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la validation de la ville. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue sur YesDate !</Text>
          <Text style={styles.subtitle}>
            Pour vous proposer les meilleures dates près de chez vous,{'\n'}
            dites-nous dans quelle ville vous vous trouvez.
          </Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Votre ville</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={requestLocationPermission}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#E91E63" />
                ) : (
                  <Text style={styles.locationButtonText}>📍 Détecter automatiquement</Text>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={handleCityChange}
              placeholder="Ex: Paris, Lyon, Marseille..."
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              onFocus={() => {
                if (city.length >= 2) {
                  const citySuggestions = getCitySuggestions(city);
                  setSuggestions(citySuggestions);
                  setShowSuggestions(citySuggestions.length > 0);
                }
              }}
            />

            {/* Liste d'autocomplétion */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item)}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.suggestionsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Continuer</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Nous utiliserons votre ville pour vous trouver des dates à proximité.
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  button: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#F0F0F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  locationButtonText: {
    fontSize: 12,
    color: '#E91E63',
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CityInputScreen;
