import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Download,
  Play,
  FileText,
  Clock,
  Users,
  Star,
  Crown,
} from "lucide-react";
import { StudyResource } from "@/types/university";

interface StudyResourceCardProps {
  resource: StudyResource;
}

const StudyResourceCard = ({ resource }: StudyResourceCardProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "download":
        return <Download className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-800";
      case "pdf":
        return "bg-blue-100 text-blue-800";
      case "download":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className={`h-full hover:shadow-md transition-shadow ${resource.isSponsored ? "ring-2 ring-yellow-200 bg-gradient-to-br from-yellow-50/30 to-orange-50/30" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              {resource.isSponsored && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 text-xs"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Sponsored
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant="secondary"
                className={getTypeColor(resource.type)}
              >
                {getTypeIcon(resource.type)}
                <span className="ml-1 capitalize">{resource.type}</span>
              </Badge>
              <Badge
                variant="outline"
                className={getDifficultyColor(resource.difficulty)}
              >
                {resource.difficulty}
              </Badge>
              {resource.duration && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {resource.duration}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
            <div className="flex flex-wrap gap-1">
              {resource.tags?.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {resource.tags && resource.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{resource.tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {resource.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{resource.rating}/5</span>
                </div>
              )}
              {resource.provider && <span>by {resource.provider}</span>}
            </div>
            <Button size="sm" asChild className="min-h-[44px] px-4">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                {getTypeIcon(resource.type)}
                <span>Access</span>
              </a>
            </Button>
          </div>

          {resource.isSponsored && resource.sponsorName && (
            <div className="flex items-center justify-between pt-2 border-t border-yellow-200">
              <div className="flex items-center gap-2">
                {resource.sponsorLogo && (
                  <img
                    src={resource.sponsorLogo}
                    alt={resource.sponsorName}
                    className="w-4 h-4 object-contain"
                  />
                )}
                <span className="text-xs text-gray-500">
                  Sponsored by {resource.sponsorName}
                </span>
              </div>

              {resource.sponsorUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  asChild
                >
                  <a
                    href={resource.sponsorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {resource.sponsorCta || "Visit Sponsor"}
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyResourceCard;
