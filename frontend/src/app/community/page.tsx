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
  Share2,
  CircleUser
} from 'lucide-react';

interface SafetyGroup {
  id: number;
  name: string;
  members: number;
  activeNow: number;
  description: string;
  tags: string[];
  joined: boolean;
}

interface Alert {
  id: number;
  type: 'safety' | 'emergency';
  message: string;
  location: string;
  timestamp: string;
  verified: boolean;
}

const CommunityPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<SafetyGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'safety',
      message: 'Construction work on Market Street - Please use alternate routes',
      location: 'Financial District',
      timestamp: '10 min ago',
      verified: true
    },
    {
      id: 2,
      type: 'emergency',
      message: 'Street light outage reported on Valencia Street',
      location: 'Mission District',
      timestamp: '25 min ago',
      verified: true
    }
  ]);

  const [safetyGroups, setSafetyGroups] = useState<SafetyGroup[]>([
    {
      id: 1,
      name: 'Financial District Watch',
      members: 1240,
      activeNow: 26,
      description: 'Community safety updates for SF Financial District residents and workers',
      tags: ['Business District', 'High Traffic'],
      joined: false
    },
    {
      id: 2,
      name: 'Mission District Safety',
      members: 890,
      activeNow: 18,
      description: 'Local safety network for Mission District neighborhood',
      tags: ['Residential', 'Cultural District'],
      joined: false
    },
    {
      id: 3,
      name: 'Castro Community Alert',
      members: 650,
      activeNow: 12,
      description: 'Safety updates and community support in the Castro',
      tags: ['Nightlife', 'Entertainment'],
      joined: false
    }
  ]);

  const filteredGroups = safetyGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateAlert = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      const newAlert: Alert = {
        id: alerts.length + 1,
        type: 'safety',
        message: 'New alert message',
        location: selectedGroup?.name || 'General',
        timestamp: 'Just now',
        verified: false
      };
      setAlerts(prev => [newAlert, ...prev]);
    } catch (err) {
      setError('Failed to create alert. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLeave = async (groupId: number) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      setSafetyGroups(prev =>
        prev.map(group =>
          group.id === groupId
            ? {
                ...group,
                joined: !group.joined,
                members: group.joined ? group.members - 1 : group.members + 1
              }
            : group
        )
      );
    } catch (err) {
      setError('Failed to update membership. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add these style mappings
  const tagColors: Record<string, string> = {
    'Business District': 'bg-blue-100 text-blue-800',
    'High Traffic': 'bg-yellow-100 text-yellow-800',
    'Residential': 'bg-green-100 text-green-800',
    'Cultural District': 'bg-purple-100 text-purple-800',
    'Nightlife': 'bg-pink-100 text-pink-800',
    'Entertainment': 'bg-indigo-100 text-indigo-800'
  };

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                {filteredGroups.map(group => (
                  <Card
                    key={group.id}
                    className="hover:shadow-md transition-all duration-200 cursor-pointer p-4"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-lg">{group.name}</h3>
                        <Button
                          variant={group.joined ? "outline" : "default"}
                          size="sm"
                          className={`rounded-full px-4 transition-colors ${
                            group.joined 
                              ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinLeave(group.id);
                          }}
                          disabled={isLoading}
                        >
                          {group.joined ? 'Leave' : 'Join'}
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground">{group.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {group.tags.map(tag => (
                          <span 
                            key={tag}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagColors[tag] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          {group.members} members
                        </div>
                        <div className="flex items-center">
                          <div className="relative inline-flex items-center">
                            <CircleUser className="h-4 w-4 mr-2 text-primary" />
                            <div className="absolute right-1.5 top-0 w-2 h-2 bg-green-500 rounded-full ring-1 ring-white" />
                          </div>
                          <span>{group.activeNow} active</span>
                        </div>
                      </div>
                    </div>
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
              <Button 
                className="w-full mb-6 bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={handleCreateAlert}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
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