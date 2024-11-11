import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from 'lucide-react';
import { aiService } from '@/lib/ai.service';
import type { SearchResult } from '@/lib/ai.service';

export function SafePlacesSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // Get current location
      const position = await getCurrentPosition();
      
      const searchResults = await aiService.searchSafePlaces(
        query,
        {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date()
        }
      );
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search safe places..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result.place_id}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{result.name}</h3>
              <p className="text-sm text-muted-foreground">{result.formatted_address}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-sm">
                  Safety Score: {result.safety_score}
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.distance}m away
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 