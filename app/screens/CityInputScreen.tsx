import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type CityInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CityInput'>;

const CityInputScreen: React.FC = () => {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<CityInputScreenNavigationProp>();

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
            <Text style={styles.label}>Votre ville</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ex: Paris, Lyon, Marseille..."
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
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
});

export default CityInputScreen;
