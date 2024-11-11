import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai.service';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoiceCommand() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setIsRecording(false);
        setIsProcessing(true);
        
        try {
          const position = await getCurrentPosition();
          const result = await aiService.processVoiceCommand(
            text,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date()
            }
          );
          handleCommandResult(result);
        } catch (error) {
          console.error('Error processing command:', error);
          toast({
            title: "Error",
            description: "Failed to process voice command. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
      };

      recognition.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your command clearly..."
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const handleCommandResult = (result: any) => {
    toast({
      title: "Command Processed",
      description: result.response_message
    });

    // Handle different command types
    switch (result.command_type) {
      case 'emergency':
        // Trigger emergency flow
        break;
      case 'navigation':
        // Handle navigation request
        break;
      case 'safety_check':
        // Perform safety check
        break;
      case 'contact':
        // Handle contact-related commands
        break;
    }
  };

  return (
    <div className="relative">
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className="relative"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {isRecording && (
        <div className="absolute -bottom-8 right-0 whitespace-nowrap">
          <Alert variant="default" className="py-1">
            <AlertDescription className="text-xs">
              Recording... Click to stop
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
} 