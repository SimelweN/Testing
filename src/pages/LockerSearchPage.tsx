import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LockerSearch from '@/components/LockerSearch';
import { LockerLocation } from '@/services/lockerService';

const LockerSearchPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLockerSelect = (locker: LockerLocation) => {
    console.log('Selected locker:', locker);
    // You can add additional logic here, such as:
    // - Save selected locker to state/context
    // - Redirect to checkout with locker selection
    // - Show confirmation dialog
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Find a Locker</h1>
                <p className="text-muted-foreground text-sm">
                  Search for Courier Guy pickup and drop-off lockers across South Africa
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <LockerSearch 
          onLockerSelect={handleLockerSelect}
          showSelectionMode={true}
        />
      </div>
    </div>
  );
};

export default LockerSearchPage;
