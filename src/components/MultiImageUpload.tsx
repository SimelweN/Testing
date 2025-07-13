import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Eye, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface BookImages {
  frontCover: string;
  backCover: string;
  insidePages: string;
}

interface MultiImageUploadProps {
  images?: string[] | BookImages;
  onImagesChange: (images: string[] | BookImages) => void;
  maxImages?: number;
  className?: string;
  variant?: "array" | "object";
  currentImages?: BookImages;
  disabled?: boolean;
}

const MultiImageUpload = ({
  images,
  onImagesChange,
  maxImages = 3,
  className = "",
  variant = "object",
  currentImages,
  disabled = false,
}: MultiImageUploadProps) => {
  const [isUploading, setIsUploading] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMobile = useIsMobile();

  // Convert images to array format for consistent handling
  const getImageArray = (): string[] => {
    if (variant === "object") {
      const bookImages = (currentImages || images) as BookImages;
      if (!bookImages) return [];
      return [
        bookImages.frontCover,
        bookImages.backCover,
        bookImages.insidePages,
      ]
        .filter(Boolean)
        .slice(0, 3); // Limit to 3 images
    }
    return ((images || []) as string[]).slice(0, 3); // Limit to 3 images
  };

  // Convert array back to appropriate format
  const updateImages = (newImages: string[]) => {
    if (variant === "object") {
      const bookImages: BookImages = {
        frontCover: newImages[0] || "",
        backCover: newImages[1] || "",
        insidePages: newImages[2] || "",
      };
      onImagesChange(bookImages);
    } else {
      onImagesChange(newImages);
    }
  };

  const imageArray = getImageArray();

  const slots = [
    { label: "Front Cover", index: 0 },
    { label: "Back Cover", index: 1 },
    { label: "Inside Pages", index: 2 },
  ];

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `book-images/${fileName}`;

    console.log("Starting image upload:", {
      fileName,
      fileSize: file.size,
      fileType: file.type,
    });

    const { error: uploadError } = await supabase.storage
      .from("book-images")
      .upload(filePath, file, {
        upsert: false,
        cacheControl: "31536000", // 1 year cache
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("book-images").getPublicUrl(filePath);

    console.log("Image uploaded successfully:", publicUrl);
    return publicUrl;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/heic",
      "image/heif",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, HEIC)");
      return;
    }

    setIsUploading((prev) => ({ ...prev, [index]: true }));

    try {
      const imageUrl = await uploadImage(file);
      const newImages = [...imageArray];
      newImages[index] = imageUrl;
      updateImages(newImages);
      toast.success(`${slots[index].label} uploaded successfully!`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(`Failed to upload ${slots[index].label}. Please try again.`);
    } finally {
      setIsUploading((prev) => ({ ...prev, [index]: false }));
      // Reset the input
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...imageArray];
    newImages[index] = "";
    updateImages(newImages);
    toast.success(`${slots[index].label} removed`);
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-3 gap-6"}`}
      >
        {slots.map((slot) => {
          const index = slot.index;
          const hasImage = imageArray[index];
          const isCurrentlyUploading = isUploading[index];

          return (
            <div key={slot.label} className="space-y-2">
              <h3
                className={`font-medium text-center ${isMobile ? "text-sm" : "text-base"}`}
              >
                {slot.label} <span className="text-red-500">*</span>
              </h3>

              <Card
                className={`${isMobile ? "h-40" : "h-48"} transition-all duration-200 hover:shadow-md`}
              >
                <CardContent className="p-4 h-full">
                  {hasImage ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 relative">
                        <img
                          src={hasImage}
                          alt={slot.label}
                          width="200"
                          height={isMobile ? "120" : "150"}
                          className={`w-full ${isMobile ? "h-24" : "h-32"} object-cover rounded mb-3 cursor-pointer shadow-sm`}
                          loading="lazy"
                          decoding="async"
                          onClick={() => setPreviewImage(hasImage)}
                        />
                      </div>
                      <div
                        className={`flex gap-2 justify-center ${isMobile ? "flex-row" : "flex-row"}`}
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setPreviewImage(hasImage)}
                          className={`${isMobile ? "flex-1 h-10 text-xs" : "min-h-[32px]"} touch-manipulation`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {!disabled && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className={`${isMobile ? "flex-1 h-10 text-xs" : "min-h-[32px]"} touch-manipulation`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center space-y-3">
                      <div
                        className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} bg-gray-100 rounded-lg mx-auto flex items-center justify-center`}
                      >
                        {isCurrentlyUploading ? (
                          <Loader2
                            className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-blue-500 animate-spin`}
                          />
                        ) : (
                          <Camera
                            className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-gray-400`}
                          />
                        )}
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={(el) => (fileInputRefs.current[index] = el)}
                        type="file"
                        accept="image/*,image/heic,image/heif"
                        onChange={(e) => handleFileUpload(e, index)}
                        className="hidden"
                        disabled={isCurrentlyUploading || disabled}
                        capture={isMobile ? "environment" : undefined}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        disabled={isCurrentlyUploading || disabled}
                        onClick={() => triggerFileInput(index)}
                        className={`w-full ${isMobile ? "h-12 text-sm" : "min-h-[44px]"} touch-manipulation`}
                      >
                        {isCurrentlyUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Camera className="h-4 w-4 mr-2" />
                        )}
                        {isCurrentlyUploading
                          ? "Uploading..."
                          : `Add ${slot.label}`}
                      </Button>

                      <p
                        className={`${isMobile ? "text-xs" : "text-xs"} text-gray-500 text-center`}
                      >
                        {isMobile
                          ? "PNG, JPG up to 10MB"
                          : "PNG, JPG up to 10MB"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <Button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 z-10"
              variant="secondary"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={previewImage}
              alt="Selected file preview"
              width="800"
              height="600"
              className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
