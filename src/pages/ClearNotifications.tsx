import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

const ClearNotifications: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllNotifications = async () => {
    setIsClearing(true);
    
    try {
      // Delete all notifications from the database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything except non-existent ID
      
      if (error) {
        throw error;
      }
      
      toast.success('All notifications cleared successfully!');
      
      // Refresh the page after a delay to let the user see the success message
      setTimeout(() => {
        window.location.href = '/notifications';
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Clear All Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This will permanently delete all notifications from the database. 
              This action cannot be undone.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={clearAllNotifications}
            disabled={isClearing}
            variant="destructive"
            className="w-full"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Notifications
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClearNotifications;
