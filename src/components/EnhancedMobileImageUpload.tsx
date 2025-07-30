import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Eye, 
  Loader2, 
  Camera, 
  Image, 
  RotateCcw, 
  Smartphone,
  Monitor,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface BookImages {
  frontCover: string;
  backCover: string;
  insidePages: string;
}

interface EnhancedMobileImageUploadProps {
  images?: string[] | BookImages;
  onImagesChange: (images: string[] | BookImages) => void;
  maxImages?: number;
  className?: string;
  variant?: "array" | "object";
  currentImages?: BookImages;
  disabled?: boolean;
}

const EnhancedMobileImageUpload = ({
  images,
  onImagesChange,
  maxImages = 3,
  className = "",
  variant = "object",
  currentImages,
  disabled = false,
}: EnhancedMobileImageUploadProps) => {
  const [isUploading, setIsUploading] = useState<{ [key: number]: boolean }>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showOrientationGuide, setShowOrientationGuide] = useState<number | null>(null);
  
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cameraInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const frontCameraInputRefs = useRef<(HTMLInputElement | null)[]>([]);
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
        .slice(0, 3);
    }
    return ((images || []) as string[]).slice(0, 3);
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
    { 
      label: "Front Cover", 
      index: 0, 
      description: "Clear photo of book front",
      orientation: "portrait",
      tips: "Hold phone vertically, ensure good lighting"
    },
    { 
      label: "Back Cover", 
      index: 1, 
      description: "Clear photo of book back",
      orientation: "portrait", 
      tips: "Hold phone vertically, capture entire back cover"
    },
    { 
      label: "Inside Pages", 
      index: 2, 
      description: "Open book showing content",
      orientation: "landscape",
      tips: "Hold phone horizontally, show 2 pages clearly"
    },
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
        cacheControl: "31536000",
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

    // Hide orientation guide
    setShowOrientationGuide(null);

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
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, HEIC, WebP)");
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
      // Reset the inputs
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

  const triggerCameraInput = (index: number, facingMode: 'user' | 'environment' = 'environment') => {
    // Show orientation guide before opening camera
    setShowOrientationGuide(index);
    
    setTimeout(() => {
      const inputRef = facingMode === 'user' 
        ? frontCameraInputRefs.current[index]
        : cameraInputRefs.current[index];
      
      if (inputRef) {
        inputRef.click();
      }
    }, 500); // Small delay to show the guide
  };

  const OrientationGuide = ({ slot }: { slot: typeof slots[0] }) => (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center gap-2 mb-2">
          {slot.orientation === 'portrait' ? (
            <Smartphone className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
          <span className="font-medium">
            Hold phone {slot.orientation === 'portrait' ? 'vertically' : 'horizontally'}
          </span>
        </div>
        <p className="text-sm">{slot.tips}</p>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Orientation Guide */}
      {showOrientationGuide !== null && (
        <OrientationGuide slot={slots[showOrientationGuide]} />
      )}

      <div
        className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-3 gap-6"}`}
      >
        {slots.map((slot) => {
          const index = slot.index;
          const hasImage = imageArray[index];
          const isCurrentlyUploading = isUploading[index];

          return (
            <div key={slot.label} className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className={`font-medium text-center ${isMobile ? "text-sm" : "text-base"}`}>
                  {slot.label} <span className="text-red-500">*</span>
                </h3>
                <Badge variant="outline" className="text-xs">
                  {slot.orientation === 'portrait' ? (
                    <Smartphone className="h-3 w-3 mr-1" />
                  ) : (
                    <Monitor className="h-3 w-3 mr-1" />
                  )}
                  {slot.orientation}
                </Badge>
              </div>

              <Card
                className={`${isMobile ? "h-48" : "h-48"} transition-all duration-200 hover:shadow-md border-2 ${
                  hasImage ? 'border-green-200' : 'border-dashed border-gray-300'
                }`}
              >
                <CardContent className="p-4 h-full">
                  {hasImage ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 relative">
                        <img
                          src={hasImage}
                          alt={slot.label}
                          className={`w-full h-32 object-cover rounded mb-3 cursor-pointer shadow-sm`}
                          loading="lazy"
                          decoding="async"
                          onClick={() => setPreviewImage(hasImage)}
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setPreviewImage(hasImage)}
                          className="flex-1 h-10 text-xs touch-manipulation"
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
                            className="flex-1 h-10 text-xs touch-manipulation"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                        {isCurrentlyUploading ? (
                          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      {/* Hidden file inputs */}
                      <input
                        ref={(el) => (fileInputRefs.current[index] = el)}
                        type="file"
                        accept="image/*,image/heic,image/heif,image/webp"
                        onChange={(e) => handleFileUpload(e, index)}
                        className="hidden"
                        disabled={isCurrentlyUploading || disabled}
                      />
                      
                      <input
                        ref={(el) => (cameraInputRefs.current[index] = el)}
                        type="file"
                        accept="image/*,image/heic,image/heif,image/webp"
                        onChange={(e) => handleFileUpload(e, index)}
                        className="hidden"
                        disabled={isCurrentlyUploading || disabled}
                        capture="environment"
                      />

                      <input
                        ref={(el) => (frontCameraInputRefs.current[index] = el)}
                        type="file"
                        accept="image/*,image/heic,image/heif,image/webp"
                        onChange={(e) => handleFileUpload(e, index)}
                        className="hidden"
                        disabled={isCurrentlyUploading || disabled}
                        capture="user"
                      />

                      {isMobile ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isCurrentlyUploading || disabled}
                              className="w-full h-12 text-sm touch-manipulation"
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
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64" align="center">
                            <DropdownMenuLabel className="text-xs text-gray-500">
                              Choose Photo Source
                            </DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => triggerFileInput(index)}
                              className="cursor-pointer"
                            >
                              <Image className="mr-2 h-4 w-4 text-green-600" />
                              <div className="flex-1">
                                <div className="font-medium">Choose from Gallery</div>
                                <div className="text-xs text-gray-500">Browse saved photos</div>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => triggerCameraInput(index, 'environment')}
                              className="cursor-pointer"
                            >
                              <Camera className="mr-2 h-4 w-4 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium">Back Camera</div>
                                <div className="text-xs text-gray-500">Best for book photos</div>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => triggerCameraInput(index, 'user')}
                              className="cursor-pointer"
                            >
                              <RotateCcw className="mr-2 h-4 w-4 text-purple-600" />
                              <div className="flex-1">
                                <div className="font-medium">Front Camera</div>
                                <div className="text-xs text-gray-500">Selfie camera</div>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCurrentlyUploading || disabled}
                          onClick={() => triggerFileInput(index)}
                          className="w-full min-h-[44px] touch-manipulation"
                        >
                          {isCurrentlyUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {isCurrentlyUploading
                            ? "Uploading..."
                            : `Upload ${slot.label}`}
                        </Button>
                      )}

                      <p className="text-xs text-gray-500 text-center">
                        {slot.description}
                      </p>
                      <p className="text-xs text-gray-400 text-center">
                        {isMobile
                          ? "Gallery or Camera • PNG, JPG up to 10MB"
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

      {/* Mobile Tips */}
      {isMobile && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Photo Tips:</strong> Use good lighting, hold steady, and make sure text is readable. 
            Gallery option lets you use photos you've already taken!
          </AlertDescription>
        </Alert>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <Button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white"
              variant="secondary"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMobileImageUpload;
