import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProvinceSelector } from "@/components/ui/province-selector";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Address, AddressData } from "@/types/address";

interface SimpleAddressEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: AddressData | null;
  onSave: (pickup: Address, shipping: Address, same: boolean) => Promise<void>;
  isLoading: boolean;
}

const SimpleAddressEditDialog = ({
  isOpen,
  onClose,
  addressData,
  onSave,
  isLoading,
}: SimpleAddressEditDialogProps) => {
  const [pickupAddress, setPickupAddress] = useState({
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && addressData) {
      // Handle pickup address
      if (addressData.pickup_address) {
        const pickup = addressData.pickup_address;
        setPickupAddress({
          street: pickup.street || "",
          city: pickup.city || "",
          province: pickup.province || "",
          postalCode: pickup.postalCode || pickup.postal_code || "",
        });
      }

      // Handle shipping address
      if (addressData.shipping_address) {
        const shipping = addressData.shipping_address;
        setShippingAddress({
          street: shipping.street || "",
          city: shipping.city || "",
          province: shipping.province || "",
          postalCode: shipping.postalCode || shipping.postal_code || "",
        });
      }

      // Check if addresses are the same
      const pickup = addressData.pickup_address;
      const shipping = addressData.shipping_address;
      if (pickup && shipping) {
        const isSame =
          pickup.street === shipping.street &&
          pickup.city === shipping.city &&
          pickup.province === shipping.province &&
          pickup.postalCode === shipping.postalCode;
        setSameAsPickup(isSame);
      }
    }
  }, [isOpen, addressData]);

  useEffect(() => {
    if (sameAsPickup) {
      setShippingAddress({ ...pickupAddress });
    }
  }, [sameAsPickup, pickupAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate pickup address
    if (
      !pickupAddress.street ||
      !pickupAddress.city ||
      !pickupAddress.province ||
      !pickupAddress.postalCode
    ) {
      toast.error("Please fill in all pickup address fields");
      return;
    }

    // Validate shipping address if not using same address
    if (
      !sameAsPickup &&
      (!shippingAddress.street ||
        !shippingAddress.city ||
        !shippingAddress.province ||
        !shippingAddress.postalCode)
    ) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalShippingAddress = sameAsPickup
        ? pickupAddress
        : shippingAddress;
      await onSave(pickupAddress, finalShippingAddress, sameAsPickup);
      toast.success("Addresses updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving addresses:", error);
      toast.error("Failed to save addresses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-book-600" />
            Edit Addresses
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📍 <strong>Google Maps Integration:</strong> Coming soon! For now,
              please enter addresses manually.
            </p>
          </div>

          {/* Pickup Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-book-600" />
              Pickup Address *
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup-street">Street Address *</Label>
                <Input
                  id="pickup-street"
                  value={pickupAddress.street}
                  onChange={(e) =>
                    setPickupAddress({
                      ...pickupAddress,
                      street: e.target.value,
                    })
                  }
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup-city">City *</Label>
                <Input
                  id="pickup-city"
                  value={pickupAddress.city}
                  onChange={(e) =>
                    setPickupAddress({ ...pickupAddress, city: e.target.value })
                  }
                  placeholder="Johannesburg"
                  required
                />
              </div>
              <div>
                <ProvinceSelector
                  label="Province"
                  value={pickupAddress.province || ""}
                  onValueChange={(value) =>
                    setPickupAddress((prev) => ({ ...prev, province: value }))
                  }
                  placeholder="Select province"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup-postal">Postal Code *</Label>
                <Input
                  id="pickup-postal"
                  value={pickupAddress.postalCode}
                  onChange={(e) =>
                    setPickupAddress({
                      ...pickupAddress,
                      postalCode: e.target.value,
                    })
                  }
                  placeholder="2000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Same Address Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="same-address"
              checked={sameAsPickup}
              onCheckedChange={(checked) => setSameAsPickup(checked === true)}
            />
            <Label htmlFor="same-address" className="font-medium">
              📦 Shipping address is the same as pickup address
            </Label>
          </div>

          {/* Shipping Address */}
          {!sameAsPickup && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-book-600" />
                Shipping Address *
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping-street">Street Address *</Label>
                  <Input
                    id="shipping-street"
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        street: e.target.value,
                      })
                    }
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-city">City *</Label>
                  <Input
                    id="shipping-city"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value,
                      })
                    }
                    placeholder="Johannesburg"
                    required
                  />
                </div>
                <div>
                  <ProvinceSelector
                    label="Province"
                    value={shippingAddress.province || ""}
                    onValueChange={(value) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        province: value,
                      }))
                    }
                    placeholder="Select province"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-postal">Postal Code *</Label>
                  <Input
                    id="shipping-postal"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="2000"
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="bg-book-600 hover:bg-book-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Save Addresses
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleAddressEditDialog;
