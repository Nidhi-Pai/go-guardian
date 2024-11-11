"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry"];

interface MapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  placesService: google.maps.places.PlacesService | null;
  geocoder: google.maps.Geocoder | null;
}

const MapsContext = createContext<MapsContextType | undefined>(undefined);

export function MapsProvider({ children }: { children: React.ReactNode }) {
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  useEffect(() => {
    if (isLoaded && !placesService) {
      // Create a dummy div for PlacesService (required but not displayed)
      const dummyDiv = document.createElement('div');
      setPlacesService(new google.maps.places.PlacesService(dummyDiv));
      setGeocoder(new google.maps.Geocoder());
    }
  }, [isLoaded, placesService]);

  return (
    <MapsContext.Provider value={{ 
      isLoaded, 
      loadError,
      placesService,
      geocoder
    }}>
      {children}
    </MapsContext.Provider>
  );
}

export function useMaps() {
  const context = useContext(MapsContext);
  if (context === undefined) {
    throw new Error('useMaps must be used within a MapsProvider');
  }
  return context;
} 