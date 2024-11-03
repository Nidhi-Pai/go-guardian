// src/components/LocationSearch.tsx

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, MapPin, Building, Clock, Star, Loader2 } from "lucide-react";

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

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
  rating?: number;
  open_now?: boolean;
  distance_meters?: number;
}

export function LocationSearch({
  onLocationSelect,
  loading = false,
  disabled = false
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (window.google && !autocompleteService.current) {
      try {
        // Initialize services
        autocompleteService.current = new google.maps.places.AutocompleteService();
        const dummyElement = document.createElement('div');
        placesService.current = new google.maps.places.PlacesService(dummyElement);
        
        // Create new session token
        if (google.maps.places.AutocompleteSessionToken) {
          sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }

        // Load recent searches from localStorage
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
          try {
            setRecentSearches(JSON.parse(saved));
          } catch (e) {
            console.error('Error loading recent searches:', e);
          }
        }
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
      }
    }
  }, []);

  const getPlacePredictions = async (input: string) => {
    if (!input || !autocompleteService.current) return;
    setSearchLoading(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: 'us' },
        types: ['establishment', 'geocode', 'address'],
        locationBias: {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          radius: 50000 // 50km radius
        }
      };

      // Add session token if available
      if (sessionToken.current) {
        request.sessionToken = sessionToken.current;
      }

      const response = await autocompleteService.current.getPlacePredictions(request);
      
      // Get additional details for each prediction
      const enhancedPredictions = await Promise.all(
        response.predictions.map(async (prediction) => {
          try {
            const placeResult = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
              if (!placesService.current) {
                reject(new Error('Places service not available'));
                return;
              }

              placesService.current.getDetails(
                {
                  placeId: prediction.place_id,
                  fields: ['rating', 'opening_hours', 'types']
                },
                (place, status) => {
                  if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    resolve(place);
                  } else {
                    reject(status);
                  }
                }
              );
            });

            return {
              ...prediction,
              rating: placeResult.rating,
              open_now: placeResult.opening_hours?.isOpen(),
              types: placeResult.types || []
            } as PlacePrediction;
          } catch (error) {
            return prediction as PlacePrediction;
          }
        })
      );

      setPredictions(enhancedPredictions);
      setOpen(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelect = async (placeId: string, description: string) => {
    if (!placesService.current) return;
    setSearchLoading(true);

    try {
      const result = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.current!.getDetails(
          {
            placeId: placeId,
            fields: ['geometry', 'formatted_address', 'name', 'rating', 'opening_hours']
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
        // Save to recent searches
        const newRecentSearches = [
          description,
          ...recentSearches.filter(s => s !== description).slice(0, 4)
        ];
        setRecentSearches(newRecentSearches);
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

        onLocationSelect({
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        });

        setInput(result.formatted_address || description);
        setOpen(false);
        
        // Create new session token
        if (google.maps.places.AutocompleteSessionToken) {
          sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const getIconForType = (types: string[]) => {
    if (types.includes('store') || types.includes('establishment')) return Building;
    if (types.includes('address')) return MapPin;
    return MapPin;
  };

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Where would you like to go?"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value) {
                    getPlacePredictions(e.target.value);
                  }
                }}
                className="pl-9"
                disabled={disabled}
              />
            </div>
            <Button 
              className="whitespace-nowrap"
              disabled={!input || loading || searchLoading}
            >
              {loading || searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Find Route
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[500px]" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {searchLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searchLoading && predictions.length > 0 && (
                <CommandGroup heading="Search Results">
                  {predictions.map((prediction) => {
                    const Icon = getIconForType(prediction.types);
                    return (
                      <CommandItem
                        key={prediction.place_id}
                        onSelect={() => handleSelect(prediction.place_id, prediction.description)}
                        className="flex items-center gap-2 p-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {prediction.structured_formatting.main_text}
                            </span>
                            {prediction.rating && (
                              <span className="flex items-center text-sm text-muted-foreground">
                                <Star className="h-3 w-3 fill-current mr-1" />
                                {prediction.rating}
                              </span>
                            )}
                            {prediction.open_now !== undefined && (
                              <span className={`text-xs ${prediction.open_now ? 'text-green-500' : 'text-red-500'}`}>
                                {prediction.open_now ? 'Open' : 'Closed'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {prediction.structured_formatting.secondary_text}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {!searchLoading && recentSearches.length > 0 && !input && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => {
                        setInput(search);
                        getPlacePredictions(search);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}