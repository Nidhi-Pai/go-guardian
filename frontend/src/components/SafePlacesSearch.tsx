import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import type { GeoLocation } from "@/types/index";
import { aiService } from "@/lib/ai.service";
import type { EmergencyResources } from "@/lib/ai.service";
import { Shield, Phone, MapPin, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

interface SafePlacesSearchProps {
  currentLocation: GeoLocation;
  onError: (error: string) => void;
}

interface EmergencyResource {
  id: string;
  name: string;
  address: string;
  distance: string;
  type: string;
  safetyScore?: number;
  phone?: string;
  emergency?: boolean;
  hours?: string;
}

interface PoliceResource {
  name: string;
  address: string;
  distance: string;
  safetyScore?: number;
  phone: string;
  infrastructure: {
    total_lights: number;
    working_lights: number;
  };
}

interface HospitalResource {
  name: string;
  address: string;
  distance: string;
  emergency: boolean;
  phone: string;
}

export function SafePlacesSearch({
  currentLocation,
  onError,
}: SafePlacesSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResources, setFilteredResources] = useState<EmergencyResource[]>([]);
  const [allResources, setAllResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestController, setRequestController] = useState<AbortController | null>(null);
  const [safetyMetrics, setSafetyMetrics] = useState({
    lightCoverage: 75,
    workingLights: 42,
    safetyScore: 85
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchResources = async () => {
      if (!currentLocation?.lat || !currentLocation?.lng) return;
      
      if (requestController) {
        requestController.abort();
      }
      
      const controller = new AbortController();
      setRequestController(controller);
      setLoading(true);

      try {
        const resources = await aiService.getNearbyEmergencyResources(
          currentLocation,
          controller.signal
        );
        
        if ('_error' in resources) {
          setAllResources(dummyResources);
          setFilteredResources(dummyResources);
          return;
        }

        setSafetyMetrics({
          lightCoverage: Math.round(resources.safety_metrics?.infrastructure?.coverage_score || 75),
          workingLights: resources.safety_metrics?.infrastructure?.working_lights || 42,
          safetyScore: Math.round(resources.safety_metrics?.overall_score || 85)
        });

        const processedResources = processEmergencyResources(resources);
        setAllResources(processedResources);
        setFilteredResources(processedResources);
        
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        
        setAllResources(dummyResources);
        setFilteredResources(dummyResources);
      } finally {
        setLoading(false);
        setRequestController(null);
      }
    };

    fetchResources();

    return () => {
      if (requestController) {
        requestController.abort();
      }
    };
  }, [currentLocation?.lat, currentLocation?.lng]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredResources(allResources);
      return;
    }

    const searchTerms = searchQuery.toLowerCase().split(' ');
    const filtered = allResources.filter(resource => {
      const searchableText = `${resource.name} ${resource.address} ${resource.type}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
    
    setFilteredResources(filtered);
  };

  // Add debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 my-6">
        <Input
          type="text"
          placeholder="Search safe places..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button onClick={handleSearch} variant="secondary">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border bg-muted/10 animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </div>
                <div className="h-6 w-6 bg-muted rounded" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.length === 0 ? (
            dummyResources.map(resource => (
              <div
                key={resource.id}
                className={`resource-card p-4 rounded-lg border ${getResourceTypeStyles(resource.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground">{resource.address}</p>
                  </div>
                  {getResourceIcon(resource.type)}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm">Distance: {resource.distance}</p>
                  {resource.safetyScore && (
                    <p className="text-sm">Safety Score: {resource.safetyScore}%</p>
                  )}
                  {resource.phone && (
                    <p className="text-sm">Phone: {resource.phone}</p>
                  )}
                  {resource.hours && (
                    <p className="text-sm">Hours: {resource.hours}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            filteredResources.map(resource => (
              <div
                key={resource.id}
                className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg text-slate-900">{resource.name}</h3>
                    <p className="text-sm text-slate-500">{resource.address}</p>
                  </div>
                  {getResourceIcon(resource.type)}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-600">Distance: {resource.distance}</p>
                  {resource.safetyScore && (
                    <p className="text-sm text-slate-600">Safety Score: {resource.safetyScore}%</p>
                  )}
                  {resource.phone && (
                    <p className="text-sm text-slate-600">Phone: {resource.phone}</p>
                  )}
                  {resource.hours && (
                    <p className="text-sm text-slate-600">Hours: {resource.hours}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions for styling and icons
function getResourceTypeStyles(type: string): string {
  return 'bg-white border-slate-200 hover:shadow-sm transition-shadow';
}

function getResourceIcon(type: string) {
  const iconClasses = "w-6 h-6";
  switch (type) {
    case 'police':
      return <Shield className={`${iconClasses} text-blue-600`} />;
    case 'hospital':
      return <Phone className={`${iconClasses} text-red-600`} />;
    case 'safe_place':
      return <MapPin className={`${iconClasses} text-green-600`} />;
    default:
      return <Info className={`${iconClasses} text-slate-600`} />;
  }
}

function processEmergencyResources(resources: EmergencyResources): EmergencyResource[] {
  return [
    ...(resources.police?.map(p => ({
      id: `police-${p.name}`,
      name: p.name,
      address: p.address,
      distance: p.distance,
      type: 'police',
      phone: p.phone
    })) ?? []),
    ...(resources.hospitals?.map(h => ({
      id: `hospital-${h.name}`,
      name: h.name,
      address: h.address,
      distance: h.distance,
      type: 'hospital',
      emergency: h.emergency,
      phone: h.phone
    })) ?? []),
    ...(resources.safe_places?.map(s => ({
      id: `safe_place-${s.name}`,
      name: s.name,
      address: s.address,
      distance: s.distance,
      type: 'safe_place',
      hours: s.hours
    })) ?? [])
  ];
}

const dummyResources: EmergencyResource[] = [
  {
    id: 'police-1',
    name: 'Central Police Station',
    address: '123 Safety Street',
    distance: '0.5 miles',
    type: 'police',
    phone: '911',
    safetyScore: 95
  },
  {
    id: 'hospital-1',
    name: 'City General Hospital',
    address: '456 Health Avenue',
    distance: '0.8 miles',
    type: 'hospital',
    phone: '555-0123',
    emergency: true
  },
  {
    id: 'safe_place-1',
    name: 'Community Center',
    address: '789 Community Road',
    distance: '0.3 miles',
    type: 'safe_place',
    hours: '24/7'
  }
];
