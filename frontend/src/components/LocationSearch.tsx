import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Location } from "@/types/index";
import { useMaps } from '@/contexts/MapsContext';

interface LocationSearchProps {
  onLocationSelect: (location: Omit<Location, 'timestamp'>) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  showFindRouteButton?: boolean;
  showCurrentLocationButton?: boolean;
}

const LocationSearch = ({ onLocationSelect, loading = false, disabled = false, placeholder, initialValue, showFindRouteButton = false, showCurrentLocationButton = false }: LocationSearchProps) => {
  const { isLoaded, placesService, geocoder } = useMaps();
  const [searchQuery, setSearchQuery] = useState(initialValue || '');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleSearch = async (placeId?: string) => {
    if (!placeId && !searchQuery) return;

    try {
      if (placeId) {
        // Get place details when selecting from suggestions
        placesService?.getDetails(
          {
            placeId: placeId,
            fields: ['formatted_address', 'geometry']
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address
              };
              onLocationSelect(location);
              setSearchQuery(place.formatted_address || '');
              setPredictions([]);
              setShowSuggestions(false);
            }
          }
        );
      } else {
        // Fallback to geocoding if manual search
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder?.geocode({ address: searchQuery }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('Location not found'));
            }
          });
        });

        const location = {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        };

        onLocationSelect(location);
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  const handleInputChange = (value: string) => {
    console.log("handleInputChange", value)
    setSearchQuery(value);
    if (!value.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    console.log("placesService", placesService)

    // Get predictions as user types
    const autocompleteService = new google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions(
      {
        input: value,
        types: ['geocode', 'establishment']
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
          setShowSuggestions(true);
        }
      }
    );
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
            geocoder?.geocode(
              { location: { lat: position.coords.latitude, lng: position.coords.longitude } },
              (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error('Location not found'));
                }
              }
            );
          });

          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: result.formatted_address
          };

          onLocationSelect(location);
          setSearchQuery(result.formatted_address);
        } catch (error) {
          console.error('Error getting current location:', error);
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
      }
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
            disabled={disabled || loading}
          />
        </div>
        {showCurrentLocationButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            disabled={disabled || loading || gettingLocation}
            title="Use current location"
          >
            <Navigation className={`h-4 w-4 ${gettingLocation ? 'animate-pulse' : ''}`} />
          </Button>
        )}
        {showFindRouteButton && (
          <Button 
            onClick={() => handleSearch()}
            disabled={disabled || loading || !searchQuery}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Find Route"
            )}
          </Button>
        )}
      </div>

      {/* Location suggestions dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
          <div className="p-2">
            {predictions.map((prediction) => (
              <div
                key={prediction.place_id}
                className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                onClick={() => handleSearch(prediction.place_id)}
              >
                <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                <div className="text-sm text-gray-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;