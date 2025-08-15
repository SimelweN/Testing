import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Save } from "lucide-react";
import { CheckoutAddress } from "@/types/checkout";

interface AddressInputProps {
  initialAddress?: Partial<CheckoutAddress>;
  onAddressSubmit: (address: CheckoutAddress) => void;
  onSaveToProfile?: (address: CheckoutAddress) => void;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
}

const SOUTH_AFRICAN_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const AddressInput: React.FC<AddressInputProps> = ({
  initialAddress = {},
  onAddressSubmit,
  onSaveToProfile,
  onCancel,
  loading = false,
  title = "Enter Delivery Address",
}) => {
  const [address, setAddress] = useState<CheckoutAddress>({
    street: initialAddress.street || "",
    city: initialAddress.city || "",
    province: initialAddress.province || "",
    postal_code: initialAddress.postal_code || "",
    country: "South Africa",
    additional_info: initialAddress.additional_info || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveToProfile, setSaveToProfile] = useState(false);

  const validateAddress = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!address.street.trim()) {
      newErrors.street = "Street address is required";
    }

    if (!address.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!address.province.trim()) {
      newErrors.province = "Province is required";
    }

    if (!address.postal_code.trim()) {
      newErrors.postal_code = "Postal code is required";
    } else if (!/^\d{4}$/.test(address.postal_code.trim())) {
      newErrors.postal_code = "Postal code must be 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAddress()) {
      return;
    }

    const cleanAddress = {
      street: address.street.trim(),
      city: address.city.trim(),
      province: address.province.trim(),
      postal_code: address.postal_code.trim(),
      country: "South Africa",
      additional_info: address.additional_info?.trim() || "",
    };

    onAddressSubmit(cleanAddress);

    if (saveToProfile && onSaveToProfile) {
      onSaveToProfile(cleanAddress);
    }
  };

  const handleInputChange = (field: keyof CheckoutAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="mx-4 sm:mx-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Street Address */}
          <div>
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              placeholder="e.g. 123 Main Street, Apartment 4B"
              className={`min-h-[44px] text-sm sm:text-base ${errors.street ? "border-red-500" : ""}`}
            />
            {errors.street && (
              <p className="text-sm text-red-600 mt-1">{errors.street}</p>
            )}
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="e.g. Cape Town"
              className={`min-h-[44px] text-sm sm:text-base ${errors.city ? "border-red-500" : ""}`}
            />
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city}</p>
            )}
          </div>

          {/* Province and Postal Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Province *</Label>
              <Select
                value={address.province}
                onValueChange={(value) => handleInputChange("province", value)}
              >
                <SelectTrigger
                  className={`min-h-[44px] text-sm sm:text-base ${errors.province ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {SOUTH_AFRICAN_PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-sm text-red-600 mt-1">{errors.province}</p>
              )}
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                value={address.postal_code}
                onChange={(e) =>
                  handleInputChange("postal_code", e.target.value)
                }
                placeholder="e.g. 7500"
                className={`min-h-[44px] text-sm sm:text-base ${errors.postal_code ? "border-red-500" : ""}`}
              />
              {errors.postal_code && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.postal_code}
                </p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="additional_info">Additional Information (Optional)</Label>
            <Textarea
              id="additional_info"
              value={address.additional_info}
              onChange={(e) => handleInputChange("additional_info", e.target.value)}
              placeholder="e.g., Building entrance details, security gate code, special delivery instructions..."
              rows={3}
              className="min-h-[80px] text-sm sm:text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include any helpful details for pickup/delivery (gate codes, building access, etc.)
            </p>
          </div>

          {/* Save to Profile Option */}
          {onSaveToProfile && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveToProfile"
                checked={saveToProfile}
                onChange={(e) => setSaveToProfile(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="saveToProfile" className="text-sm">
                Save this address to my profile for future orders
              </Label>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 space-y-2">
            <Button
              type="submit"
              className="w-full flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Continue with this address
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full min-h-[44px] text-sm sm:text-base"
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddressInput;
