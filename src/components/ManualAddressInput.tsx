import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle } from "lucide-react";

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  additional_info?: string;
}

interface ManualAddressInputProps {
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  required?: boolean;
  defaultValue?: Partial<AddressData>;
  className?: string;
}

// South African provinces
const SA_PROVINCES = [
  "Eastern Cape",
  "Free State", 
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const ManualAddressInput: React.FC<ManualAddressInputProps> = ({
  onAddressSelect,
  label = "Address",
  required = false,
  defaultValue = {},
  className = "",
}) => {
  const [street, setStreet] = useState(defaultValue?.street || "");
  const [city, setCity] = useState(defaultValue?.city || "");
  const [province, setProvince] = useState(defaultValue?.province || "");
  const [postalCode, setPostalCode] = useState(defaultValue?.postalCode || "");
  const [additionalInfo, setAdditionalInfo] = useState(defaultValue?.additional_info || "");
  const [isValid, setIsValid] = useState(false);

  // Check if address is complete
  useEffect(() => {
    const complete = street.trim() && city.trim() && province && postalCode.trim();
    setIsValid(!!complete);

    if (complete) {
      const addressData: AddressData = {
        formattedAddress: `${street.trim()}, ${city.trim()}, ${province}, ${postalCode.trim()}, South Africa`,
        street: street.trim(),
        city: city.trim(),
        province,
        postalCode: postalCode.trim(),
        country: "South Africa",
        additional_info: additionalInfo.trim() || undefined,
      };
      onAddressSelect(addressData);
    }
  }, [street, city, province, postalCode, additionalInfo, onAddressSelect]);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Street Address */}
            <div>
              <Label htmlFor="street" className="text-sm font-medium">
                Street Address *
              </Label>
              <Input
                id="street"
                type="text"
                placeholder="123 Main Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required={required}
                className="mt-1"
              />
            </div>

            {/* City and Postal Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city" className="text-sm font-medium">
                  City *
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Cape Town"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={required}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="postalCode" className="text-sm font-medium">
                  Postal Code *
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="8001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required={required}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Province */}
            <div>
              <Label htmlFor="province" className="text-sm font-medium">
                Province *
              </Label>
              <Select value={province} onValueChange={setProvince} required={required}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a province" />
                </SelectTrigger>
                <SelectContent>
                  {SA_PROVINCES.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Information */}
            <div>
              <Label htmlFor="additional_info" className="text-sm font-medium">
                Additional Information (Optional)
              </Label>
              <Textarea
                id="additional_info"
                placeholder="e.g., Building entrance details, security gate code, special instructions..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include any helpful details for pickup/delivery (gate codes, building access, etc.)
              </p>
            </div>
          </div>

          {/* Address Preview */}
          {isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Complete Address:
                  </p>
                  <p className="text-sm text-green-700">
                    {street}, {city}, {province} {postalCode}, South Africa
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualAddressInput;
