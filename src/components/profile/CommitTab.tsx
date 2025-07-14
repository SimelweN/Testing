import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Package,
  Clock,
  Award,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

const CommitTab = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-indigo-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-100 rounded-t-lg">
        <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
          <Award className="h-6 w-6 text-indigo-600" />
          Commit System - Moved to Activity Center
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Activity className="h-12 w-12 text-indigo-600" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Enhanced Commit System Available
          </h3>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We've moved the commit system to our dedicated Activity Center for a
            better experience. Manage all your sale commitments with enhanced
            features and real-time tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-orange-900">Pending Commits</h4>
              <p className="text-orange-700 text-sm">
                48-hour commitment window
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-900">
                Performance Stats
              </h4>
              <p className="text-green-700 text-sm">
                Track your seller metrics
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate("/activity")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Activity className="h-5 w-5 mr-2" />
              Go to Activity Center
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-gray-500 text-sm">
              Manage commitments • View statistics • Track performance
            </p>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              ✨ New Features in Activity Center:
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Real-time commit countdown timers</li>
              <li>• Enhanced visual indicators for urgent commits</li>
              <li>• Comprehensive seller performance metrics</li>
              <li>• Complete activity history and tracking</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommitTab;
