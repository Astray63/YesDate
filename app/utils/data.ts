import { QuizQuestion } from '../types';
import { supabase } from '../services/supabase';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// IMPORTANT: Use direct access so Expo statically inlines EXPO_PUBLIC_* at build time.
// @ts-ignore - Replaced by Expo during bundling
const OPENROUTER_API_KEY_FROM_ENV: string | undefined = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

// Liste de villes prédéfinies pour l'autocomplétion
export const predefinedCities = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers',
  'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence', 'Saint-Denis', 'Le Mans', 'Clermont-Ferrand',
  'Brest', 'Limoges', 'Tours', 'Amiens', 'Metz', 'Besançon', 'Perpignan', 'Orléans',
  'Boulogne-Billancourt', 'Mulhouse', 'Rouen', 'Caen', 'Nancy', 'Saint-Denis', 'Argenteuil',
  'Montreuil', 'Roubaix', 'Dunkerque', 'Avignon', 'Vitry-sur-Seine', 'Pau', 'Aulnay-sous-Bois',
  'Cannes', 'Colombes', 'Asnières-sur-Seine', 'Rueil-Malmaison', 'Antibes', 'Saint-Maur-des-Fossés',
  'Champigny-sur-Marne', 'Aubervilliers', 'Béziers', 'La Rochelle', 'Calais', 'Cannes', 'Antibes'
];

// Fonction d'autocomplétion de villes
export const getCitySuggestions = (input: string): string[] => {
  if (!input || input.length < 2) return [];

  const searchTerm = input.toLowerCase().trim();
  return predefinedCities.filter(city =>
    city.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Limiter à 10 suggestions
};

// Fonction pour obtenir la ville actuelle via géolocalisation
export const getCurrentLocationCity = async (): Promise<string | null> => {
  try {
    // Demander les permissions de géolocalisation
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('Permission de géolocalisation refusée');
      return null;
    }

    // Obtenir la position actuelle
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    console.log('Position obtenue:', location.coords);

    // Faire du reverse geocoding pour obtenir le nom de la ville
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (reverseGeocode.length > 0) {
      const address = reverseGeocode[0];
      // Essayer différents champs pour obtenir le nom de la ville
      const cityName = address.city || address.region || address.subregion || address.district || address.streetNumber;

      if (cityName) {
        console.log('Ville détectée:', cityName);
        return cityName;
      }
    }

    console.log('Aucune ville trouvée dans les données de géocodage');
    return null;
  } catch (error) {
    console.error('Error getting current location:', error);

    // Gérer les différents types d'erreurs
    if (error instanceof Error) {
      if (error.message.includes('PERMISSION_DENIED')) {
        console.log('Permission de géolocalisation refusée');
      } else if (error.message.includes('TIMEOUT')) {
        console.log('Timeout de géolocalisation');
      } else if (error.message.includes('LOCATION_UNAVAILABLE')) {
        console.log('Service de localisation indisponible');
      }
    }

    return null;
  }
};

// Service d'images alternatif pour remplacer Unsplash
export const getImageUrl = (category: string, title: string, index: number = 0): string => {
  // Utiliser Lorem Picsum avec des dimensions cohérentes
  const width = 400;
  const height = 300;

  // Mapper les catégories vers des mots-clés pour Lorem Picsum
  const categoryKeywords: { [key: string]: string[] } = {
    'romantic': ['romance', 'couple', 'love', 'heart', 'rose', 'candle', 'dinner'],
    'fun': ['fun', 'party', 'games', 'laugh', 'friends', 'colorful', 'bright'],
    'relaxed': ['nature', 'peaceful', 'calm', 'zen', 'spa', 'meditation', 'sunset'],
    'adventurous': ['adventure', 'mountain', 'hiking', 'travel', 'explore', 'outdoor'],
    'food': ['food', 'restaurant', 'cooking', 'dining', 'wine', 'pasta', 'pizza'],
    'nature': ['nature', 'forest', 'trees', 'park', 'green', 'landscape', 'outdoor'],
    'culture': ['culture', 'art', 'museum', 'music', 'theater', 'history', 'architecture'],
    'sport': ['sport', 'fitness', 'gym', 'running', 'tennis', 'football', 'basketball']
  };

  const keywords = categoryKeywords[category] || ['dating', 'couple', 'romance'];
  const keyword = keywords[index % keywords.length];

  // Retourner une URL Lorem Picsum avec le mot-clé
  return `https://picsum.photos/seed/${keyword}-${index}/${width}/${height}`;
};

// URL d'image de fallback en ligne (utilisée si l'API échoue)
export const getFallbackImageUrl = (category: string): string => {
  // Utiliser une URL d'image de fallback en ligne avec un seed fixe
  return `https://picsum.photos/seed/dating-app-fallback-${category}/400/300`;
};

// Récupérer les questions de quiz (en dur comme demandé)
export const getQuizQuestions = async (): Promise<QuizQuestion[]> => {
  // Retourner les questions en dur au lieu de les charger depuis la base de données
  return [
    {
      id: 'mood',
      question: 'Quelle ambiance recherchez-vous ?',
      category: 'mood',
      options: [
        { id: 'mood_romantic', label: 'Romantique', emoji: '💕', value: 'romantic' },
        { id: 'mood_fun', label: 'Amusant', emoji: '🎉', value: 'fun' },
        { id: 'mood_relaxed', label: 'Détendu', emoji: '😌', value: 'relaxed' },
        { id: 'mood_adventurous', label: 'Aventureux', emoji: '🗺️', value: 'adventurous' },
      ],
    },
    {
      id: 'activity_type',
      question: 'Quel type d\'activité préférez-vous ?',
      category: 'activity_type',
      options: [
        { id: 'activity_food', label: 'Restauration', emoji: '🍽️', value: 'food' },
        { id: 'activity_nature', label: 'Nature', emoji: '🌲', value: 'nature' },
        { id: 'activity_culture', label: 'Culture', emoji: '🎭', value: 'culture' },
        { id: 'activity_sport', label: 'Sport', emoji: '⚽', value: 'sport' },
      ],
    },
    {
      id: 'location',
      question: 'Où souhaitez-vous aller ?',
      category: 'location',
      options: [
        { id: 'location_indoor', label: 'Intérieur', emoji: '🏠', value: 'indoor' },
        { id: 'location_outdoor', label: 'Extérieur', emoji: '🌳', value: 'outdoor' },
        { id: 'location_city', label: 'En ville', emoji: '🏙️', value: 'city' },
        { id: 'location_countryside', label: 'À la campagne', emoji: '🌾', value: 'countryside' },
      ],
    },
    {
      id: 'budget',
      question: 'Quel est votre budget idéal ?',
      category: 'budget',
      options: [
        { id: 'budget_low', label: 'Économique', emoji: '💰', value: 'low' },
        { id: 'budget_moderate', label: 'Modéré', emoji: '💵', value: 'moderate' },
        { id: 'budget_high', label: 'Élevé', emoji: '💸', value: 'high' },
        { id: 'budget_luxury', label: 'Luxe', emoji: '💎', value: 'luxury' },
      ],
    },
    {
      id: 'duration',
      question: 'Combien de temps avez-vous ?',
      category: 'duration',
      options: [
        { id: 'duration_short', label: '1-2 heures', emoji: '⏱️', value: 'short' },
        { id: 'duration_medium', label: '3-4 heures', emoji: '⏰', value: 'medium' },
        { id: 'duration_long', label: 'Journée entière', emoji: '🌅', value: 'long' },
        { id: 'duration_weekend', label: 'Weekend', emoji: '📅', value: 'weekend' },
      ],
    },
    {
      id: 'mobility_radius',
      question: 'À combien de km maximum êtes-vous mobile ?',
      category: 'mobility_radius',
      options: [
        { id: 'radius_5km', label: '5 km', emoji: '🚶', value: '5km' },
        { id: 'radius_10km', label: '10 km', emoji: '🚲', value: '10km' },
        { id: 'radius_25km', label: '25 km', emoji: '🚗', value: '25km' },
        { id: 'radius_50km', label: '50 km', emoji: '🚙', value: '50km' },
        { id: 'radius_unlimited', label: 'Illimité', emoji: '✈️', value: 'unlimited' },
      ],
    },
  ];
};

export const getDateIdeas = async (filters?: any): Promise<any[]> => {
  // Retourner un tableau vide car la table date_ideas n'existe pas
  // Les suggestions viennent uniquement de l'IA
  return [];
};

export const getAchievements = async (userId?: string): Promise<any[]> => {
  try {
    let query = supabase
      .from('achievements')
      .select('*');
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    }
    
    const { data, error } = await query.order('points', { ascending: false });
    
    if (error) {
      console.error('Error fetching achievements:', error);
      // Return sample data as fallback
      return sampleAchievements;
    }
    
    // If no data from database, return sample data
    return (data && data.length > 0) ? data : sampleAchievements;
  } catch (error) {
    console.error('Error in getAchievements:', error);
    return sampleAchievements;
  }
};

export const getCommunityDates = async (type: 'most_loved' | 'trending' = 'most_loved'): Promise<any[]> => {
  // Retourner des données de démonstration car la table community_dates n'existe pas
  const demoData = [
    {
      id: 'demo_date_1',
      title: 'Pique-nique au parc',
      description: 'Profitez d\'un pique-nique romantique dans un beau parc.',
      category: 'relaxed',
      type: 'most_loved',
      likes_count: 245,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo_date_2',
      title: 'Cours de cuisine italienne',
      description: 'Apprenez à préparer des pâtes fraîches ensemble.',
      category: 'food',
      type: 'most_loved',
      likes_count: 189,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo_date_3',
      title: 'Soirée jeux de société',
      description: 'Découvrez de nouveaux jeux de société à deux.',
      category: 'fun',
      type: 'trending',
      likes_count: 156,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo_date_4',
      title: 'Randonnée au coucher du soleil',
      description: 'Une belle randonnée avec vue imprenable sur le coucher du soleil.',
      category: 'adventurous',
      type: 'trending',
      likes_count: 134,
      created_at: new Date().toISOString(),
    },
  ];

  // Ajouter les URLs d'images et filtrer par type
  const demoDataWithImages = demoData.map((item, index) => ({
    ...item,
    image_url: getImageUrl(item.category, item.title, index),
  }));

  return demoDataWithImages.filter(item => item.type === type);
};

export const getCommunityStats = async (): Promise<any> => {
  // Retourner des statistiques de démonstration car la table community_stats n'existe pas
  return {
    total_dates: 1247,
    success_rate: 87,
    active_couples: 342,
    average_rating: 4.6,
    weekly_growth: 12,
    popular_categories: [
      { name: 'Romantique', count: 423 },
      { name: 'Aventureux', count: 312 },
      { name: 'Détendu', count: 287 },
      { name: 'Culturel', count: 225 }
    ]
  };
};

// Fonction pour obtenir les coordonnées d'une ville (géocodage)
export const getCityCoordinates = async (cityName: string): Promise<{ latitude: number; longitude: number; city: string } | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city: result.display_name.split(',')[0] // Utiliser le premier élément comme nom de ville
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting city coordinates:', error);
    return null;
  }
};

// Types pour les callbacks de progression
export type ProgressCallback = (step: string, progress: number) => void;

export type LoadingSteps =
  | 'analyzing_preferences'
  | 'researching_locations'
  | 'generating_suggestions'
  | 'finalizing_recommendations'
  | 'processing_response'
  | 'fallback_mode';

// Fonction pour générer des suggestions de dates avec Gemma 3 27B via OpenRouter
export const generateAIDateSuggestions = async (
  quizAnswers: { [key: string]: string },
  userLocation?: { latitude: number; longitude: number; city?: string },
  onProgress?: ProgressCallback
): Promise<any[]> => {
  try {
    console.log('Generating AI date suggestions for quiz answers:', quizAnswers);
    console.log('User location:', userLocation);

    // Étape 1: Analyse des préférences
    onProgress?.('Analyzing your preferences...', 10);

    // Récupérer la clé API OpenRouter depuis les variables d'environnement Expo/Metro
    const openRouterApiKey =
      OPENROUTER_API_KEY_FROM_ENV ||
      Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENROUTER_API_KEY ||
      (Constants as any).manifest2?.extra?.EXPO_PUBLIC_OPENROUTER_API_KEY ||
      (Constants as any).manifest?.extra?.EXPO_PUBLIC_OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      console.warn('OpenRouter API key not found, using fallback suggestions');
      onProgress?.('Using fallback suggestions...', 20);
      await new Promise(resolve => setTimeout(resolve, 500)); // Petite pause pour l'UX
      return getFallbackSuggestions(quizAnswers);
    }

    if (__DEV__) {
      const masked =
        typeof openRouterApiKey === 'string'
          ? `${openRouterApiKey.slice(0, 4)}...${openRouterApiKey.slice(-4)}`
          : 'none';
      console.log('OpenRouter API key loaded:', masked);
    }

    // Étape 2: Recherche de localisation
    if (userLocation) {
      onProgress?.('Researching locations near you...', 30);
    } else {
      onProgress?.('Preparing personalized suggestions...', 30);
    }

    // Étape 3: Création du prompt
    onProgress?.('Creating personalized prompt...', 40);
    const prompt = createAIPrompt(quizAnswers, userLocation);

    // Étape 4: Appel à l'API IA
    onProgress?.('Generating AI suggestions...', 60);

    // Log debug pour tracer le prompt envoyé à l'IA
    console.log('=== DEBUG: Prompt sent to Gemma 3 27B ===');
    console.log('System prompt:', `Tu es YesDate AI, expert en création de rendez-vous personnalisés.

RÈGLE LA PLUS IMPORTANTE : L'AMBIANCE EST PRIMORDIALE
- Si l'utilisateur demande "romantic" → TOUTES les suggestions DOIVENT être de catégorie "romantic"
- Si l'utilisateur demande "relaxed" → TOUTES les suggestions DOIVENT être de catégorie "relaxed"
- Si l'utilisateur demande "fun" → TOUTES les suggestions DOIVENT être de catégorie "fun"
- Si l'utilisateur demande "adventurous" → TOUTES les suggestions DOIVENT être de catégorie "adventurous"

RÈGLES DE BUDGET À RESPECTER STRICTEMENT :
- low : Activités gratuites ou < 20€
- moderate : Activités entre 20€ et 100€
- high : Activités entre 100€ et 300€
- luxury : Activités > 300€

FORMAT JSON OBLIGATOIRE - RESPECTE EXACTEMENT :
{
  "suggestions": [
    {
      "title": "Titre accrocheur",
      "description": "Description qui respecte l'ambiance demandée",
      "duration": "2h",
      "category": "romantic|fun|relaxed|adventurous",
      "cost": "low|moderate|high|luxury",
      "location_type": "indoor|outdoor|city|countryside"
    }
  ]
}`);
    console.log('User prompt:', prompt);
    console.log('Quiz answers:', quizAnswers);
    console.log('=== END DEBUG ===');

    // Appeler l'API OpenRouter avec Gemma 3 27B
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://yesdate.app',
        'X-Title': 'YesDate Dating App',
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it',
        messages: [
          {
            role: 'system',
            content: `Tu es YesDate AI, expert en création de rendez-vous personnalisés.

RÈGLE LA PLUS IMPORTANTE : L'AMBIANCE EST PRIMORDIALE
- Si l'utilisateur demande "romantic" → TOUTES les suggestions DOIVENT être de catégorie "romantic"
- Si l'utilisateur demande "relaxed" → TOUTES les suggestions DOIVENT être de catégorie "relaxed"
- Si l'utilisateur demande "fun" → TOUTES les suggestions DOIVENT être de catégorie "fun"
- Si l'utilisateur demande "adventurous" → TOUTES les suggestions DOIVENT être de catégorie "adventurous"

RÈGLES DE BUDGET À RESPECTER STRICTEMENT :
- low : Activités gratuites ou < 20€
- moderate : Activités entre 20€ et 100€
- high : Activités entre 100€ et 300€
- luxury : Activités > 300€

FORMAT JSON OBLIGATOIRE - RESPECTE EXACTEMENT :
{
"suggestions": [
  {
    "title": "Titre accrocheur",
    "description": "Description qui respecte l'ambiance demandée",
    "duration": "2h",
    "category": "romantic|fun|relaxed|adventurous",
    "cost": "low|moderate|high|luxury",
    "location_type": "indoor|outdoor|city|countryside"
  }
]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      // Si l'API retourne une erreur 401 ou autre, utiliser le fallback immédiatement
      console.warn(`OpenRouter API error: ${response.status} ${response.statusText}, using fallback`);
      console.warn('This usually means the API key is invalid, expired, or has insufficient credits');

      // Log additional debugging info
      if (response.status === 401) {
        console.warn('401 Unauthorized: Please check your OpenRouter API key in .env.local');
        console.warn('You can get a new API key from: https://openrouter.ai/keys');
      } else if (response.status === 429) {
        console.warn('429 Rate Limited: Too many requests, please try again later');
      } else if (response.status >= 500) {
        console.warn('5xx Server Error: OpenRouter service may be temporarily unavailable');
      }

      onProgress?.('Using smart fallback suggestions...', 70);
      await new Promise(resolve => setTimeout(resolve, 300));
      return getFallbackSuggestions(quizAnswers);
    }

    // Étape 5: Traitement de la réponse
    onProgress?.('Processing AI response...', 80);
    const data = await response.json();

    // Log debug pour la réponse brute de l'IA
    console.log('=== DEBUG: Raw AI Response ===');
    console.log('Full response:', JSON.stringify(data, null, 2));
    console.log('Message content:', data.choices?.[0]?.message?.content);
    console.log('=== END DEBUG ===');

    // Vérifier si la réponse contient les données attendues
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.warn('Invalid AI response structure:', data);
      onProgress?.('Using fallback due to invalid response...', 70);
      await new Promise(resolve => setTimeout(resolve, 300));
      return getFallbackSuggestions(quizAnswers);
    }

    // Essayer de parser la réponse JSON
    let aiResponse;
    try {
      aiResponse = JSON.parse(data.choices[0].message.content);

      // Log debug pour la réponse parsée
      console.log('=== DEBUG: Parsed AI Response ===');
      console.log('Parsed response:', JSON.stringify(aiResponse, null, 2));

      // Vérifier si l'ambiance est respectée
      const requestedMood = quizAnswers.mood;
      const suggestions = aiResponse.suggestions || [];
      const moodMatches = suggestions.filter((s: any) => s.category === requestedMood).length;
      const totalSuggestions = suggestions.length;

      console.log(`=== DEBUG: Mood Compliance Check ===`);
      console.log(`Requested mood: ${requestedMood}`);
      console.log(`Suggestions with matching mood: ${moodMatches}/${totalSuggestions}`);
      console.log(`Compliance rate: ${totalSuggestions > 0 ? Math.round((moodMatches/totalSuggestions)*100) : 0}%`);

      if (moodMatches !== totalSuggestions) {
        console.warn(`⚠️ WARNING: AI did not respect the requested mood! Expected all ${totalSuggestions} suggestions to have category "${requestedMood}"`);
        console.warn('This indicates the prompt needs to be more strict about mood enforcement');
      } else {
        console.log(`✅ SUCCESS: AI correctly respected the requested mood in all suggestions`);
      }
      console.log('=== END DEBUG ===');

    } catch (parseError) {
      console.warn('Failed to parse AI response:', data.choices[0].message.content);
      console.warn('Parse error:', parseError);
      onProgress?.('Using fallback due to invalid JSON...', 70);
      await new Promise(resolve => setTimeout(resolve, 300));
      return getFallbackSuggestions(quizAnswers);
    }

    // Étape 6: Finalisation
    onProgress?.('Finalizing recommendations...', 90);

    // Formater les suggestions de l'IA
    const formattedSuggestions = aiResponse.suggestions.map((suggestion: any, index: number) => ({
      id: `ai_suggestion_${index + 1}`,
      title: suggestion.title,
      description: suggestion.description,
      image_url: getImageUrl(suggestion.category, suggestion.title, index),
      duration: suggestion.duration,
      category: suggestion.category,
      cost: suggestion.cost,
      location_type: suggestion.location_type,
      area: suggestion.area || null, // Ajouter le champ pour la zone/localisation
      generated_by: 'ai' as const,
      created_at: new Date().toISOString(),
      ai_generated: true,
      quiz_answers_used: quizAnswers,
      user_location: userLocation, // Stocker la localisation utilisée
    }));

    // Étape finale
    onProgress?.('Complete! Loading your personalized date ideas...', 100);

    console.log('Generated AI suggestions:', formattedSuggestions);
    return formattedSuggestions;

  } catch (error) {
    console.error('Error generating AI date suggestions:', error);

    // Mode fallback avec progression
    onProgress?.('Switching to fallback mode...', 50);
    await new Promise(resolve => setTimeout(resolve, 300)); // Petite pause

    // Retourner des suggestions de base en cas d'erreur
    return getFallbackSuggestions(quizAnswers);
  }
};

// Fonction pour créer le prompt personnalisé pour l'IA
const createAIPrompt = (quizAnswers: { [key: string]: string }, userLocation?: { latitude: number; longitude: number; city?: string }): string => {
  // Mapper les réponses du quiz vers des descriptions compréhensibles
  const moodMap: { [key: string]: string } = {
    'romantic': 'romantique et intime',
    'fun': 'amusant et divertissant',
    'relaxed': 'détendu et calme',
    'adventurous': 'aventureux et excitant'
  };
  
  const activityMap: { [key: string]: string } = {
    'food': 'restauration et gastronomie',
    'nature': 'nature et activités en plein air',
    'culture': 'culture et découvertes',
    'sport': 'sport et activités physiques'
  };
  
  const locationMap: { [key: string]: string } = {
    'indoor': 'en intérieur',
    'outdoor': 'en extérieur',
    'city': 'en milieu urbain',
    'countryside': 'à la campagne'
  };
  
  const budgetMap: { [key: string]: string } = {
    'low': 'économique',
    'moderate': 'budget modéré',
    'high': 'haut de gamme',
    'luxury': 'luxe'
  };
  
  const durationMap: { [key: string]: string } = {
    'short': '1-2 heures',
    'medium': '3-4 heures',
    'long': 'journée entière',
    'weekend': 'weekend'
  };
  
  const radiusMap: { [key: string]: string } = {
    '5km': '5 km maximum',
    '10km': '10 km maximum',
    '25km': '25 km maximum',
    '50km': '50 km maximum',
    'unlimited': 'rayon illimité'
  };
  
  const mood = moodMap[quizAnswers.mood] || 'non spécifié';
  const activity = activityMap[quizAnswers.activity_type] || 'non spécifié';
  const location = locationMap[quizAnswers.location] || 'non spécifié';
  const budget = budgetMap[quizAnswers.budget] || 'non spécifié';
  const duration = durationMap[quizAnswers.duration] || 'non spécifié';
  const mobilityRadius = radiusMap[quizAnswers.mobility_radius] || 'non spécifié';
  
  // Ajouter les informations de géolocalisation si disponibles
  let locationInfo = '';
  if (userLocation) {
    if (userLocation.city) {
      locationInfo = `- Localisation de l'utilisateur : ${userLocation.city} (coordonnées : ${userLocation.latitude}, ${userLocation.longitude})`;
    } else {
      locationInfo = `- Localisation de l'utilisateur : coordonnées GPS ${userLocation.latitude}, ${userLocation.longitude}`;
    }
  }
  
  return `
Basé sur les préférences suivantes d'un utilisateur pour un rendez-vous :
- Ambiance recherchée : ${mood}
- Type d'activité préféré : ${activity}
- Lieu souhaité : ${location}
- Budget : ${budget}
- Durée disponible : ${duration}
- Rayon de mobilité : ${mobilityRadius}
${locationInfo}

IMPORTANT : Génère 5 suggestions de dates personnalisées et créatives ${userLocation ? 'qui se trouvent À PROXIMITÉ de la localisation de l\'utilisateur' : ''}. Pour chaque suggestion, fournis :
1. Un titre accrocheur
2. Une description détaillée et romantique
3. La durée approximative
4. La catégorie (romantique, amusant, détendu, aventureux)
5. Le niveau de coût (low, moderate, high, luxury)
6. Le type de lieu (city, countryside, indoor, outdoor)
${userLocation ? '7. Une indication approximative de la zone ou du quartier où cette activité peut être trouvée près de la localisation de l\'utilisateur' : ''}

Format de réponse JSON :
{
  "suggestions": [
    {
      "title": "Titre de la date",
      "description": "Description détaillée",
      "duration": "2h",
      "category": "romantique",
      "cost": "moderate",
      "location_type": "city"
      ${userLocation ? ',\n      "area": "Quartier spécifique ou zone proche"' : ''}
    }
  ]
}
`;
};

// Fonction de fallback pour les suggestions de base
const getFallbackSuggestions = (quizAnswers: { [key: string]: string }): any[] => {
  const suggestions = [
    {
      title: 'Dîner romantique',
      description: 'Profitez d\'un dîner intime dans un restaurant de votre choix.',
      duration: '2h',
      category: 'romantic',
      cost: 'moderate',
      location_type: 'city',
    },
    {
      title: 'Promenade dans le parc',
      description: 'Détendez-vous en vous promenant main dans la main.',
      duration: '1h',
      category: 'relaxed',
      cost: 'low',
      location_type: 'city',
    },
    {
      title: 'Soirée cinéma',
      description: 'Regardez un bon film ensemble dans une salle confortable.',
      duration: '3h',
      category: 'fun',
      cost: 'low',
      location_type: 'city',
    }
  ];

  // Ajouter des métadonnées et formater les suggestions
  return suggestions.map((suggestion: any, index: number) => ({
    id: `ai_suggestion_${index + 1}`,
    title: suggestion.title,
    description: suggestion.description,
    image_url: getImageUrl(suggestion.category, suggestion.title, index),
    duration: suggestion.duration,
    category: suggestion.category,
    cost: suggestion.cost,
    location_type: suggestion.location_type,
    generated_by: 'ai' as const,
    created_at: new Date().toISOString(),
    ai_generated: true,
    quiz_answers_used: quizAnswers,
  }));
};

// Fonction combinée qui mélange les suggestions IA et les idées existantes
export const getPersonalizedDateIdeas = async (
  quizAnswers: { [key: string]: string },
  userCity?: string,
  onProgress?: ProgressCallback
): Promise<any[]> => {
  try {
    // Obtenir les coordonnées de la ville si fournie
    onProgress?.('Getting your location...', 5);
    let userLocation = null;
    if (userCity) {
      userLocation = await getCityCoordinates(userCity);
    }

    // Générer des suggestions IA avec la localisation et callback de progression
    const aiSuggestions = await generateAIDateSuggestions(quizAnswers, userLocation || undefined, onProgress);

    // Récupérer quelques idées existantes qui correspondent aux préférences
    onProgress?.('Combining with existing ideas...', 95);
    const existingIdeas = await getDateIdeas({
      category: quizAnswers.activity_type,
      cost: quizAnswers.budget,
      location_type: quizAnswers.location,
    });

    // Limiter les idées existantes pour ne pas surcharger
    const limitedExistingIdeas = existingIdeas.slice(0, 3);

    // Combiner les suggestions IA en premier, puis les idées existantes
    const combinedIdeas = [...aiSuggestions, ...limitedExistingIdeas];

    return combinedIdeas;

  } catch (error) {
    console.error('Error getting personalized date ideas:', error);
    // Fallback vers les suggestions IA uniquement avec callback
    return await generateAIDateSuggestions(quizAnswers, undefined, onProgress);
  }
};

// Sample achievements data for development/fallback
export const sampleAchievements = [
  {
    id: '1',
    title: 'Premier Rendez-vous',
    description: 'Complétez votre premier swipe de rendez-vous',
    image_url: getImageUrl('romantic', 'Premier Rendez-vous', 0),
    points: 10,
    is_public: true,
    category: 'dates',
    progress: 100,
    max_progress: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Explorateur',
    description: 'Swipez sur 10 idées de rendez-vous différentes',
    image_url: getImageUrl('adventurous', 'Explorateur', 1),
    points: 25,
    is_public: true,
    category: 'exploration',
    progress: 5,
    max_progress: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Match Parfait',
    description: 'Créez votre premier match de rendez-vous',
    image_url: getImageUrl('romantic', 'Match Parfait', 2),
    points: 50,
    is_public: true,
    category: 'matches',
    progress: 0,
    max_progress: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
