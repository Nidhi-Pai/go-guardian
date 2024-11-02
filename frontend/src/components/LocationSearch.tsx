// src/components/LocationSearch.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, MapPin, Loader2 } from "lucide-react";

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

export function LocationSearch({
  onLocationSelect,
  loading = false,
  disabled = false
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (window.google && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const dummyElement = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(dummyElement);
    }
  }, []);

  const getPlacePredictions = async (input: string) => {
    if (!input || !autocompleteService.current) return;

    try {
      const response = await autocompleteService.current.getPlacePredictions({
        input,
        componentRestrictions: { country: 'us' },
        types: ['address', 'establishment', 'geocode']
      });

      setPredictions(response.predictions);
      setOpen(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  };

  const handleSelect = async (placeId: string, description: string) => {
    if (!placesService.current) return;

    try {
      const result = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.current!.getDetails(
          {
            placeId: placeId,
            fields: ['geometry', 'formatted_address']
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error('Place details not found'));
            }
          }
        );
      });

      if (result.geometry?.location) {
        onLocationSelect({
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        });
        setInput(result.formatted_address || description);
        setOpen(false);
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  return (
    <div className="flex gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Where would you like to go?"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                getPlacePredictions(e.target.value);
              }}
              className="pl-9"
              disabled={disabled}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[400px]" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {predictions.map((prediction) => (
                  <CommandItem
                    key={prediction.place_id}
                    onSelect={() => handleSelect(prediction.place_id, prediction.description)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {prediction.description}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        onClick={() => {
          if (input) {
            getPlacePredictions(input);
          }
        }}
        disabled={loading || !input || disabled}
        className="min-w-[120px]"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <MapPin className="h-4 w-4 mr-2" />
            Find Route
          </>
        )}
      </Button>
    </div>
  );
}