import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai.service';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoiceCommand() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [context] = useState({});

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      // Set up recognition event handlers
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        toast({
          title: "Listening...",
          description: "Speak your command clearly",
        });
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
        try {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptText = result[0].transcript;
          
          if (transcriptText.trim()) {
            setTranscript(transcriptText);
            const response = await aiService.processVoiceCommand(transcriptText, context);
            
            if (response) {
              handleCommandResult(response);
              setResult(response);
            } else {
              throw new Error('Empty response from server');
            }
          }
        } catch (error) {
          console.error('Voice command processing failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error
          });
          setError(error instanceof Error ? error.message : 'Failed to process voice command');
        }
      };

      recognitionRef.current.onspeechstart = () => {
        console.log('Speech started');
        toast({
          title: "Speech Detected",
          description: "Processing your voice...",
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const handleCommandResult = (result: any) => {
    toast({
      title: "Command Processed",
      description: result.response_message
    });

    // Emit custom event for different command types
    const event = new CustomEvent('voiceCommand', { 
      detail: { 
        type: result.command_type,
        parameters: result.parameters
      } 
    });
    window.dispatchEvent(event);
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Error",
        description: "Speech recognition not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }
    setIsRecording(false);
  };

  return (
    <div className="relative group">
      <div className="relative flex items-center gap-2">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className="relative z-10"
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
          <div className="absolute left-12 min-w-[200px] max-w-[500px]">
            <Card className="p-2 shadow-lg border-primary/20">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <p className="text-sm truncate">
                  {transcript || "Listening..."}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {isRecording && !transcript && (
        <div className="absolute -bottom-8 right-0 whitespace-nowrap">
          <Alert variant="default" className="py-1">
            <AlertDescription className="text-xs">
              Speak your command...
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
} 