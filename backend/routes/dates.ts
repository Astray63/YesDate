import { Router } from 'express';
import { geocodeCity, fetchPlacesByRadius, fetchPlaceDetails } from '../services/opentripmap';
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

// Minimal /generate implementation using the new services
router.post('/generate', async (req: any, res: any) => {
  try {
    const quizAnswers: QuizAnswers = req.body?.quizAnswers || {};
    const city = quizAnswers.location || 'Paris';

    // geocode + fetch places
    let places: any[] = [];
    try {
      const { lat, lon } = await geocodeCity(city);
      const list = await fetchPlacesByRadius(lat, lon, 8000, 30);
      places = Array.isArray(list) ? list : [];
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
