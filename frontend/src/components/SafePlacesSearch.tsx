import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import type { GeoLocation } from "@/types/index";

interface SafePlacesSearchProps {
  currentLocation: GeoLocation;
  onError: (error: string) => void;
}

export function SafePlacesSearch({
  currentLocation,
  onError,
}: SafePlacesSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const nearbyPlaces = [
    { id: "1", name: "Central Police Station", distance: "0.5 miles" },
    { id: "2", name: "City Hospital", distance: "0.8 miles" },
    { id: "3", name: "24/7 Pharmacy", distance: "1.2 miles" },
    { id: "4", name: "Community Center", distance: "1.5 miles" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search safe places..."
            className="pl-9 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="default" className="shrink-0">
          Search
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Nearby Safe Places
        </h3>
        <div className="space-y-2">
          {nearbyPlaces.map((place) => (
            <div
              key={place.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors"
            >
              <div>
                <p className="font-medium">{place.name}</p>
                <p className="text-sm text-muted-foreground">
                  {place.distance}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
