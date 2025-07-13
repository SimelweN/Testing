import React, { useState } from "react";
import { ProvinceSelector } from "./province-selector";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

const ProvinceDemo = () => {
  const [selectedProvince, setSelectedProvince] = useState("");

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Province Selector Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProvinceSelector
          label="Select Your Province"
          value={selectedProvince}
          onValueChange={setSelectedProvince}
          placeholder="Choose a province"
          required
        />

        {selectedProvince && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-green-800">
              <strong>Selected:</strong> {selectedProvince}
            </p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            This component prevents typing errors and ensures consistent
            province data entry.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProvinceDemo;
