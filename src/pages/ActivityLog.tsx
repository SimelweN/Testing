import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Construction,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ActivityLog: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Construction className="w-6 h-6 text-orange-500" />
            Activity Section Removed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Activity className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-600">
            The activity section has been removed as requested.
          </p>
          <p className="text-sm text-gray-500">
            The footer button remains functional for future use.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;
