import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

interface SimpleShippingFormProps {
  onComplete: (
    shippingData: ShippingData,
    deliveryOptions: DeliveryOption[],
  ) => void;
  cartItems: CartItem[];
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  seller: string;
}

interface DeliveryOption {
  id: string;
  service: string;
  price: number;
  estimatedDays: string;
  provider: string;
}

interface ShippingData {
  recipient_name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  province: string;
  postal_code: string;
  special_instructions?: string;
}

const SOUTH_AFRICAN_PROVINCES = [
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

const SimpleShippingForm: React.FC<SimpleShippingFormProps> = ({
  onComplete,
  cartItems,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [province, setProvince] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ShippingData>();

  const generateDeliveryOptions = (shippingData: ShippingData) => {
    const baseOptions = [
      {
        id: "courier_guy_standard",
        provider: "courier-guy" as const,
        service_name: "Courier Guy - Standard",
        price: 89,
        estimated_days: "3-5 days",
        description: "Reliable nationwide delivery",
      },
      {
        id: "fastway_express",
        provider: "fastway" as const,
        service_name: "Fastway - Express",
        price: 99,
        estimated_days: "2-4 days",
        description: "Fast express delivery",
      },
    ];

    // Add local delivery for Western Cape
    if (shippingData.province === "Western Cape") {
      baseOptions.unshift({
        id: "local_delivery",
        provider: "courier-guy" as const,
        service_name: "Local Delivery - Cape Town",
        price: 50,
        estimated_days: "1-2 days",
        description: "Fast local delivery within Cape Town area",
      });
    }

    // Add affordable option for Gauteng
    if (shippingData.province === "Gauteng") {
      baseOptions.unshift({
        id: "gauteng_local",
        provider: "courier-guy" as const,
        service_name: "Gauteng Local Delivery",
        price: 65,
        estimated_days: "1-3 days",
        description: "Local delivery within Gauteng",
      });
    }

    return baseOptions;
  };

  const onSubmit = async (data: ShippingData) => {
    setIsLoading(true);
    console.log("🚀 Simple shipping form submit:", data);

    try {
      // Add province from select
      const completeData = { ...data, province };

      if (!province) {
        toast.error("Please select a province");
        setIsLoading(false);
        return;
      }

      // Generate delivery options based on location
      const deliveryOptions = generateDeliveryOptions(completeData);

      console.log("📦 Generated delivery options:", deliveryOptions);

      // Call parent completion handler
      onComplete(completeData, deliveryOptions);

      toast.success("Shipping information saved!");
    } catch (error) {
      console.error("Error submitting shipping form:", error);
      toast.error("Failed to save shipping information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Contact Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipient_name">Full Name *</Label>
                <Input
                  id="recipient_name"
                  {...register("recipient_name", {
                    required: "Full name is required",
                  })}
                  placeholder="Enter recipient's full name"
                />
                {errors.recipient_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.recipient_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...register("phone", {
                    required: "Phone number is required",
                    minLength: { value: 8, message: "Phone number too short" },
                  })}
                  placeholder="e.g., 081 234 5678"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Delivery Address</h3>

            <div>
              <Label htmlFor="street_address">Street Address *</Label>
              <Input
                id="street_address"
                {...register("street_address", {
                  required: "Street address is required",
                })}
                placeholder="Enter your street address"
              />
              {errors.street_address && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.street_address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="apartment">Apartment/Unit (Optional)</Label>
              <Input
                id="apartment"
                {...register("apartment")}
                placeholder="Apartment, suite, unit, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city", { required: "City is required" })}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="province">Province *</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUTH_AFRICAN_PROVINCES.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!province && (
                  <p className="text-sm text-red-600 mt-1">
                    Province is required
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  {...register("postal_code", {
                    required: "Postal code is required",
                    minLength: { value: 3, message: "Invalid postal code" },
                  })}
                  placeholder="e.g., 7500"
                />
                {errors.postal_code && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.postal_code.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="special_instructions">
              Special Delivery Instructions (Optional)
            </Label>
            <Input
              id="special_instructions"
              {...register("special_instructions")}
              placeholder="Any special instructions for delivery..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Processing..." : "Continue to Delivery Selection"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleShippingForm;
