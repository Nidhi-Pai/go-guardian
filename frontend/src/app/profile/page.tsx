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
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('Jane Doe');
  const [email, setEmail] = React.useState('jane.doe@example.com');
  const [phone, setPhone] = React.useState('+1 (555) 123-4567');
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const { toast } = useToast();

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

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto p-6 max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>

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
      </div>
    </ScrollArea>
  );
}