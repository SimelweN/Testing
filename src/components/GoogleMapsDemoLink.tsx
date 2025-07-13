import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GoogleMapsDemoLink = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link to="/google-maps-demo">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Maps Demo
        </Button>
      </Link>
    </div>
  );
};

export default GoogleMapsDemoLink;
