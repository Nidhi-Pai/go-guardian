import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  loading?: boolean;
  disabled?: boolean;
}

const LocationSearch = ({ onLocationSelect, loading = false, disabled = false }: LocationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Initialize Places Autocomplete service
    if (window.google && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required)
      const dummyElement = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(dummyElement);
    }
  }, []);

  const handleSearch = async (placeId?: string) => {
    if (!placeId && !searchQuery) return;

    try {
      if (placeId) {
        // Get place details when selecting from suggestions
        placesService.current?.getDetails(
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
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address: searchQuery }, (results, status) => {
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
    setSearchQuery(value);
    if (!value.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    // Get predictions as user types
    autocompleteService.current?.getPlacePredictions(
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

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Where would you like to go?"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
            disabled={disabled || loading}
          />
        </div>
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