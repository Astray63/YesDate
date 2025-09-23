import { QuizQuestion } from '../types';
import { supabase } from '../services/supabase';

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

// Fonction pour générer des suggestions de dates avec Gemma 3 27B via OpenRouter
export const generateAIDateSuggestions = async (quizAnswers: { [key: string]: string }, userLocation?: { latitude: number; longitude: number; city?: string }): Promise<any[]> => {
  try {
    console.log('Generating AI date suggestions for quiz answers:', quizAnswers);
    console.log('User location:', userLocation);
    
    // Récupérer la clé API OpenRouter depuis les variables d'environnement
    const openRouterApiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    
    if (!openRouterApiKey) {
      console.warn('OpenRouter API key not found, using fallback suggestions');
      return getFallbackSuggestions(quizAnswers);
    }
    
    // Créer le prompt pour Gemma 3 27B
    const prompt = createAIPrompt(quizAnswers, userLocation);
    
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
            content: 'Tu es un expert en dating et en organisation de rendez-vous romantiques. Ta mission est de générer des suggestions de dates personnalisées basées sur les préférences des utilisateurs. Sois créatif, romantique et propose des idées réalistes et mémorables.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);
    
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
    
    console.log('Generated AI suggestions:', formattedSuggestions);
    return formattedSuggestions;
    
  } catch (error) {
    console.error('Error generating AI date suggestions:', error);
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
  
  const mood = moodMap[quizAnswers.mood] || 'non spécifié';
  const activity = activityMap[quizAnswers.activity_type] || 'non spécifié';
  const location = locationMap[quizAnswers.location] || 'non spécifié';
  const budget = budgetMap[quizAnswers.budget] || 'non spécifié';
  const duration = durationMap[quizAnswers.duration] || 'non spécifié';
  
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
export const getPersonalizedDateIdeas = async (quizAnswers: { [key: string]: string }, userCity?: string): Promise<any[]> => {
  try {
    // Obtenir les coordonnées de la ville si fournie
    let userLocation = null;
    if (userCity) {
      userLocation = await getCityCoordinates(userCity);
    }
    
    // Générer des suggestions IA avec la localisation
    const aiSuggestions = await generateAIDateSuggestions(quizAnswers, userLocation || undefined);
    
    // Récupérer quelques idées existantes qui correspondent aux préférences
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
    // Fallback vers les suggestions IA uniquement
    return await generateAIDateSuggestions(quizAnswers);
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
