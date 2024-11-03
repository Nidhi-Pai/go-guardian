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
  User,
  Mail,
  Phone as PhoneIcon,
  Settings as SettingsIcon,
  AlertTriangle,
  Camera,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

export default function ProfilePage() {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('Jane Doe');
  const [email, setEmail] = React.useState('jane.doe@example.com');
  const [phone, setPhone] = React.useState('+1 (555) 123-4567');
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("profile");

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
    
    toast({
      title: "Setting Updated",
      description: `${setting} has been ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
        });
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
    badge,
  }) => (
    <div className="flex items-center justify-between space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/10">
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium leading-none">{title}</h4>
            {badge && (
              <Badge variant="secondary" className="ml-2">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto p-6 max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Manage your personal details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                  <div className="flex flex-col items-center space-y-4 mb-6 md:mb-0">
                    <div className="relative group">
                      <Avatar className="w-40 h-40 border-4 border-background">
                        <AvatarImage src={profileImage || undefined} />
                        <AvatarFallback className="text-4xl bg-primary/10">
                          {name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="profile-image-upload"
                        className="absolute bottom-2 right-2 p-3 rounded-full bg-primary shadow-lg hover:bg-primary/90 cursor-pointer transition-colors group-hover:scale-105"
                      >
                        <Camera className="h-5 w-5 text-primary-foreground" />
                      </label>
                      <input
                        type="file"
                        id="profile-image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                    {!editing && (
                      <Button
                        variant="outline"
                        onClick={() => setEditing(true)}
                        className="w-full"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>

                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4" />
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="focus-visible:ring-primary"
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={handleSave}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditing(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4 p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Name</p>
                              <p className="font-medium">{name}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center gap-4">
                            <Mail className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{email}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center gap-4">
                            <PhoneIcon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Safety Settings
                    </CardTitle>
                    <CardDescription>Configure your safety and privacy preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <SettingRow
                    icon={<MapPin className="h-4 w-4" />}
                    title="Share Location"
                    description="Allow trusted contacts to see your location"
                    checked={settings.shareLocation}
                    onCheckedChange={handleSettingChange('shareLocation')}
                    badge="Recommended"
                  />
                  <Separator />
                  <SettingRow
                    icon={<Bell className="h-4 w-4" />}
                    title="Emergency Alerts"
                    description="Receive alerts about safety concerns"
                    checked={settings.emergencyAlerts}
                    onCheckedChange={handleSettingChange('emergencyAlerts')}
                    badge="Critical"
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
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="Auto Recording"
                    description="Automatically record in emergency situations"
                    checked={settings.autoRecording}
                    onCheckedChange={handleSettingChange('autoRecording')}
                    badge="Beta"
                  />

                  <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Additional Security
                      </h3>
                      <Badge variant="outline" className="text-primary">
                        Advanced
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="safety-radius" className="text-sm text-muted-foreground">
                          Safety Radius (meters)
                        </Label>
                        <div className="flex gap-4">
                          <Input
                            id="safety-radius"
                            type="number"
                            value={settings.safetyRadius}
                            onChange={(e) => setSettings({
                              ...settings,
                              safetyRadius: parseInt(e.target.value) || 0,
                            })}
                            className="focus-visible:ring-primary"
                            min={0}
                            step={10}
                          />
                          <Button variant="outline" className="w-[120px]">
                            Set Default
                          </Button>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full hover:bg-primary/10">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Advanced Security Settings
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}