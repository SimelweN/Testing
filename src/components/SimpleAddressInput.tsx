import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface SimpleAddressInputProps {
  onAddressSelect?: (addressData: AddressData) => void;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultValue?: Partial<AddressData>;
}

const southAfricanProvinces = [
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

const SimpleAddressInput = ({
  onAddressSelect,
  label = "Address",
  required = false,
  error,
  className = "",
  defaultValue = {},
}: SimpleAddressInputProps) => {
  const [address, setAddress] = useState({
    street: defaultValue.street || "",
    city: defaultValue.city || "",
    province: defaultValue.province || "",
    postalCode: defaultValue.postalCode || "",
    country: "South Africa",
  });

  const updateAddress = (field: keyof typeof address, value: string) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);

    // Create formatted address
    const formattedAddress = [
      newAddress.street,
      newAddress.city,
      newAddress.province,
      newAddress.postalCode,
      newAddress.country,
    ]
      .filter(Boolean)
      .join(", ");

    // Call parent callback with complete address data (only if function is provided)
    if (
      typeof onAddressSelect === "function" &&
      newAddress.street &&
      newAddress.city &&
      newAddress.province &&
      newAddress.postalCode
    ) {
      onAddressSelect({
        formattedAddress,
        street: newAddress.street,
        city: newAddress.city,
        province: newAddress.province,
        postalCode: newAddress.postalCode,
        country: newAddress.country,
      });
    }
  };

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
          {/* Street Address */}
          <div>
            <Label htmlFor="street" className="text-sm font-medium">
              Street Address{" "}
              {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="street"
              type="text"
              placeholder="e.g., 123 Main Street"
              value={address.street}
              onChange={(e) => updateAddress("street", e.target.value)}
              className={error ? "border-red-500" : ""}
              required={required}
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium">
              City {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="e.g., Cape Town"
              value={address.city}
              onChange={(e) => updateAddress("city", e.target.value)}
              className={error ? "border-red-500" : ""}
              required={required}
            />
          </div>

          {/* Province and Postal Code Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province" className="text-sm font-medium">
                Province {required && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={address.province}
                onValueChange={(value) => updateAddress("province", value)}
              >
                <SelectTrigger className={error ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {southAfricanProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="postalCode" className="text-sm font-medium">
                Postal Code{" "}
                {required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="e.g., 8001"
                value={address.postalCode}
                onChange={(e) => updateAddress("postalCode", e.target.value)}
                className={error ? "border-red-500" : ""}
                required={required}
              />
            </div>
          </div>

          {/* Country (Fixed) */}
          <div>
            <Label htmlFor="country" className="text-sm font-medium">
              Country
            </Label>
            <Input
              id="country"
              type="text"
              value="South Africa"
              disabled
              className="bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Address Preview */}
      {address.street &&
        address.city &&
        address.province &&
        address.postalCode && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <p className="text-sm text-green-800">
                <strong>Complete Address:</strong>
              </p>
              <p className="text-sm text-green-700 mt-1">
                {[
                  address.street,
                  address.city,
                  address.province,
                  address.postalCode,
                  address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default SimpleAddressInput;
