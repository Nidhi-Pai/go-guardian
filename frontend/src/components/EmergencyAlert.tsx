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
  const [confirmationMode, setConfirmationMode] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    const SHAKE_TIMEOUT = 3000; // Reset shake count after 3 seconds of no shaking

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
          // Clear existing timeout
          if (shakeTimeoutRef.current) {
            clearTimeout(shakeTimeoutRef.current);
          }

          // Increment shake count
          setShakeCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 5) {
              setIsOpen(true);
              setConfirmationMode(true);
              return 0; // Reset count after triggering
            }
            return newCount;
          });

          // Set timeout to reset shake count
          shakeTimeoutRef.current = setTimeout(() => {
            setShakeCount(0);
          }, SHAKE_TIMEOUT);
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
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && confirmationMode && countdown > 0) {
      timer = setTimeout(() => setCountdown(count => count - 1), 1000);
    } else if (countdown === 0) {
      setConfirmationMode(false);
      setCountdown(5);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, countdown, confirmationMode]);

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
      message: 'Emergency SOS Alert',
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

  const ShakeProgress = () => (
    shakeCount > 0 && (
      <div className="absolute -top-16 right-0 bg-background border rounded-lg p-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm">Shake {5 - shakeCount} more times</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < shakeCount ? 'bg-destructive' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="fixed bottom-6 right-6">
      <ShakeProgress />
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setConfirmationMode(false);
          setCountdown(5);
          setShakeCount(0);
        }
      }}>
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
              {confirmationMode ? "Confirm Emergency Alert" : "Emergency Alert"}
            </DialogTitle>
            <DialogDescription>
              {confirmationMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-destructive">{countdown}</span>
                  <span>seconds to cancel emergency alert</span>
                </div>
              ) : (
                "Choose an action below"
              )}
            </DialogDescription>
          </DialogHeader>

          {!confirmationMode ? (
            <>
              <div className="grid grid-cols-2 gap-4 my-4">
                <QuickAction
                  icon={Phone}
                  label="Emergency Call"
                  variant="destructive"
                  onClick={() => {
                    setConfirmationMode(true);
                    setCountdown(5);
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

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Select an action above. Emergency calls will require confirmation.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-bold">
                  You are about to contact emergency services.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <p>Are you sure you want to:</p>
                <ul className="list-disc ml-6">
                  <li>Alert emergency services</li>
                  <li>Share your current location</li>
                  <li>Notify emergency contacts</li>
                </ul>
              </div>

              <DialogFooter className="sm:justify-start gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmationMode(false);
                    setCountdown(5);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    window.location.href = 'tel:911';
                    handleSendAlert();
                  }}
                  className="flex-1"
                >
                  Confirm Emergency Call
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}