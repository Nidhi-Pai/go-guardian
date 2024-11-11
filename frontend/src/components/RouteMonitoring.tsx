import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Clock, MapPin, Shield } from 'lucide-react';
import { MonitoringStatus } from '@/lib/ai.service';
import { aiService } from '@/lib/ai.service';
import { toast } from '@/hooks/use-toast';

interface RouteMonitoringProps {
  route: google.maps.DirectionsRoute;
  onStatusUpdate?: (status: MonitoringStatus) => void;
}

export function RouteMonitoring({ route, onStatusUpdate }: RouteMonitoringProps) {
  const [monitoring, setMonitoring] = useState<MonitoringStatus | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && monitoring?.routeId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/status/${monitoring.routeId}`
          );
          const data = await response.json();
          setMonitoring(data);
          onStatusUpdate?.(data);
        } catch (error) {
          console.error('Error fetching monitoring status:', error);
        }
      }, 10000); // Update every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, monitoring?.routeId]);

  const handleStartMonitoring = async () => {
    try {
      const status = await aiService.startRouteMonitoring(route);
      setMonitoring(status);
      setIsActive(true);
      toast({
        title: "Route Monitoring Started",
        description: "We'll keep track of your progress and safety.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start route monitoring.",
        variant: "destructive",
      });
    }
  };

  const handleStopMonitoring = async () => {
    if (monitoring?.routeId) {
      try {
        await aiService.stopRouteMonitoring(monitoring.routeId);
        setIsActive(false);
        setMonitoring(null);
        toast({
          title: "Route Monitoring Stopped",
          description: "Stay safe!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to stop route monitoring.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Route Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent>
        {monitoring ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopMonitoring}
              >
                Stop Monitoring
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{monitoring.checkpoints.filter(c => c.status === 'reached').length} / {monitoring.checkpoints.length} checkpoints</span>
              </div>
              <Progress 
                value={(monitoring.checkpoints.filter(c => c.status === 'reached').length / monitoring.checkpoints.length) * 100} 
              />
            </div>

            <div className="space-y-2">
              {monitoring.checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Checkpoint {index + 1}</span>
                  <Badge variant={
                    checkpoint.status === 'reached' ? "default" :
                    checkpoint.status === 'missed' ? "destructive" : "secondary"
                  }>
                    {checkpoint.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleStartMonitoring}
          >
            Start Monitoring
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
