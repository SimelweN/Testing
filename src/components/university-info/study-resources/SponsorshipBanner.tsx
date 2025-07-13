import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Star, Heart, ExternalLink } from "lucide-react";

const SponsorshipBanner = () => {
  return (
    <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Sponsor Opportunity
              </Badge>
            </div>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Want to sponsor this space or add your student-focused content?
            </h3>

            <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
              Join us in supporting South African students! Share your
              educational resources, study tools, or student services with our
              growing community of learners.
            </p>

            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>Support students</span>
              </div>
              <div className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span>Reach 10,000+ students</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>Featured content</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="lg:flex-shrink-0">
            <Button
              size="lg"
              className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              asChild
            >
              <a
                href="mailto:sponsor@rebookedsolutions.co.za?subject=Sponsorship%20Inquiry%20-%20Study%20Resources&body=Hi%20there,%0A%0AI'm%20interested%20in%20sponsoring%20the%20Study%20Resources%20section%20or%20adding%20student-focused%20content.%0A%0APlease%20let%20me%20know%20more%20about%20the%20opportunities%20available.%0A%0AThanks!"
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Get in Touch</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">
            What you can sponsor:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs bg-white">
              Study Tips & Guides
            </Badge>
            <Badge variant="outline" className="text-xs bg-white">
              Educational Tools
            </Badge>
            <Badge variant="outline" className="text-xs bg-white">
              Learning Resources
            </Badge>
            <Badge variant="outline" className="text-xs bg-white">
              Student Services
            </Badge>
            <Badge variant="outline" className="text-xs bg-white">
              Featured Banners
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SponsorshipBanner;
