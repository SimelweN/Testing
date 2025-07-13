import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookFormData } from "@/types/book";
import {
  calculateCommission,
  calculateSellerReceives,
} from "@/services/book/bookUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PricingSectionProps {
  formData: BookFormData;
  errors: Record<string, string>;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export const PricingSection = ({
  formData,
  errors,
  onInputChange,
}: PricingSectionProps) => {
  const isMobile = useIsMobile();
  const commission = calculateCommission(formData.price);
  const sellerReceives = calculateSellerReceives(formData.price);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow empty string for clearing the field
    if (value === "") {
      const modifiedEvent = {
        ...e,
        target: {
          ...e.target,
          value: "",
          name: "price",
        },
      };
      onInputChange(modifiedEvent);
      return;
    }

    // Only allow numbers, decimal point, and remove invalid characters
    // This regex allows: digits, one decimal point, and removes everything else
    value = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      // Remove extra decimal points (keep only the first one)
      const firstDecimalIndex = value.indexOf(".");
      value =
        value.substring(0, firstDecimalIndex + 1) +
        value.substring(firstDecimalIndex + 1).replace(/\./g, "");
    }

    // Limit to 2 decimal places
    const decimalIndex = value.indexOf(".");
    if (decimalIndex !== -1 && value.length > decimalIndex + 3) {
      value = value.substring(0, decimalIndex + 3);
    }

    // Remove leading zeros except for decimal cases like "0.50"
    if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
      value = value.substring(1);
    }

    // Validate the final value is a valid number
    const numericValue = parseFloat(value);
    if (value !== "" && (isNaN(numericValue) || numericValue < 0)) {
      // If invalid, don't update
      return;
    }

    // Ensure reasonable maximum (prevent extremely large numbers)
    if (numericValue > 999999) {
      value = "999999";
    }

    // Create a modified event with the cleaned value
    const modifiedEvent = {
      ...e,
      target: {
        ...e.target,
        value: value,
        name: "price",
      },
    };

    onInputChange(modifiedEvent);
  };

  const handlePriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Clear the field if it's 0 to make it easier to type
    if (e.target.value === "0") {
      const modifiedEvent = {
        target: {
          value: "",
          name: "price",
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(modifiedEvent);
    }
  };

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If the field is empty on blur, set it back to 0
    if (e.target.value === "") {
      const modifiedEvent = {
        target: {
          value: "0",
          name: "price",
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(modifiedEvent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      [8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }

    // Allow decimal point only if there isn't one already
    if (e.key === "." && !e.currentTarget.value.includes(".")) {
      return;
    }

    // Ensure that it is a number and stop the keypress if not
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <Label
        htmlFor="price"
        className={`${isMobile ? "text-sm" : "text-base"} font-medium`}
      >
        Price (R) <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          R
        </span>
        <Input
          id="price"
          name="price"
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]{0,2}"
          value={formData.price === 0 ? "" : formData.price.toString()}
          onChange={handlePriceChange}
          onFocus={handlePriceFocus}
          onBlur={handlePriceBlur}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          className={`pl-8 ${errors.price ? "border-red-500" : ""} ${isMobile ? "h-12 text-base" : ""}`}
          style={{ fontSize: isMobile ? "16px" : undefined }} // Prevents zoom on iOS
          autoComplete="off"
          required
        />
      </div>
      {errors.price && (
        <p className={`${isMobile ? "text-xs" : "text-sm"} text-red-500 mt-1`}>
          {errors.price}
        </p>
      )}

      {formData.price > 0 && (
        <div
          className={`mt-3 p-3 bg-gray-50 rounded-lg border ${isMobile ? "text-sm" : ""}`}
        >
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Book price:</span>
              <span className="font-medium">R{formData.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission (10%):</span>
              <span className="text-red-600">-R{commission.toFixed(2)}</span>
            </div>
            <div className="border-t pt-1 flex justify-between">
              <span className="font-medium text-green-700">You receive:</span>
              <span className="font-bold text-green-700">
                R{sellerReceives.toFixed(2)}
              </span>
            </div>
          </div>
          <p
            className={`${isMobile ? "text-xs" : "text-sm"} text-gray-500 mt-2`}
          >
            The commission helps us maintain the platform and provide secure
            transactions.
          </p>
        </div>
      )}
    </div>
  );
};
