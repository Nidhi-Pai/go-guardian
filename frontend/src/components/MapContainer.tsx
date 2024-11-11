"use client";

import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMaps } from "@/contexts/MapsContext";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 51.5074,
  lng: -0.1278,
};

export default function MapContainer() {
  const { isLoaded, loadError } = useMaps();
  const { toast } = useToast();
  const [center, setCenter] = React.useState(defaultCenter);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(pos);
          map?.panTo(pos);

          toast({
            title: "Location found",
            description: "Successfully got your current location",
          });
        },
        () => {
          toast({
            title: "Error",
            description: "Error getting your location",
            variant: "destructive",
          });
        },
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading maps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Location</h2>
        <Button onClick={getCurrentLocation} variant="outline" size="sm">
          Get Current Location
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden border border-border">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker position={center} />
        </GoogleMap>
      </div>
    </div>
  );
}
