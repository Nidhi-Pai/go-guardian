import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkErrorProps {
  message: string;
  onRetry?: () => void;
}

export function NetworkError({ message, onRetry }: NetworkErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
