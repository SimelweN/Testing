import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createBook } from "@/services/book/bookMutations";
import { BookFormData } from "@/types/book";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import MultiImageUpload from "@/components/MultiImageUpload";
import FirstUploadSuccessDialog from "@/components/FirstUploadSuccessDialog";
import PostListingSuccessDialog from "@/components/PostListingSuccessDialog";
import ShareProfileDialog from "@/components/ShareProfileDialog";
import SellerPolicyModal from "@/components/SellerPolicyModal";
import CommitReminderModal from "@/components/CommitReminderModal";
import {
  hasCompletedFirstUpload,
  markFirstUploadCompleted,
} from "@/services/userPreferenceService";
import { BookInformationForm } from "@/components/create-listing/BookInformationForm";
import { PricingSection } from "@/components/create-listing/PricingSection";
import { BookTypeSection } from "@/components/create-listing/BookTypeSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { canUserListBooks } from "@/services/addressValidationService";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CreateListing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    description: "",
    price: 0,
    condition: "Good",
    category: "",
    grade: "",
    universityYear: "",
    imageUrl: "",
    frontCover: "",
    backCover: "",
    insidePages: "",
  });

  const [bookImages, setBookImages] = useState({
    frontCover: "",
    backCover: "",
    insidePages: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookType, setBookType] = useState<"school" | "university">("school");
  const [showFirstUploadDialog, setShowFirstUploadDialog] = useState(false);
  const [showPostListingDialog, setShowPostListingDialog] = useState(false);
  const [showShareProfileDialog, setShowShareProfileDialog] = useState(false);
  const [showSellerPolicyModal, setShowSellerPolicyModal] = useState(false);
  const [showCommitReminderModal, setShowCommitReminderModal] = useState(false);
  const [sellerPolicyAccepted, setSellerPolicyAccepted] = useState(false);
  const [canListBooks, setCanListBooks] = useState<boolean | null>(null);
  const [isCheckingAddress, setIsCheckingAddress] = useState(true);

  // Check if user can list books on component mount
  useEffect(() => {
    const checkAddressStatus = async () => {
      if (!user) {
        setCanListBooks(false);
        setIsCheckingAddress(false);
        return;
      }

      try {
        const canList = await canUserListBooks(user.id);
        setCanListBooks(canList);
      } catch (error) {
        console.error("Error checking address status:", error);
        setCanListBooks(false);
      } finally {
        setIsCheckingAddress(false);
      }
    };

    checkAddressStatus();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    let processedValue: string | number = value;

    if (name === "price") {
      // Handle price input more carefully
      const numericValue = parseFloat(value);
      processedValue = isNaN(numericValue) ? 0 : numericValue;
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleBookTypeChange = (type: "school" | "university") => {
    setBookType(type);
    if (type === "school") {
      setFormData({ ...formData, universityYear: "", university: "" });
    } else {
      setFormData({ ...formData, grade: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Valid price is required (must be greater than 0)";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.condition) newErrors.condition = "Condition is required";

    if (bookType === "school" && !formData.grade) {
      newErrors.grade = "Grade is required for school books";
    }

    if (!bookImages.frontCover)
      newErrors.frontCover = "Front cover photo is required";
    if (!bookImages.backCover)
      newErrors.backCover = "Back cover photo is required";
    if (!bookImages.insidePages)
      newErrors.insidePages = "Inside pages photo is required";

    if (!sellerPolicyAccepted)
      newErrors.sellerPolicy =
        "You must accept the Seller Policy and platform rules";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    if (!user) {
      toast.error("You must be logged in to create a listing");
      return;
    }

    // Check if user can list books before validating form
    if (canListBooks === false) {
      toast.error("❌ Please add a pickup address before listing your book.");
      navigate("/profile");
      return;
    }

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Please fill in all required fields and upload all photos");
      return;
    }

    setIsSubmitting(true);

    try {
      const bookData = {
        ...formData,
        frontCover: bookImages.frontCover,
        backCover: bookImages.backCover,
        insidePages: bookImages.insidePages,
      };

      // Additional validation for images
      if (
        !bookData.frontCover ||
        !bookData.backCover ||
        !bookData.insidePages
      ) {
        throw new Error(
          "All three book photos are required. Please upload front cover, back cover, and inside pages photos.",
        );
      }

      // Validate price
      if (!bookData.price || bookData.price <= 0) {
        throw new Error("Please enter a valid price greater than R0");
      }

      const createdBook = await createBook(bookData);
      toast.success("Your book has been listed successfully!", {
        description: "Students can now find and purchase your book.",
        duration: 5000,
      });

      // Show commit reminder modal first
      setShowCommitReminderModal(true);

      // Handle first upload workflow after commit reminder
      try {
        const hasCompleted = await hasCompletedFirstUpload(user.id);
        if (!hasCompleted) {
          await markFirstUploadCompleted(user.id);
        }
      } catch (prefError) {
        // Don't fail the whole process if preference tracking fails
        console.warn("Could not track first upload preference:", prefError);
      }

      // Reset form
      setFormData({
        title: "",
        author: "",
        description: "",
        price: 0,
        condition: "Good",
        category: "",
        grade: "",
        universityYear: "",
        university: "",
        imageUrl: "",
        frontCover: "",
        backCover: "",
        insidePages: "",
      });

      setBookImages({
        frontCover: "",
        backCover: "",
        insidePages: "",
      });

      setErrors({});
    } catch (error) {
      console.error("Error creating listing:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create listing. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p>You need to be signed in to create a listing.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className={`container mx-auto ${isMobile ? "px-2" : "px-4"} py-4 md:py-8 max-w-2xl`}
      >
        {/* Address Requirement Alert */}
        {!isCheckingAddress && canListBooks === false && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Pickup Address Required</span>
                  <p className="text-sm mt-1">
                    You need to set a pickup address in your profile before you
                    can list books for sale.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Go to Profile
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Address Check */}
        {isCheckingAddress && (
          <Alert className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Checking address requirements...
            </AlertDescription>
          </Alert>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            // Check if there's history to go back to
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              // If no history, navigate to home page
              navigate("/");
            }
          }}
          className={`mb-4 md:mb-6 text-book-600 hover:text-book-700 ${isMobile ? "h-10" : ""}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isMobile ? "" : "Back"}
        </Button>

        <div
          className={`bg-white rounded-lg shadow-md ${isMobile ? "p-4" : "p-8"}`}
        >
          <h1
            className={`${isMobile ? "text-xl" : "text-3xl"} font-bold text-book-800 mb-6 text-center`}
          >
            Create New Listing
          </h1>

          <form
            onSubmit={handleSubmit}
            className={`space-y-${isMobile ? "4" : "6"}`}
          >
            <div
              className={`grid grid-cols-1 ${isMobile ? "gap-4" : "md:grid-cols-2 gap-6"}`}
            >
              <BookInformationForm
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
              />

              <div className={`space-y-${isMobile ? "3" : "4"}`}>
                <PricingSection
                  formData={formData}
                  errors={errors}
                  onInputChange={handleInputChange}
                />

                <BookTypeSection
                  bookType={bookType}
                  formData={formData}
                  errors={errors}
                  onBookTypeChange={handleBookTypeChange}
                  onSelectChange={handleSelectChange}
                />
              </div>
            </div>

            <div>
              <MultiImageUpload
                currentImages={bookImages}
                onImagesChange={(images) =>
                  setBookImages(images as typeof bookImages)
                }
                variant="object"
                maxImages={3}
              />
              {(errors.frontCover ||
                errors.backCover ||
                errors.insidePages) && (
                <div className="mt-2 space-y-1">
                  {errors.frontCover && (
                    <p
                      className={`${isMobile ? "text-xs" : "text-sm"} text-red-500`}
                    >
                      {errors.frontCover}
                    </p>
                  )}
                  {errors.backCover && (
                    <p
                      className={`${isMobile ? "text-xs" : "text-sm"} text-red-500`}
                    >
                      {errors.backCover}
                    </p>
                  )}
                  {errors.insidePages && (
                    <p
                      className={`${isMobile ? "text-xs" : "text-sm"} text-red-500`}
                    >
                      {errors.insidePages}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="sellerPolicy"
                checked={sellerPolicyAccepted}
                onCheckedChange={(checked) =>
                  setSellerPolicyAccepted(checked === true)
                }
                className="mt-1 h-4 w-4"
                required
              />
              <div className="space-y-1">
                <Label
                  htmlFor="sellerPolicy"
                  className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowSellerPolicyModal(true)}
                    className="text-book-600 hover:text-book-800 underline font-medium"
                  >
                    Seller Policy and ReBooked's platform rules
                  </button>
                </Label>
                {errors.sellerPolicy && (
                  <p className="text-xs text-red-500">{errors.sellerPolicy}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isCheckingAddress ||
                canListBooks === false ||
                !sellerPolicyAccepted
              }
              className={`w-full transition-all duration-200 font-semibold ${
                canListBooks === false || !sellerPolicyAccepted
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-book-600 hover:bg-book-700 hover:shadow-lg active:scale-[0.98]"
              } text-white ${
                isMobile ? "py-4 h-12 text-base" : "py-4 text-lg"
              } touch-manipulation rounded-lg`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Listing...
                </>
              ) : isCheckingAddress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking Address...
                </>
              ) : canListBooks === false ? (
                "❌ Pickup Address Required"
              ) : !sellerPolicyAccepted ? (
                "Accept Policy to Continue"
              ) : (
                "📚 Create Listing"
              )}
            </Button>
          </form>
        </div>

        <FirstUploadSuccessDialog
          isOpen={showFirstUploadDialog}
          onClose={() => {
            setShowFirstUploadDialog(false);
            setShowShareProfileDialog(true);
          }}
        />

        <PostListingSuccessDialog
          isOpen={showPostListingDialog}
          onClose={() => setShowPostListingDialog(false)}
          onShareProfile={() => {
            setShowPostListingDialog(false);
            setShowShareProfileDialog(true);
          }}
        />

        <ShareProfileDialog
          isOpen={showShareProfileDialog}
          onClose={() => setShowShareProfileDialog(false)}
          userId={user?.id}
          userProfile={profile}
        />

        <SellerPolicyModal
          isOpen={showSellerPolicyModal}
          onClose={() => setShowSellerPolicyModal(false)}
        />

        <CommitReminderModal
          isOpen={showCommitReminderModal}
          onClose={() => {
            setShowCommitReminderModal(false);
            // Handle first upload workflow after commit reminder
            const handlePostCommitFlow = async () => {
              try {
                const hasCompleted = await hasCompletedFirstUpload(user.id);
                if (!hasCompleted) {
                  setShowFirstUploadDialog(true);
                } else {
                  setShowPostListingDialog(true);
                }
              } catch (prefError) {
                console.warn(
                  "Could not track first upload preference:",
                  prefError,
                );
                setShowPostListingDialog(true);
              }
            };
            handlePostCommitFlow();
          }}
          type="seller"
        />
      </div>
    </Layout>
  );
};

export default CreateListing;
