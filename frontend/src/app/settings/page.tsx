"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Bell,
  Shield,
  Volume2,
  Vibrate,
  ChevronRight,
  Settings as SettingsIcon,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Settings {
  shareLocation: boolean;
  emergencyAlerts: boolean;
  soundAlerts: boolean;
  vibrationAlerts: boolean;
  autoRecording: boolean;
  safetyRadius: number;
}

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  badge?: string;
}

function SettingRow({ icon, title, description, checked, onCheckedChange, badge }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between space-x-4 py-4">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{title}</p>
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  
  const [settings, setSettings] = React.useState<Settings>({
    shareLocation: true,
    emergencyAlerts: true,
    soundAlerts: true,
    vibrationAlerts: true,
    autoRecording: false,
    safetyRadius: 100,
  });

  const handleSettingChange = (setting: keyof Settings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Settings Updated",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto p-6 max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your safety and privacy preferences</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security & Privacy
            </CardTitle>
            <CardDescription>Manage your security preferences and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              icon={<MapPin className="h-5 w-5" />}
              title="Share Location"
              description="Allow the app to access and share your location"
              checked={settings.shareLocation}
              onCheckedChange={(checked) => handleSettingChange('shareLocation', checked)}
            />
            <Separator />
            <SettingRow
              icon={<Bell className="h-5 w-5" />}
              title="Emergency Alerts"
              description="Receive notifications for emergency situations"
              checked={settings.emergencyAlerts}
              onCheckedChange={(checked) => handleSettingChange('emergencyAlerts', checked)}
              badge="Important"
            />
            <Separator />
            <SettingRow
              icon={<Volume2 className="h-5 w-5" />}
              title="Sound Alerts"
              description="Play sound for important notifications"
              checked={settings.soundAlerts}
              onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)}
            />
            <Separator />
            <SettingRow
              icon={<Vibrate className="h-5 w-5" />}
              title="Vibration Alerts"
              description="Vibrate for important notifications"
              checked={settings.vibrationAlerts}
              onCheckedChange={(checked) => handleSettingChange('vibrationAlerts', checked)}
            />
            <Separator />
            <SettingRow
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Auto Recording"
              description="Automatically start recording in emergency situations"
              checked={settings.autoRecording}
              onCheckedChange={(checked) => handleSettingChange('autoRecording', checked)}
            />
            <Separator />
            <div className="flex items-center justify-between space-x-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Safety Radius</p>
                  <p className="text-sm text-muted-foreground">Set your safety zone radius (in meters)</p>
                </div>
              </div>
              <Input
                type="number"
                value={settings.safetyRadius}
                onChange={(e) => handleSettingChange('safetyRadius', Number(e.target.value))}
                className="w-24"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
} 