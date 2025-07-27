import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Loader2,
  Truck,
  Clock,
  DollarSign,
  Edit2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const shippingSchema = z.object({
  recipient_name: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  street_address: z.string().min(3, "Street address is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postal_code: z.string().min(3, "Valid postal code is required"),
  special_instructions: z.string().optional(),
  additional_info: z.string().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

interface DeliveryOption {
  id: string;
  provider: "courier-guy" | "fastway";
  service_name: string;
  price: number;
  estimated_days: string;
  description: string;
}

interface EnhancedShippingFormProps {
  onComplete: (
    shippingData: ShippingFormData,
    deliveryOptions: DeliveryOption[],
  ) => void;
  cartItems: {
    id: string;
    title: string;
    price: number;
    seller: string;
  }[];
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

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = ({
  onComplete,
  cartItems,
}) => {
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedAddress, setSavedAddress] = useState<{
    streetAddress: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  } | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] =
    useState<DeliveryOption | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [hasAutofilled, setHasAutofilled] = useState(false);
  const [manualEntries, setManualEntries] = useState({
    name: false,
    email: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    mode: "onSubmit",
    defaultValues: {
      recipient_name: "",
      phone: "",
      street_address: "",
      apartment: "",
      city: "",
      province: "",
      postal_code: "",
      special_instructions: "",
      additional_info: "",
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    loadSavedAddress();
    autofillUserInfo();
  }, []);

  const autofillUserInfo = async () => {
    if (hasAutofilled) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setValue("recipient_name", user.user_metadata.full_name, {
          shouldValidate: true,
        });
      }
      setHasAutofilled(true);
    } catch (error) {
      console.error("Error autofilling user info:", error);
    }
  };

  useEffect(() => {
    if (
      watchedValues.city &&
      watchedValues.province &&
      watchedValues.postal_code
    ) {
      getDeliveryQuotes();
    }
  }, [watchedValues.city, watchedValues.province, watchedValues.postal_code]);

  if (!onComplete || !cartItems) {
    console.error("EnhancedShippingForm: Invalid props");
    return <div>Loading shipping form...</div>;
  }

  const loadSavedAddress = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("shipping_address")
        .eq("id", user.id)
        .single();

      if (profile?.shipping_address) {
        setSavedAddress(profile.shipping_address);

        if (!isEditingAddress) {
          populateFormWithAddress(profile.shipping_address);
        }
      }
    } catch (error) {
      console.error("Error loading saved address:", error);
    }
  };

  const populateFormWithAddress = (address: {
    name?: string;
    phone?: string;
    streetAddress?: string;
    street_address?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    postal_code?: string;
    country?: string;
  }) => {
    if (address.name && address.name.trim()) {
      setValue("recipient_name", address.name);
    }
    if (address.phone && address.phone.trim()) {
      setValue("phone", address.phone);
    }
    setValue(
      "street_address",
      address.streetAddress || address.street_address || "",
    );
    setValue("apartment", address.apartment || address.unit_number || "");
    setValue("city", address.city || "");
    setValue("province", address.province || "");
    setValue("postal_code", address.postalCode || address.postal_code || "");
    setValue("additional_info", address.additional_info || "");
  };

  const getDeliveryQuotes = async () => {
    if (
      !watchedValues.street_address ||
      !watchedValues.city ||
      !watchedValues.province ||
      !watchedValues.postal_code
    ) {
      return;
    }

    setIsLoadingQuotes(true);
    try {
      console.log("🚚 Getting delivery quotes...");

      const fallbackOptions: DeliveryOption[] = [];

      if (watchedValues.province === "Western Cape") {
        fallbackOptions.push({
          id: "local_delivery_fallback",
          provider: "courier-guy",
          service_name: "Local Delivery - Cape Town",
          price: 50,
          estimated_days: "1-2 days",
          description: "Fast local delivery within Cape Town area",
        });
      }

      fallbackOptions.push(
        {
          id: "courier_guy_standard",
          provider: "courier-guy",
          service_name: "Courier Guy - Standard",
          price: 89,
          estimated_days: "3-5 days",
          description: "Reliable nationwide delivery",
        },
        {
          id: "fastway_standard",
          provider: "fastway",
          service_name: "Fastway - Express",
          price: 99,
          estimated_days: "2-4 days",
          description: "Fast express delivery",
        },
      );

      console.log("🚛 Setting delivery options:", fallbackOptions);
      setDeliveryOptions(fallbackOptions);
      if (fallbackOptions.length > 0) {
        setSelectedDeliveryOption(fallbackOptions[0]);
      }

      toast.success(`${fallbackOptions.length} delivery options loaded`);
    } catch (error) {
      console.error("Error getting delivery quotes:", error);
      toast.error("Failed to load delivery options");
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleEditAddress = () => {
    setIsEditingAddress(true);
    setSavedAddress(null);
  };

  const handleUseSavedAddress = () => {
    if (savedAddress) {
      setIsEditingAddress(false);
      populateFormWithAddress(savedAddress);
    }
  };

  const onSubmit = async (data: ShippingFormData) => {
    console.log("🔥 FORM SUBMIT TRIGGERED!");
    console.log("📋 Form data:", data);

    if (Object.keys(errors).length > 0) {
      console.error("❌ Form has validation errors:");
      console.table(errors);

      const errorFields = Object.keys(errors);
      toast.error(`Please fix these fields: ${errorFields.join(", ")}`);
      return;
    }

    if (!data.recipient_name || data.recipient_name.trim() === "") {
      console.error("❌ Critical validation: recipient_name is empty");
      toast.error("Please enter the recipient's full name");
      return;
    }

    if (deliveryOptions.length === 0) {
      console.log("⚠️ No delivery options, creating fallback...");
      const emergencyOptions: DeliveryOption[] = [
        {
          id: "emergency_standard",
          provider: "courier-guy",
          service_name: "Standard Delivery",
          price: 99,
          estimated_days: "3-5 days",
          description: "Standard nationwide delivery",
        },
      ];
      setDeliveryOptions(emergencyOptions);
    }

    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            shipping_address: {
              name: data.recipient_name,
              phone: data.phone,
              streetAddress: data.street_address,
              apartment: data.apartment,
              city: data.city,
              province: data.province,
              postalCode: data.postal_code,
              additional_info: data.additional_info,
            },
          })
          .eq("id", user.id);
      }

      const optionsToPass =
        deliveryOptions.length > 0
          ? deliveryOptions
          : [
              {
                id: "default_standard",
                provider: "courier-guy" as const,
                service_name: "Standard Delivery",
                price: 99,
                estimated_days: "3-5 days",
                description: "Standard nationwide delivery",
              },
            ];

      onComplete(data, optionsToPass);
      toast.success("Proceeding to delivery selection");
    } catch (error) {
      console.error("❌ Error processing shipping form:", error);
      toast.error("Failed to process shipping information");
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
        <form
          onSubmit={handleSubmit(onSubmit, (validationErrors) => {
            console.error("🚨 FORM VALIDATION FAILED:");
            console.table(validationErrors);

            const firstError = Object.entries(validationErrors)[0];
            if (firstError && firstError[1]?.message) {
              toast.error(`Please complete: ${firstError[1].message}`, {
                description: "All required fields must be filled",
              });
            } else {
              toast.error(
                `Please fix these fields: ${Object.keys(validationErrors).join(", ")}`,
              );
            }
          })}
          className="space-y-6"
        >
          {savedAddress && !isEditingAddress && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-green-800 mb-2">
                    Using Saved Address
                  </h3>
                  <div className="text-sm text-green-700">
                    <p>{savedAddress.name}</p>
                    <p>{savedAddress.streetAddress}</p>
                    <p>
                      {savedAddress.apartment && `${savedAddress.apartment}, `}
                      {savedAddress.city}, {savedAddress.province}{" "}
                      {savedAddress.postalCode}
                    </p>
                    <p>{savedAddress.phone}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEditAddress}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          )}

          {(!savedAddress || isEditingAddress) && (
            <>
              {savedAddress && isEditingAddress && (
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Edit Shipping Address</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseSavedAddress}
                  >
                    Use Saved Address
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-medium text-lg">Contact Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipient_name">
                      Full Name *{" "}
                      {!manualEntries.name && hasAutofilled && (
                        <span className="text-xs text-blue-600">
                          (from account)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="recipient_name"
                      {...register("recipient_name")}
                      placeholder="Enter recipient's full name"
                      className={errors.recipient_name ? "border-red-500" : ""}
                      onChange={(e) => {
                        register("recipient_name").onChange(e);
                        if (!manualEntries.name) {
                          setManualEntries((prev) => ({ ...prev, name: true }));
                        }
                      }}
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
                      {...register("phone")}
                      placeholder="e.g., 081 234 5678"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg">Delivery Address</h3>

                <div>
                  <Label htmlFor="street_address">Street Address *</Label>
                  <input
                    ref={addressInputRef}
                    {...register("street_address", {
                      required: "Street address is required",
                    })}
                    type="text"
                    placeholder="Enter your complete street address manually"
                    className={`w-full p-3 border rounded-lg bg-white ${
                      errors.street_address
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-book-500 focus:border-book-500`}
                    style={{ fontSize: "16px" }}
                    autoComplete="street-address"
                    required
                  />
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
                      {...register("city")}
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
                    <Select
                      value={watchedValues.province || ""}
                      onValueChange={(value) => {
                        setValue("province", value, { shouldValidate: true });
                        setTimeout(() => {
                          if (watchedValues.city && watchedValues.postal_code) {
                            getDeliveryQuotes();
                          }
                        }, 100);
                      }}
                    >
                      <SelectTrigger>
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
                      <p className="text-sm text-red-600 mt-1">
                        {errors.province.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      {...register("postal_code")}
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

              <div>
                <Label htmlFor="additional_info">
                  Additional Information (Optional)
                </Label>
                <Textarea
                  id="additional_info"
                  {...register("additional_info")}
                  placeholder="e.g., Building entrance details, security gate code, access instructions..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include any helpful details for pickup/delivery (gate codes, building access, etc.)
                </p>
              </div>

              <div>
                <Label htmlFor="special_instructions">
                  Special Delivery Instructions (Optional)
                </Label>
                <Textarea
                  id="special_instructions"
                  {...register("special_instructions")}
                  placeholder="e.g., Leave with security, ring doorbell twice, call before delivery"
                  rows={3}
                />
              </div>
            </>
          )}

          {deliveryOptions.length === 0 &&
            !isLoadingQuotes &&
            watchedValues.city &&
            watchedValues.province && (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    Get Delivery Quotes
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Click below to get delivery options for your address.
                  </p>
                  <Button
                    type="button"
                    onClick={() => getDeliveryQuotes()}
                    disabled={isLoadingQuotes}
                    variant="outline"
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    {isLoadingQuotes ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting Quotes...
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 mr-2" />
                        Get Delivery Options
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          {deliveryOptions.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Truck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Great!</strong> We found {deliveryOptions.length}{" "}
                delivery option{deliveryOptions.length !== 1 ? "s" : ""} for
                your address. You'll choose your preferred delivery method in
                the next step.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Truck className="w-4 h-4" />
            <AlertDescription>
              We'll find the best delivery options for your location. Delivery
              times may vary based on your area and the courier service.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={isLoading || isLoadingQuotes}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isLoadingQuotes ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting Delivery Options...
              </>
            ) : deliveryOptions.length > 0 ? (
              <>
                Continue to Delivery Selection
                <span className="ml-2">
                  ({deliveryOptions.length} option
                  {deliveryOptions.length !== 1 ? "s" : ""} available)
                </span>
              </>
            ) : (
              <>Continue (Get delivery options on next step)</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedShippingForm;
