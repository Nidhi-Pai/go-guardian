"use client";

import { useState, useEffect } from "react";
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
import { AlertTriangle, AlertOctagon } from "lucide-react";
import type { Location, SafetyAlert } from "@/types/index";

interface EmergencyAlertProps {
  currentLocation: Location;
  onAlertSent: (alert: SafetyAlert) => void;
}

export function EmergencyAlert({
  currentLocation,
  onAlertSent,
}: EmergencyAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [alertTriggered, setAlertTriggered] = useState(false);

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

  const handleSendAlert = async () => {
    setAlertTriggered(true);
    const alert: SafetyAlert = {
      id: Date.now().toString(),
      userId: 'current-user-id', // Replace with actual user ID
      location: currentLocation,
      type: 'sos',
      timestamp: new Date(),
      status: 'active',
    };

    // Trigger device features
    if ('vibrate' in navigator) {
      navigator.vibrate(1000);
    }

    onAlertSent(alert);
    setIsOpen(false);
    setCountdown(5);
    setAlertTriggered(false);
  };

  return (
    <div className="fixed bottom-6 right-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="lg" 
            className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <AlertOctagon className="h-8 w-8" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Emergency Alert
            </DialogTitle>
            <DialogDescription>
              Emergency services will be notified in {countdown} seconds
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
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

          <DialogFooter className="sm:justify-start">
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
            >
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}