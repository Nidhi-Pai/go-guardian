import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkErrorProps {
  error: string;
}

export function NetworkError({ error }: NetworkErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
      </AlertDescription>
    </Alert>
  );
}
