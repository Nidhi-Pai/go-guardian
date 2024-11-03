// src/components/EmergencyAlert.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  AlertOctagon, 
  Phone, 
  Video, 
  Mic, 
  Share2,
  Shield,
  Wifi,
  Battery,
  Circle
} from "lucide-react";
import type { Location, SafetyAlert } from "@/types/index";

interface EmergencyAlertProps {
  currentLocation: Location;
  onAlertSent: (alert: SafetyAlert) => void;  // Changed from onEmergencyTriggered
}

export function EmergencyAlert({
  currentLocation,
  onAlertSent,  // Changed from onEmergencyTriggered
}: EmergencyAlertProps) {
  // Core states
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [alertTriggered, setAlertTriggered] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'video' | 'audio' | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Device states
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [shakeDetected, setShakeDetected] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery status
  useEffect(() => {
    const getBatteryStatus = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        }
      } catch (error) {
        console.error('Battery status error:', error);
      }
    };

    getBatteryStatus();
  }, []);

  // Shake detection
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = new Date().getTime();
    const SHAKE_THRESHOLD = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastTime;

      if (timeDiff > 100) {
        const deltaX = Math.abs(current.x! - lastX);
        const deltaY = Math.abs(current.y! - lastY);
        const deltaZ = Math.abs(current.z! - lastZ);

        if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
          setShakeDetected(true);
          setIsOpen(true);
        }

        lastX = current.x!;
        lastY = current.y!;
        lastZ = current.z!;
        lastTime = currentTime;
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0 && !alertTriggered) {
      timer = setTimeout(() => setCountdown(count => count - 1), 1000);
    } else if (countdown === 0 && !alertTriggered) {
      handleSendAlert();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, countdown, alertTriggered]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async (type: 'video' | 'audio') => {
    try {
      // Stop any existing recording
      if (isRecording) {
        stopRecording();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      setRecordingStream(stream);
      setIsRecording(true);
      setRecordingType(type);

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: type === 'video' ? 'video/webm' : 'audio/webm'
        });
        // Here you would typically upload the blob to your server
        console.log('Recording stopped, blob created:', blob);
      };

      mediaRecorder.start(1000); // Collect data every second
      return stream;

    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      setRecordingType(null);
      return null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }

    setRecordingStream(null);
    setIsRecording(false);
    setRecordingType(null);
  };

  const handleSendAlert = async () => {
    setAlertTriggered(true);
    
    let stream = null;
    if (!isRecording) {  // Only start recording if not already recording
      stream = await startRecording('video');
    }

    const alert: SafetyAlert = {
      id: Date.now().toString(),
      userId: 'current-user-id', // Replace with actual user ID
      location: currentLocation,
      type: 'sos',
      timestamp: new Date(),
      status: 'active',
      isRecording: isRecording || !!stream,
      mediaType: recordingType || (stream ? 'video' : null),
      additionalInfo: {
        batteryLevel,
        networkStatus: isOnline ? 'online' : 'offline',
        nearestSafeSpaces: [], // To be populated from safety analysis
        contactsNotified: [] // To be populated when contacts are notified
      }
    };

    // Trigger device features
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500]); // Pattern: vibrate, pause, vibrate
    }

    // Play alert sound
    try {
      const audio = new Audio('/alert-sound.mp3');
      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
    }

    onAlertSent(alert);
    
    // Reset states but keep recording if started
    setIsOpen(false);
    setCountdown(5);
    setAlertTriggered(false);
  };

  const QuickAction = ({ 
    icon: Icon, 
    label, 
    variant = "outline",
    onClick 
  }: {
    icon: any;
    label: string;
    variant?: "outline" | "destructive";
    onClick: () => void;
  }) => (
    <Button
      variant={variant}
      className="flex flex-col items-center gap-2 h-20 w-full"
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </Button>
  );

  const DeviceStatus = () => (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Wifi className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
        {isOnline ? 'Online' : 'Offline'}
      </div>
      {batteryLevel !== null && (
        <div className="flex items-center gap-1">
          <Battery className="h-4 w-4" />
          {batteryLevel}%
        </div>
      )}
      {isRecording && (
        <div className="flex items-center gap-1">
          <Circle className="h-4 w-4 text-red-500 animate-pulse" />
          Recording
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="lg" 
            className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all relative"
          >
            <AlertOctagon className="h-8 w-8" />
            {isRecording && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 animate-pulse"
              >
                REC
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Emergency Alert
            </DialogTitle>
            <DialogDescription>
              {alertTriggered 
                ? "Emergency services have been notified"
                : `Emergency services will be notified in ${countdown} seconds`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 my-4">
            <QuickAction
              icon={Phone}
              label="Call Emergency"
              variant="destructive"
              onClick={() => {
                window.location.href = 'tel:911';
              }}
            />
            <QuickAction
              icon={Share2}
              label="Alert Contacts"
              onClick={handleSendAlert}
            />
            <QuickAction
              icon={Video}
              label={isRecording && recordingType === 'video' ? "Stop Recording" : "Record Video"}
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording('video');
                }
              }}
            />
            <QuickAction
              icon={Mic}
              label={isRecording && recordingType === 'audio' ? "Stop Audio" : "Record Audio"}
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording('audio');
                }
              }}
            />
          </div>

          <DeviceStatus />

          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This will:
              <ul className="list-disc ml-6 mt-2">
                <li>Alert emergency services</li>
                <li>Share your current location</li>
                <li>Notify your emergency contacts</li>
                <li>Begin recording audio/video (if enabled)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <DialogFooter className="sm:justify-start gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setCountdown(5);
                setAlertTriggered(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSendAlert}
              className="flex-1"
            >
              Send Alert Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}