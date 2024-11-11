// src/components/SafeRouteMap.tsx

"use client";

import React from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useMaps } from '@/contexts/MapsContext';

interface Location {
  lat: number;
  lng: number;
}

interface SafeRouteMapProps {
  initialLocation: Location;
  fromLocation: string;
  toLocation: string;
  onRouteCalculated: (route: google.maps.DirectionsResult) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194  // San Francisco coordinates
};

const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

export function SafeRouteMap({ 
  initialLocation, 
  fromLocation, 
  toLocation, 
  onRouteCalculated 
}: SafeRouteMapProps) {
  const { isLoaded, loadError } = useMaps();
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = React.useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = React.useState<google.maps.DirectionsRenderer | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: "#0066CC",
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    setDirectionsService(directionsService);
    setDirectionsRenderer(directionsRenderer);
    directionsRenderer.setMap(map);
  }, []);

  React.useEffect(() => {
    if (toLocation && directionsService && directionsRenderer && map) {
      directionsService.route({
        origin: fromLocation,
        destination: toLocation,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          onRouteCalculated?.(result);
        } else {
          setError('Failed to calculate route');
        }
      });
    }
  }, [fromLocation, toLocation, directionsService, directionsRenderer, map, onRouteCalculated]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load Google Maps</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full h-full relative">
      {error && (
        <Alert variant="destructive" className="absolute top-0 z-10 w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={initialLocation || defaultCenter}
        onLoad={onMapLoad}
        options={{
          styles: mapStyles,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          clickableIcons: false,
          scrollwheel: true,
          disableDoubleClickZoom: true,
        }}
      >
        {!toLocation && <Marker position={initialLocation} />}
      </GoogleMap>
    </div>
  );
}