import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import SimpleAddressInput from "@/components/SimpleAddressInput";
import { AddressData, Address } from "@/types/address";

interface SimpleAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: AddressData;
  onSave: (pickup: Address, shipping: Address, same: boolean) => Promise<void>;
  isLoading?: boolean;
}

const SimpleAddressDialog = ({
  isOpen,
  onClose,
  addressData,
  onSave,
  isLoading = false,
}: SimpleAddressDialogProps) => {
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with existing data
  useEffect(() => {
    if (addressData) {
      setPickupAddress(addressData.pickup_address);
      setShippingAddress(addressData.shipping_address);
      setSameAsPickup(addressData.same_as_pickup || false);
    }
  }, [addressData]);

  const handlePickupAddressSelect = (address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    formattedAddress: string;
  }) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setPickupAddress(formattedAddress);

    if (sameAsPickup) {
      setShippingAddress(formattedAddress);
    }
  };

  const handleShippingAddressSelect = (address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    formattedAddress: string;
  }) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setShippingAddress(formattedAddress);
  };

  const handleSameAsPickupChange = (checked: boolean) => {
    setSameAsPickup(checked);
    if (checked && pickupAddress) {
      setShippingAddress(pickupAddress);
    }
  };

  const handleSave = async () => {
    if (!pickupAddress || !shippingAddress) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(pickupAddress, shippingAddress, sameAsPickup);
      onClose();
    } catch (error) {
      console.error("Error saving addresses:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = pickupAddress && shippingAddress;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl lg:max-w-4xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Addresses</DialogTitle>
          <DialogDescription>
            Set your pickup and shipping addresses. The pickup address is where
            buyers can collect books, and the shipping address is where you want
            to receive deliveries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pickup Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pickup Address</h3>
            <p className="text-sm text-gray-600 mb-4">
              This is where buyers can meet you to collect their books
            </p>
            <SimpleAddressInput
              label="Pickup Address"
              required
              onAddressSelect={handlePickupAddressSelect}
              defaultValue={pickupAddress || undefined}
            />
          </div>

          <Separator />

          {/* Same as Pickup Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-pickup"
              checked={sameAsPickup}
              onCheckedChange={handleSameAsPickupChange}
            />
            <Label htmlFor="same-as-pickup" className="text-sm font-medium">
              Use pickup address for shipping
            </Label>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Shipping Address
              {sameAsPickup && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Same as pickup)
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This is where you want to receive books that are shipped to you
            </p>
            {!sameAsPickup ? (
              <SimpleAddressInput
                label="Shipping Address"
                required
                onAddressSelect={handleShippingAddressSelect}
                defaultValue={shippingAddress || undefined}
              />
            ) : (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">
                  Shipping address will be the same as pickup address
                </p>
                {pickupAddress && (
                  <p className="text-sm font-medium mt-2">
                    {[
                      pickupAddress.street,
                      pickupAddress.city,
                      pickupAddress.province,
                      pickupAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving || isLoading}
            className="bg-book-600 hover:bg-book-700"
          >
            {(isSaving || isLoading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Addresses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleAddressDialog;
