import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getCityCoordinates } from '../utils/data';

const { width, height } = Dimensions.get('window');

interface LocationData {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  city?: string;
}

interface AppleMapViewProps {
  selectedCity?: string;
  onLocationSelect: (location: LocationData) => void;
  style?: any;
}

const AppleMapView: React.FC<AppleMapViewProps> = ({
  selectedCity,
  onLocationSelect,
  style,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [mapCenter, setMapCenter] = useState({
    latitude: 48.8566, // Paris coordinates as default
    longitude: 2.3522,
  });
  const webViewRef = useRef<WebView>(null);

  // Initialize map with selected city or user location
  useEffect(() => {
    initializeMap();
  }, [selectedCity]);

  const initializeMap = async () => {
    setLoading(true);
    setMapError(null);

    try {
      // If we have a selected city, center map on it
      if (selectedCity) {
        const cityCoords = await getCityCoordinates(selectedCity);
        if (cityCoords) {
          setMapCenter({
            latitude: cityCoords.latitude,
            longitude: cityCoords.longitude,
          });
        }
      }
      // Default to Paris coordinates if no city selected
      // The map will load with default coordinates
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to load map. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const formatAddress = (addressComponent: Location.LocationGeocodedAddress): string => {
    const parts = [
      addressComponent.name,
      addressComponent.street,
      addressComponent.city,
      addressComponent.region,
      addressComponent.postalCode,
      addressComponent.country,
    ].filter(Boolean);

    return parts.join(', ');
  };

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=10&addressdetails=1&dedupe=1`
      );

      if (response.ok) {
        const data = await response.json();
        const results: LocationData[] = data.map((item: any) => ({
          name: item.display_name.split(',')[0] || item.name || 'Unknown Location',
          address: item.display_name,
          coordinates: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
          city: item.address?.city || item.address?.town || item.address?.village,
        }));

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } else {
        console.error('Search API error:', response.status);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchLocations(text);
  };

  const selectLocation = (location: LocationData) => {
    setSearchQuery(location.name);
    setShowSearchResults(false);
    Keyboard.dismiss();

    // Update map center
    setMapCenter({
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
    });

    // Send coordinates to WebView
    const javascript = `
      map.setView([${location.coordinates.latitude}, ${location.coordinates.longitude}], 13);
      if (selectedMarker) {
        map.removeLayer(selectedMarker);
      }
      selectedMarker = L.marker([${location.coordinates.latitude}, ${location.coordinates.longitude}]).addTo(map);
    `;
    webViewRef.current?.injectJavaScript(javascript);

    // Notify parent component
    onLocationSelect(location);
  };

  const goToUserLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission requise',
        'Veuillez autoriser l\'accès à la localisation pour utiliser cette fonctionnalité.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCenter = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setMapCenter(newCenter);

      // Send coordinates to WebView
      const javascript = `
        map.setView([${newCenter.latitude}, ${newCenter.longitude}], 13);
        if (selectedMarker) {
          map.removeLayer(selectedMarker);
        }
        selectedMarker = L.marker([${newCenter.latitude}, ${newCenter.longitude}])
          .addTo(map)
          .bindPopup('Votre position')
          .openPopup();
      `;

      webViewRef.current?.injectJavaScript(javascript);
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position actuelle.');
    }
  };

  const handleLocationSelectFromWebView = (latitude: number, longitude: number, name: string, address: string) => {
    const locationData: LocationData = {
      name,
      address,
      coordinates: { latitude, longitude },
      city: name,
    };

    setSearchQuery(name);
    onLocationSelect(locationData);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>{mapError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeMap}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Map</title>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body, html, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
        .search-box {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          z-index: 1000;
          padding: 8px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const center = [${mapCenter.latitude}, ${mapCenter.longitude}];
        const map = L.map('map').setView(center, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        let selectedMarker = null;

        map.on('click', function(e) {
          const { lat, lng } = e.latlng;

          // Remove previous marker
          if (selectedMarker) {
            map.removeLayer(selectedMarker);
          }

          // Add new marker
          selectedMarker = L.marker([lat, lng]).addTo(map);

          // Get address using reverse geocoding
          fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}\`)
            .then(response => response.json())
            .then(data => {
              const name = data.display_name.split(',')[0] || 'Selected Location';
              const address = data.display_name;

              // Send location data back to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_selected',
                latitude: lat,
                longitude: lng,
                name: name,
                address: address
              }));
            })
            .catch(error => {
              console.error('Reverse geocoding error:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_selected',
                latitude: lat,
                longitude: lng,
                name: 'Selected Location',
                address: \`Location at \${lat.toFixed(4)}, \${lng.toFixed(4)}\`
              }));
            });
        });

        // Expose map control functions to React Native
        window.mapControl = {
          setCenter: function(lat, lng, zoom = 13) {
            map.setView([lat, lng], zoom);
          },
          addMarker: function(lat, lng, popupText = '') {
            if (selectedMarker) {
              map.removeLayer(selectedMarker);
            }
            selectedMarker = L.marker([lat, lng]).addTo(map);
            if (popupText) {
              selectedMarker.bindPopup(popupText).openPopup();
            }
          }
        };
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_selected') {
        handleLocationSelectFromWebView(
          data.latitude,
          data.longitude,
          data.name,
          data.address
        );
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search for a city or location..."
          placeholderTextColor="#999"
          returnKeyType="search"
          accessible={true}
          accessibilityLabel="Search for locations"
          accessibilityHint="Enter a city name or address to search"
        />

        <TouchableOpacity
          style={styles.locationButton}
          onPress={goToUserLocation}
          accessible={true}
          accessibilityLabel="Go to current location"
          accessibilityHint="Center map on your current location"
        >
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => selectLocation(item)}
                accessible={true}
                accessibilityLabel={`Select ${item.name}`}
                accessibilityHint={`Tap to select ${item.name} at ${item.address}`}
              >
                <Text style={styles.searchResultName}>{item.name}</Text>
                <Text style={styles.searchResultAddress}>{item.address}</Text>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* WebView Map */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: mapHTML }}
        onMessage={handleWebViewMessage}
        onLoadStart={() => {}}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setMapError('Failed to load map. Please check your connection.');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        accessible={true}
        accessibilityLabel="Interactive map"
        accessibilityHint="Tap on the map to select a location, or use the search bar above"
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f04299" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      )}

      {/* Error overlay */}
      {mapError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{mapError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeMap}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>
          Tap on the map to select a location, or use the search bar above
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  locationButton: {
    marginLeft: 12,
    padding: 10,
    backgroundColor: '#E91E63',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
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
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
 });

export default AppleMapView;