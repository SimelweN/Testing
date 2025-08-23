import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Lock,
  Eye,
  BookOpen,
  Users,
  Database,
  AlertCircle,
  CheckCircle,
  Globe,
  Info,
} from "lucide-react";

interface TransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransparencyModal = ({ isOpen, onClose }: TransparencyModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Eye className="h-6 w-6 text-book-600" />
            Transparency & Privacy Information
          </DialogTitle>
          <DialogDescription>
            Learn about ReBooked Solutions and how we protect your information
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger value="about" className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              About Us
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="encryption" className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Data Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-book-600" />
                  About ReBooked Solutions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  ReBooked Solutions is a South African student-focused marketplace that connects 
                  students buying and selling textbooks across universities. Our mission is to make 
                  quality education more affordable and accessible by creating a trusted platform 
                  for textbook exchanges.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-book-600" />
                      What We Do
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Connect students across South African universities</li>
                      <li>• Facilitate secure textbook transactions</li>
                      <li>• Provide delivery and payment solutions</li>
                      <li>• Offer university-specific resources and information</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-book-600" />
                      Our Values
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Transparency in all operations</li>
                      <li>• Student-first approach</li>
                      <li>• Secure and trusted transactions</li>
                      <li>• Community building and support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  How We Protect Your Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Data Minimization</h4>
                      <p className="text-sm text-green-700">
                        We only collect information necessary for providing our services - no unnecessary data collection.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Purpose Limitation</h4>
                      <p className="text-sm text-blue-700">
                        Your data is used only for platform functionality, transactions, and communication - never for unauthorized purposes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Lock className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">No Third-Party Sharing</h4>
                      <p className="text-sm text-purple-700">
                        We never sell or share your personal information with third parties for marketing purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encryption" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Address Encryption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        AES-256 Encryption
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        End-to-End Protected
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Your delivery addresses are encrypted using military-grade AES-256 encryption before storage. 
                      Only authorized system processes can decrypt addresses for legitimate delivery purposes. 
                      Your address data is never stored in plain text.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Banking Details Encryption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Bank-Grade Security
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        PCI Compliant
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Banking information is encrypted using the same standards as major financial institutions. 
                      We use tokenization and encryption to ensure your banking details are never exposed. 
                      Payment processing is handled through PCI-compliant secure channels.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Access Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Access to encrypted data is strictly controlled through role-based permissions. 
                    Only essential system operations can access decrypted information, and all access 
                    is logged and monitored for security purposes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-book-600" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Core Platform Functions</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Account creation and authentication</li>
                      <li>• Book listing and marketplace functionality</li>
                      <li>• Transaction processing and order management</li>
                      <li>• Communication between buyers and sellers</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Service Delivery</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Address information for delivery coordination</li>
                      <li>• Banking details for secure payments</li>
                      <li>• Contact information for transaction updates</li>
                      <li>• Order tracking and delivery notifications</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Platform Improvement</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Anonymized usage analytics to improve user experience</li>
                      <li>• Security monitoring to protect against fraud</li>
                      <li>• Customer support and issue resolution</li>
                      <li>• Platform optimization and feature development</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-book-50 rounded-lg border border-book-200">
                  <h4 className="font-semibold text-book-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Your Rights
                  </h4>
                  <p className="text-sm text-book-700">
                    You have the right to access, update, or delete your personal information at any time. 
                    Contact our support team if you need assistance with your data or have privacy concerns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} className="bg-book-600 hover:bg-book-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransparencyModal;
