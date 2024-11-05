// frontend/components/ContextualSafety.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface SafetyContext {
  safety_score: number;
  risk_level: string;
  risks: string[];
  recommendations: string[];
  safe_spaces: string[];
}

interface ContextualSafetyProps {
  location: Location;
}

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] ${message}`, error || '');
  }
};

export function ContextualSafety({ location }: ContextualSafetyProps) {
  const [context, setContext] = useState<SafetyContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContextData = async () => {
      if (!location?.lat || !location?.lng) return;
      
      setLoading(true);
      setError(null);
      
      logger.info('Fetching safety analysis for location:', {
        lat: location.lat,
        lng: location.lng
      });
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/safety/analyze-area`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: {
              lat: location.lat,
              lng: location.lng,
              address: location.address
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        logger.info('Received server response:', data);
        
        if (data.status === 'success' && data.data) {
          logger.info('Setting safety context:', data.data);
          setContext(data.data);
        } else if (data.status === 'error') {
          throw new Error(data.error);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch safety context';
        logger.error('Failed to fetch safety context:', err);
        setError(errorMessage);
        setContext(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContextData();
  }, [location]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 animate-pulse" />
            <p>Analyzing area safety...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-2 underline"
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!context) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <h3 className="font-semibold">Area Safety Score: {context.safety_score}</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              context.risk_level === 'low' ? 'bg-green-100 text-green-800' :
              context.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {context.risk_level.charAt(0).toUpperCase() + context.risk_level.slice(1)} Risk
            </div>
          </div>

          {context.risks.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Potential Risks:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {context.risks.map((risk, index) => (
                  <li key={index} className="text-sm">{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {context.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Safety Recommendations:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {context.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}