import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function RecentActivity() {
  const activities = [
    {
      type: "Route Completed",
      time: "2 hours ago",
      description: "Safe route to home completed",
    },
    {
      type: "Alert Check",
      time: "5 hours ago",
      description: "Area safety status checked",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="border-b last:border-0 pb-2 last:pb-0">
              <div className="font-medium">{activity.type}</div>
              <div className="text-sm text-muted-foreground">
                {activity.description}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}