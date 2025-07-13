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

interface AddressEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: AddressData | null;
  onSave: (pickup: Address, shipping: Address, same: boolean) => Promise<void>;
  isLoading: boolean;
}

const AddressEditDialog = ({
  isOpen,
  onClose,
  addressData,
  onSave,
  isLoading,
}: AddressEditDialogProps) => {
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

  useEffect(() => {
    if (isOpen && addressData) {
      // Handle pickup address with proper field mapping and defaults
      if (addressData.pickup_address) {
        const pickupData = addressData.pickup_address;
        setPickupAddress({
          street: pickupData.street || pickupData.streetAddress || "",
          city: pickupData.city || "",
          province: pickupData.province || "",
          postalCode: pickupData.postalCode || "",
        });
      } else {
        // Reset to empty values if no pickup address
        setPickupAddress({
          street: "",
          city: "",
          province: "",
          postalCode: "",
        });
      }

      // Handle shipping address with proper field mapping and defaults
      if (addressData.shipping_address) {
        const shippingData = addressData.shipping_address;
        setShippingAddress({
          street: shippingData.street || shippingData.streetAddress || "",
          city: shippingData.city || "",
          province: shippingData.province || "",
          postalCode: shippingData.postalCode || "",
        });
      } else {
        // Reset to empty values if no shipping address
        setShippingAddress({
          street: "",
          city: "",
          province: "",
          postalCode: "",
        });
      }

      setSameAsPickup(addressData.addresses_same || false);
    } else {
      // Reset all values when dialog is closed or no address data
      setPickupAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
      });
      setShippingAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
      });
      setSameAsPickup(false);
    }
  }, [isOpen, addressData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !pickupAddress.street ||
      !pickupAddress.city ||
      !pickupAddress.province ||
      !pickupAddress.postalCode
    ) {
      toast.error("Please fill in all pickup address fields");
      return;
    }

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

    try {
      // Ensure we're passing the correct format with streetAddress field
      const formattedPickupAddress = {
        ...pickupAddress,
        streetAddress: pickupAddress.street, // Map street to streetAddress for backend compatibility
      };

      const formattedShippingAddress = sameAsPickup
        ? formattedPickupAddress
        : {
            ...shippingAddress,
            streetAddress: shippingAddress.street, // Map street to streetAddress for backend compatibility
          };

      await onSave(
        formattedPickupAddress,
        formattedShippingAddress,
        sameAsPickup,
      );
      onClose();
    } catch (error) {
      console.error("Error in AddressEditDialog:", error);
      // Error handling is done in the parent component, but we need to ensure
      // the dialog stays open for the user to retry or cancel
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 text-book-600 mr-2" />
            Edit Addresses
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pickup Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="pickup-street">Street Address</Label>
                <Input
                  id="pickup-street"
                  value={pickupAddress.street || ""}
                  onChange={(e) =>
                    setPickupAddress((prev) => ({
                      ...prev,
                      street: e.target.value,
                    }))
                  }
                  placeholder="Enter street address"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="pickup-city">City</Label>
                <Input
                  id="pickup-city"
                  value={pickupAddress.city || ""}
                  onChange={(e) =>
                    setPickupAddress((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="Enter city"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <ProvinceSelector
                  label="Province"
                  value={pickupAddress.province || ""}
                  onValueChange={(value) =>
                    setPickupAddress((prev) => ({
                      ...prev,
                      province: value,
                    }))
                  }
                  placeholder="Select province"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="pickup-postal">Postal Code</Label>
                <Input
                  id="pickup-postal"
                  value={pickupAddress.postalCode || ""}
                  onChange={(e) =>
                    setPickupAddress((prev) => ({
                      ...prev,
                      postalCode: e.target.value,
                    }))
                  }
                  placeholder="Enter postal code"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Same as pickup checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-address"
              checked={sameAsPickup}
              onCheckedChange={(checked) => setSameAsPickup(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="same-address">
              Shipping address is the same as pickup address
            </Label>
          </div>

          {/* Shipping Address */}
          {!sameAsPickup && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="shipping-street">Street Address</Label>
                  <Input
                    id="shipping-street"
                    value={shippingAddress.street || ""}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    placeholder="Enter street address"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-city">City</Label>
                  <Input
                    id="shipping-city"
                    value={shippingAddress.city || ""}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Enter city"
                    required
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-postal">Postal Code</Label>
                  <Input
                    id="shipping-postal"
                    value={shippingAddress.postalCode || ""}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    placeholder="Enter postal code"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-book-600 hover:bg-book-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Addresses"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressEditDialog;
