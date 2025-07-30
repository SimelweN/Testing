import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnhancedMobileImageUpload from "@/components/EnhancedMobileImageUpload";
import Layout from "@/components/Layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Smartphone, Monitor, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookImages {
  frontCover: string;
  backCover: string;
  insidePages: string;
}

const PhotoUploadDemo = () => {
  const [bookImages, setBookImages] = useState<BookImages>({
    frontCover: "",
    backCover: "",
    insidePages: "",
  });
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const getCompletedCount = () => {
    return Object.values(bookImages).filter(Boolean).length;
  };

  const isComplete = getCompletedCount() === 3;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                📸 Enhanced Photo Upload Demo
              </h1>
              <p className="text-gray-600 mb-4">
                {isMobile 
                  ? "Test the new mobile photo upload with gallery and camera options!" 
                  : "Test photo upload functionality (best experienced on mobile)"}
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge variant={isComplete ? "default" : "secondary"} className="px-4 py-2">
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : null}
                  {getCompletedCount()}/3 Photos Added
                </Badge>
                
                {isMobile && (
                  <Badge variant="outline" className="px-3 py-1">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mobile Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Features List */}
          {isMobile && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  ✨ New Mobile Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Choose photos from your gallery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Take photos with front or back camera</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Orientation guides for better photos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Support for HEIC, WebP, and all standard formats</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Component */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 Book Photo Upload
                {isMobile && (
                  <Badge variant="secondary" className="ml-auto">
                    Mobile Enhanced
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedMobileImageUpload
                currentImages={bookImages}
                onImagesChange={(images) => setBookImages(images as BookImages)}
                variant="object"
                maxImages={3}
              />
            </CardContent>
          </Card>

          {/* Orientation Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">Front & Back Cover</h3>
                <p className="text-sm text-gray-600">Hold phone vertically (portrait)</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200">
              <CardContent className="p-4 text-center">
                <Monitor className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium mb-1">Inside Pages</h3>
                <p className="text-sm text-gray-600">Hold phone horizontally (landscape)</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-1">Gallery Option</h3>
                <p className="text-sm text-gray-600">Browse and select saved photos</p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Results */}
          {isComplete && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Upload Complete! 🎉
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-700">
                <p>All three photos have been successfully uploaded. Great job!</p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {Object.entries(bookImages).map(([key, url]) => (
                    url && (
                      <div key={key} className="text-center">
                        <img 
                          src={url} 
                          alt={key}
                          className="w-full h-20 object-cover rounded border-2 border-green-300 mb-1"
                        />
                        <p className="text-xs font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">How to Test</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 space-y-2 text-sm">
              <p><strong>On Mobile:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Tap any "Add [Photo Type]" button</li>
                <li>Choose "Gallery" to browse saved photos</li>
                <li>Choose "Back Camera" for taking new photos</li>
                <li>Choose "Front Camera" for selfie mode</li>
                <li>Follow the orientation guides for best results</li>
              </ul>
              
              <p className="mt-3"><strong>On Desktop:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click to browse and upload files from your computer</li>
                <li>Supports all standard image formats</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PhotoUploadDemo;
