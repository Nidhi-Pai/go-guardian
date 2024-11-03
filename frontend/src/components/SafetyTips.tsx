import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function SafetyTips() {
  const tips = [
    "Stay aware of your surroundings",
    "Keep emergency contacts updated",
    "Share your location with trusted contacts",
    "Avoid poorly lit areas at night",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Safety Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}