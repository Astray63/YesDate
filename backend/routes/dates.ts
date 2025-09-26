import { Router } from 'express';
import { geocodeCity, fetchPlacesByRadius, fetchPlaceDetails } from '../services/opentripmap';
import { fetchEventsByLocation, searchEventsByCity, calculateDistance } from '../services/openagenda';
import { generateDateIdeasWithAI, generateRoomDateIdeasWithAI } from '../services/openrouter';

const router = Router();

interface QuizAnswers {
  mood?: string;
  activity_type?: string;
  location?: string; // city name
  budget?: string;
  duration?: string;
  preferences?: any;
}

// Fonction pour calculer le score de pertinence d'une suggestion
function calculateRelevanceScore(suggestion: any, userContext: QuizAnswers, originalSource: any): number {
  let score = 50; // Score de base
  
  // Facteur de distance (plus c'est proche, mieux c'est)
  if (originalSource?.distance) {
    if (originalSource.distance < 2000) score += 20; // Moins de 2km
    else if (originalSource.distance < 5000) score += 15; // Moins de 5km
    else if (originalSource.distance < 10000) score += 10; // Moins de 10km
  }
  
  // Facteur de correspondance avec le mood
  if (userContext.mood && suggestion.category) {
    const mood = String(userContext.mood).toLowerCase();
    const category = String(suggestion.category).toLowerCase();
    
    const moodMatches: Record<string, string[]> = {
      'romantique': ['romantic', 'food', 'relax'],
      'romantic': ['romantic', 'food', 'relax'],
      'detendu': ['relax', 'food', 'culture'],
      'ambiance detendu': ['relax', 'food', 'culture'],
      'aventure': ['active', 'outdoor', 'surprise'],
      'adventure': ['active', 'outdoor', 'surprise'],
      'calme': ['relax', 'culture'],
      'quiet': ['relax', 'culture']
    };
    
    if (moodMatches[mood]?.includes(category)) {
      score += 25;
    }
  }
  
  // Facteur de budget
  if (userContext.budget && suggestion.cost_level !== undefined) {
    const budget = String(userContext.budget).toLowerCase();
    const costLevel = suggestion.cost_level;
    
    if (budget.includes('bas') || budget.includes('low') || budget.includes('gratuit')) {
      if (costLevel === 0 || costLevel === 1) score += 15;
    } else if (budget.includes('moyen') || budget.includes('medium')) {
      if (costLevel === 1 || costLevel === 2) score += 15;
    } else if (budget.includes('élevé') || budget.includes('high')) {
      if (costLevel === 2 || costLevel === 3) score += 15;
    }
  }
  
  // Facteur de durée
  if (userContext.duration && suggestion.duration_minutes) {
    const duration = String(userContext.duration).toLowerCase();
    const durationMinutes = suggestion.duration_minutes;
    
    if (duration.includes('court') || duration.includes('short')) {
      if (durationMinutes <= 60) score += 10;
    } else if (duration.includes('moyen') || duration.includes('medium')) {
      if (durationMinutes > 60 && durationMinutes <= 180) score += 10;
    } else if (duration.includes('long') || duration.includes('long')) {
      if (durationMinutes > 180) score += 10;
    }
  }
  
  // Facteur de type d'activité
  if (userContext.activity_type && suggestion.category) {
    const activityType = String(userContext.activity_type).toLowerCase();
    const category = String(suggestion.category).toLowerCase();
    
    if (activityType.includes(category) || category.includes(activityType)) {
      score += 15;
    }
  }
  
  // Bonus pour les événements temporaires (plus exclusifs)
  if (originalSource?.type === 'event') {
    score += 5;
  }
  
  return Math.min(score, 100); // Limiter le score à 100
}

// Minimal /generate implementation using the new services
router.post('/generate', async (req: any, res: any) => {
  try {
    const quizAnswers: QuizAnswers = req.body?.quizAnswers || {};
    const city = quizAnswers.location || 'Paris';

    // geocode + fetch places
    let places: any[] = [];
    let events: any[] = [];
    try {
      const { lat, lon } = await geocodeCity(city);
      
      // Fetch places from OpenTripMap
      const placesList = await fetchPlacesByRadius(lat, lon, 8000, 20);
      places = Array.isArray(placesList) ? placesList : [];
      
      // Fetch events from OpenAgenda
      const eventsList = await fetchEventsByLocation(lat, lon, 10000, 10);
      events = Array.isArray(eventsList) ? eventsList : [];
      
      // Combine places and events, adding distance information
      const combinedData = [
        ...places.map(place => ({
          ...place,
          type: 'place',
          distance: place.lat && place.lon ? calculateDistance(lat, lon, place.lat, place.lon) : null
        })),
        ...events.map(event => ({
          ...event,
          type: 'event',
          eventSourceId: event.uid,
          distance: event.location?.latitude && event.location?.longitude ? 
            calculateDistance(lat, lon, event.location.latitude, event.location.longitude) : null
        }))
      ];
      
      // Sort by distance and filter by relevance (within 15km)
      places = combinedData
        .filter(item => item.distance === null || item.distance <= 15000)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 30);
        
    } catch (_) {
      places = [];
    }

    // call AI
    let suggestions: any[] = [];
    try {
      suggestions = await generateDateIdeasWithAI(places, quizAnswers);
    } catch (_) {
      suggestions = [{ id: 'mock-1', title: 'Promenade', description: 'Balade agréable', generated_by: 'mock' }];
    }
    
    // Post-process: enhance suggestions with distance and relevance info
    suggestions = suggestions.map(suggestion => {
      const originalSource = places.find(p => 
        (suggestion.eventSourceId && p.eventSourceId === suggestion.eventSourceId) ||
        (suggestion.coordinates && p.lat === suggestion.coordinates.lat && p.lon === suggestion.coordinates.lon)
      );
      
      return {
        ...suggestion,
        distance: originalSource?.distance || null,
        relevance_score: calculateRelevanceScore(suggestion, quizAnswers, originalSource)
      };
    });

    // validate places
    for (const s of suggestions) {
      if (s?.eventSourceId) {
        try {
          s._place = await fetchPlaceDetails(s.eventSourceId);
          s._validated = true;
        } catch (_) {
          s._validated = false;
        }
      }
    }

    // Post-process: enforce mood -> allowed categories mapping
    const mood: string | undefined = (quizAnswers as any).mood;
    const moodMap: Record<string, string[]> = {
      'ambiance detendu': ['relax', 'food', 'culture'],
      'detendu': ['relax', 'food', 'culture'],
      'romantique': ['romantic', 'food', 'relax'],
      'romantic': ['romantic', 'food', 'relax'],
      'aventure': ['active', 'outdoor', 'surprise'],
      'calme': ['relax', 'culture'],
    };

    let filtered = suggestions;
    let relaxed: any[] = [];
    if (mood) {
      const key = String(mood).toLowerCase();
      const allowed = moodMap[key];
      if (allowed && allowed.length > 0) {
        filtered = [];
        for (const s of suggestions) {
          const cat = (s.category || '').toString().toLowerCase();
          if (allowed.includes(cat)) filtered.push(s);
          else relaxed.push(s);
        }
      }
    }

    return res.json({ success: true, dates: filtered, relaxed_suggestions: relaxed });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'server error' });
  }
});

// New endpoint for room-based date generation that waits for both partners' responses
router.post('/generate-room', async (req: any, res: any) => {
  try {
    const { user1Answers, user2Answers, roomId } = req.body;
    
    if (!user1Answers || !user2Answers || !roomId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: user1Answers, user2Answers, roomId' 
      });
    }

    const city = user1Answers.location || user2Answers.location || 'Paris';

    // geocode + fetch places
    let places: any[] = [];
    try {
      const { lat, lon } = await geocodeCity(city);
      const list = await fetchPlacesByRadius(lat, lon, 8000, 30);
      places = Array.isArray(list) ? list : [];
    } catch (_) {
      places = [];
    }

    // Create couple context for AI
    const coupleContext = {
      user1: user1Answers,
      user2: user2Answers,
      common: {
        city,
        roomId
      }
    };

    // call AI with room-specific prompt
    let suggestions: any[] = [];
    try {
      suggestions = await generateRoomDateIdeasWithAI(places, coupleContext);
    } catch (_) {
      suggestions = [{ 
        id: 'room-mock-1', 
        title: 'Activité pour couple', 
        description: 'Parfaite pour renforcer votre complicité',
        compatibility_score: 85,
        generated_by: 'room-mock' 
      }];
    }

    // validate places
    for (const s of suggestions) {
      if (s?.eventSourceId) {
        try {
          s._place = await fetchPlaceDetails(s.eventSourceId);
          s._validated = true;
        } catch (_) {
          s._validated = false;
        }
      }
    }

    // Filter suggestions to prioritize high compatibility scores
    const highCompatibility = suggestions.filter((s: any) => s.compatibility_score >= 70);
    const mediumCompatibility = suggestions.filter((s: any) => s.compatibility_score >= 40 && s.compatibility_score < 70);
    const lowCompatibility = suggestions.filter((s: any) => s.compatibility_score < 40);

    // Return organized by compatibility level
    return res.json({ 
      success: true, 
      dates: {
        high: highCompatibility,
        medium: mediumCompatibility,
        low: lowCompatibility,
        all: suggestions
      }
    });
  } catch (err) {
    console.error('Room generation error:', err);
    return res.status(500).json({ success: false, error: 'server error' });
  }
});

export { router as generateDateIdeas };
