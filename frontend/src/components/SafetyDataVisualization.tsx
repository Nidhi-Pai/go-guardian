import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertTriangle, Shield, Map } from 'lucide-react';

interface SafetyData {
  incident_analysis?: {
    hourly_distribution: Record<string, number>;
  };
  infrastructure: any;
  safety_score: number;
}

interface VisualData {
  hourlyIncidents: Array<{hour: number, incidents: number}>;
  infrastructureStatus: any;
  safetyScore: number | null;
}

const SafetyDataVisualization = ({ safetyData }: { safetyData: SafetyData }) => {
  const [visualData, setVisualData] = useState<VisualData>({
    hourlyIncidents: [],
    infrastructureStatus: null,
    safetyScore: null
  });

  useEffect(() => {
    if (safetyData) {
      // Transform hourly incident data for visualization
      const hourlyData = safetyData.incident_analysis?.hourly_distribution 
        ? Object.entries(safetyData.incident_analysis.hourly_distribution)
            .map(([hour, count]) => ({
              hour: parseInt(hour),
              incidents: count
            }))
            .sort((a, b) => a.hour - b.hour)
        : [];

      setVisualData({
        hourlyIncidents: hourlyData,
        infrastructureStatus: safetyData.infrastructure,
        safetyScore: safetyData.safety_score
      });
    }
  }, [safetyData]);

  return (
    <div className="space-y-4">
      {/* Safety Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Area Safety Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {visualData.safetyScore?.toFixed(1)}/100
            </div>
            <Shield 
              className={`h-8 w-8 ${
                (visualData.safetyScore ?? 0) > 70 ? 'text-green-500' : 'text-amber-500'
              }`} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Incident Distribution Chart */}
      {visualData.hourlyIncidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incident Distribution by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <LineChart
                width={600}
                height={240}
                data={visualData.hourlyIncidents}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  label={{ value: 'Hour of Day', position: 'bottom' }} 
                />
                <YAxis 
                  label={{ value: 'Incident Count', angle: -90, position: 'left' }} 
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#4f46e5" 
                  strokeWidth={2} 
                />
              </LineChart>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Infrastructure Status */}
      {visualData.infrastructureStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Infrastructure Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Working Lights</span>
                <span className="font-bold">
                  {visualData.infrastructureStatus.working_lights} / 
                  {visualData.infrastructureStatus.total_lights}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${visualData.infrastructureStatus.working_percentage}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SafetyDataVisualization;