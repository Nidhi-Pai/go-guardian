"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  MessageCircle,
  Bell,
  Shield,
  MapPin,
  AlertTriangle,
  Clock,
  ThumbsUp,
  Share2
} from 'lucide-react';

interface SafetyGroup {
  id: number;
  name: string;
  members: number;
  activeNow: number;
  description: string;
  tags: string[];
}

interface Alert {
  id: number;
  type: 'safety' | 'emergency';
  message: string;
  location: string;
  timestamp: string;
  verified: boolean;
  likes: number;
}

const CommunityPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<SafetyGroup | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'safety',
      message: 'Construction work on Market Street - Please use alternate routes',
      location: 'Financial District',
      timestamp: '10 min ago',
      verified: true,
      likes: 15
    },
    {
      id: 2,
      type: 'emergency',
      message: 'Street light outage reported on Valencia Street',
      location: 'Mission District',
      timestamp: '25 min ago',
      verified: true,
      likes: 8
    }
  ]);

  const safetyGroups: SafetyGroup[] = [
    {
      id: 1,
      name: 'Financial District Watch',
      members: 1240,
      activeNow: 26,
      description: 'Community safety updates for SF Financial District residents and workers',
      tags: ['Business District', 'High Traffic']
    },
    {
      id: 2,
      name: 'Mission District Safety',
      members: 890,
      activeNow: 18,
      description: 'Local safety network for Mission District neighborhood',
      tags: ['Residential', 'Cultural District']
    },
    {
      id: 3,
      name: 'Castro Community Alert',
      members: 650,
      activeNow: 12,
      description: 'Safety updates and community support in the Castro',
      tags: ['Nightlife', 'Entertainment']
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Groups List */}
        <div className="md:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Safety Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search safety groups..."
                  className="pl-8"
                />
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                {safetyGroups.map(group => (
                  <Card
                    key={group.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedGroup?.id === group.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{group.name}</h3>
                        <Badge variant="secondary" className="ml-2">
                          {group.members} members
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {group.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {group.activeNow} active now
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Alerts Feed */}
        <div className="md:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Community Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-6 bg-primary/10 hover:bg-primary/20 text-primary">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Share Safety Alert
              </Button>

              <div className="space-y-4">
                {alerts.map(alert => (
                  <Card key={alert.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {alert.type === 'emergency' ? (
                            <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
                          ) : (
                            <Shield className="h-5 w-5 text-primary mt-1" />
                          )}
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {alert.location}
                              <Clock className="h-4 w-4 ml-2" />
                              {alert.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          {alert.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-primary/5 border-primary/20">
            <AlertDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              All community alerts are verified by local moderators for accuracy
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;