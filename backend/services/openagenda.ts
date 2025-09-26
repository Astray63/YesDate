const OA_KEY = process.env.OPENAGENDA_API_KEY || process.env.EXPO_PUBLIC_OPENAGENDA_API_KEY;
if (!OA_KEY) {
  console.warn('OpenAgenda API key not found in env (OPENAGENDA_API_KEY or EXPO_PUBLIC_OPENAGENDA_API_KEY).');
}

export interface OpenAgendaEvent {
  uid: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  timing: {
    begin: string;
    end: string;
  };
  image?: string;
  categories: string[];
  free: boolean;
  price: number;
}

export async function fetchEventsByLocation(lat: number, lon: number, radius = 10000, limit = 20) {
  if (!OA_KEY) throw new Error('Missing OpenAgenda API key');

  // OpenAgenda API n'a pas de recherche directe par coordonnées, donc on utilise une recherche par ville avec rayon
  // Pour l'instant, on va simuler avec une recherche générique et filtrer par distance
  const url = `https://api.openagenda.com/v2/events?key=${OA_KEY}&limit=${limit}&offset=0`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OpenAgenda events fetch failed');
    
    const data: any = await res.json();
    let events = data.events || [];
    
    // Filtrer les événements par distance et ajouter des coordonnées si manquantes
    events = events.filter((event: any) => {
      if (event.location && event.location.latitude && event.location.longitude) {
        const distance = calculateDistance(lat, lon, event.location.latitude, event.location.longitude);
        return distance <= radius;
      }
      return false;
    });

    return events.slice(0, limit);
  } catch (error) {
    console.error('OpenAgenda API error:', error);
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
}

export async function searchEventsByCity(city: string, limit = 20) {
  if (!OA_KEY) throw new Error('Missing OpenAgenda API key');

  const url = `https://api.openagenda.com/v2/events?key=${OA_KEY}&q=${encodeURIComponent(city)}&limit=${limit}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OpenAgenda city search failed');
    
    const data: any = await res.json();
    return data.events || [];
  } catch (error) {
    console.error('OpenAgenda city search error:', error);
    return [];
  }
}

// Fonction utilitaire pour calculer la distance entre deux points coordonnés
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance en km
  return distance * 1000; // Convertir en mètres
}

// Fonction pour obtenir les détails d'un événement spécifique
export async function getEventDetails(eventId: string) {
  if (!OA_KEY) throw new Error('Missing OpenAgenda API key');

  const url = `https://api.openagenda.com/v2/events/${eventId}?key=${OA_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OpenAgenda event details fetch failed');
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('OpenAgenda event details error:', error);
    return null;
  }
}
