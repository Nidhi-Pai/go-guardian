// src/components/SafeRouteMap.tsx

"use client";

import React from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
}

interface SafeRouteMapProps {
  apiKey?: string;
  initialLocation: Location;
  destination: Location | null;
  onRouteCalculated?: (route: google.maps.DirectionsResult) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194  // San Francisco coordinates
};

// Map styling for better visibility
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
  apiKey, 
  initialLocation, 
  destination, 
  onRouteCalculated 
}: SafeRouteMapProps) {
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = React.useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = React.useState<google.maps.DirectionsRenderer | null>(null);
  const [route, setRoute] = React.useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Validate API key
  if (!apiKey) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </AlertDescription>
      </Alert>
    );
  }

  // Initialize directions service and renderer
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

  // Calculate route when destination changes
  React.useEffect(() => {
    if (destination && directionsService && directionsRenderer && map) {
      setError(null);
      
      directionsService.route({
        origin: initialLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          setRoute(result);
          onRouteCalculated?.(result);
        } else {
          setError('Failed to calculate route');
        }
      });
    }
  }, [destination, directionsService, directionsRenderer, map, initialLocation, onRouteCalculated]);

  return (
    <div className="w-full h-full relative">
      {error && (
        <Alert variant="destructive" className="absolute top-0 z-10 w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <LoadScript googleMapsApiKey={apiKey}>
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
          {!destination && <Marker position={initialLocation} />}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}