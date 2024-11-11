import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lightbulb, Activity } from "lucide-react";

interface SafetyTrendsProps {
  hourlyData: any[];
  infrastructureData: {
    light_coverage: number;
    working_lights: number;
    total_lights: number;
  };
}

export function SafetyTrends({
  hourlyData,
  infrastructureData,
}: SafetyTrendsProps) {
  const metrics = [
    {
      title: "Light Coverage",
      value: `${Math.round(infrastructureData.light_coverage * 100)}%`,
      icon: Lightbulb,
      description: "Area covered by street lights",
    },
    {
      title: "Working Lights",
      value: infrastructureData.working_lights,
      icon: Activity,
      description: "Functional street lights",
    },
    {
      title: "Safety Score",
      value: "85%",
      icon: Shield,
      description: "Overall area safety rating",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Safety Trends</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
