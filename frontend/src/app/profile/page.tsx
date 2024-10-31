"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Bell,
  Shield,
  Volume2,
  Vibrate,
  Upload,
  Pencil,
  Save,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

export default function ProfilePage() {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('Jane Doe');
  const [email, setEmail] = React.useState('jane.doe@example.com');
  const [phone, setPhone] = React.useState('+1 (555) 123-4567');
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  const { toast } = useToast();
  
  const [settings, setSettings] = React.useState<Settings>({
    shareLocation: true,
    emergencyAlerts: true,
    soundAlerts: true,
    vibrationAlerts: true,
    autoRecording: false,
    safetyRadius: 100,
  });

  const handleSettingChange = (setting: keyof Settings) => (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: checked,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    title,
    description,
    checked,
    onCheckedChange,
  }) => (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-full bg-muted">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium leading-none">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      {/* Profile Information Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 p-1 rounded-full bg-primary hover:bg-primary/90 cursor-pointer"
              >
                <Upload className="h-4 w-4 text-primary-foreground" />
              </label>
              <input
                type="file"
                id="profile-image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {editing ? (
              <div className="w-full max-w-md space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="text-center mt-4">
                <h2 className="text-xl font-semibold">{name}</h2>
                <p className="text-muted-foreground mt-1">{email}</p>
                <p className="text-muted-foreground">{phone}</p>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="mt-4"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <SettingRow
              icon={<MapPin className="h-4 w-4" />}
              title="Share Location"
              description="Allow trusted contacts to see your location"
              checked={settings.shareLocation}
              onCheckedChange={handleSettingChange('shareLocation')}
            />
            <Separator />
            <SettingRow
              icon={<Bell className="h-4 w-4" />}
              title="Emergency Alerts"
              description="Receive alerts about safety concerns"
              checked={settings.emergencyAlerts}
              onCheckedChange={handleSettingChange('emergencyAlerts')}
            />
            <Separator />
            <SettingRow
              icon={<Volume2 className="h-4 w-4" />}
              title="Sound Alerts"
              description="Play sound for safety alerts"
              checked={settings.soundAlerts}
              onCheckedChange={handleSettingChange('soundAlerts')}
            />
            <Separator />
            <SettingRow
              icon={<Vibrate className="h-4 w-4" />}
              title="Vibration Alerts"
              description="Vibrate phone for alerts"
              checked={settings.vibrationAlerts}
              onCheckedChange={handleSettingChange('vibrationAlerts')}
            />
            <Separator />
            <SettingRow
              icon={<Shield className="h-4 w-4" />}
              title="Auto Recording"
              description="Automatically record in emergency situations"
              checked={settings.autoRecording}
              onCheckedChange={handleSettingChange('autoRecording')}
            />

            {/* Additional Safety Settings */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Additional Settings</h3>
              <div className="space-y-2">
                <Label htmlFor="safety-radius">Safety Radius (meters)</Label>
                <Input
                  id="safety-radius"
                  type="number"
                  value={settings.safetyRadius}
                  onChange={(e) => setSettings({
                    ...settings,
                    safetyRadius: parseInt(e.target.value) || 0,
                  })}
                />
              </div>
              <Button variant="outline" className="w-full">
                Advanced Safety Settings
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}