import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

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

  const handleSearch = async () => {
    // Initialize Google Places Autocomplete service
    const geocoder = new google.maps.Geocoder();
    
    try {
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
      setSearchQuery('');
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Where would you like to go?"
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={disabled || loading}
        />
      </div>
      <Button 
        onClick={handleSearch}
        disabled={disabled || loading || !searchQuery}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Find Route"
        )}
      </Button>
    </div>
  );
};

export default LocationSearch;