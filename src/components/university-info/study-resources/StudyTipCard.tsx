import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BookOpen,
  Users,
  Star,
  Bookmark,
  ExternalLink,
  Crown,
} from "lucide-react";
import { StudyTip } from "@/types/university";

interface StudyTipCardProps {
  tip: StudyTip;
  isBookmarked?: boolean;
  onBookmark?: (tipId: string) => void;
}

const StudyTipCard = ({
  tip,
  isBookmarked = false,
  onBookmark,
}: StudyTipCardProps) => {
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

  const formatContent = (content: string) => {
    // Convert markdown-like formatting to JSX
    return content.split("\n").map((line, index) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <strong key={index} className="block mt-2 mb-1 text-gray-900">
            {line.slice(2, -2)}
          </strong>
        );
      }
      if (line.startsWith("• ")) {
        return (
          <li key={index} className="ml-4 text-gray-700">
            {line.slice(2)}
          </li>
        );
      }
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <p key={index} className="text-gray-700 mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <Card
      className={`h-full hover:shadow-md transition-shadow ${tip.isSponsored ? "ring-2 ring-yellow-200 bg-gradient-to-br from-yellow-50/30 to-orange-50/30" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{tip.title}</CardTitle>
              {tip.isSponsored && (
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
                className={getDifficultyColor(tip.difficulty)}
              >
                {tip.difficulty}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tip.estimatedTime}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {tip.category}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {tip.tags?.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tip.tags && tip.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tip.tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          {onBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBookmark(tip.id)}
              className={isBookmarked ? "text-yellow-600" : "text-gray-400"}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm space-y-2 max-h-64 overflow-y-auto">
          {formatContent(tip.content)}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          {tip.effectiveness && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {tip.effectiveness}% effective
              </span>
            </div>
          )}

          {tip.isSponsored && tip.sponsorName && (
            <div className="flex items-center gap-2">
              {tip.sponsorLogo && (
                <img
                  src={tip.sponsorLogo}
                  alt={tip.sponsorName}
                  className="w-4 h-4 object-contain"
                />
              )}
              <span className="text-xs text-gray-500">
                By {tip.sponsorName}
              </span>
              {tip.sponsorUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  asChild
                >
                  <a
                    href={tip.sponsorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {tip.sponsorCta || "Learn More"}
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

export default StudyTipCard;
