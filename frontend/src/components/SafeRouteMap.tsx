"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import type { Location } from "@/types/index";

interface SafeRouteMapProps {
  apiKey: string;
  initialLocation: Location;
  destination?: Location | null;
  onRouteCalculated: (route: google.maps.DirectionsRoute) => Promise<void>;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

export function SafeRouteMap({
  apiKey,
  initialLocation,
  destination,
  onRouteCalculated
}: SafeRouteMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places']
  });

  useEffect(() => {
    if (initialLocation && destination && map) {
      calculateRoute();
    }
  }, [initialLocation, destination, map]);

  const calculateRoute = async () => {
    if (!destination) return;

    const directionsService = new google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin: { lat: initialLocation.lat, lng: initialLocation.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.WALKING,
      });

      setDirections(result);
      if (onRouteCalculated) {
        await onRouteCalculated(result.routes[0]);
      }
    } catch (err) {
      setError("Failed to calculate route");
      console.error("Route calculation failed:", err);
    }
  };

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load Google Maps</AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {error && (
        <Alert variant="destructive" className="absolute top-4 right-4 z-10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: initialLocation.lat, lng: initialLocation.lng }}
        zoom={14}
        options={defaultOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              preserveViewport: false,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}