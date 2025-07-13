import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, Trash2 } from "lucide-react";
import { Book } from "@/types/book";

interface UnavailableBookCardProps {
  book: Book;
  onEdit?: (bookId: string) => void;
  onDelete?: (bookId: string, bookTitle: string) => void;
  isOwnProfile?: boolean;
}

const UnavailableBookCard = ({
  book,
  onEdit,
  onDelete,
  isOwnProfile = false,
}: UnavailableBookCardProps) => {
  return (
    <Card className="overflow-hidden relative opacity-60 grayscale">
      {/* Unavailable Overlay */}
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-white rounded-lg p-4 m-4 text-center shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <MapPin className="h-5 w-5 text-orange-600 mr-2" />
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800"
            >
              Unavailable
            </Badge>
          </div>
          <p className="text-sm text-gray-700 font-medium">
            Seller must add a pickup address to activate this listing
          </p>
        </div>
      </div>

      <div className="relative">
        <img
          src={book.frontCover || book.imageUrl || "/placeholder.svg"}
          alt={book.title}
          width="300"
          height="192"
          className="w-full h-48 object-cover"
          loading="lazy"
          decoding="async"
        />
        {isOwnProfile && (
          <div className="absolute top-2 right-2 flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(book.id);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0 bg-red-600/90 hover:bg-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(book.id, book.title);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-gray-600 mb-2">by {book.author}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-green-600">
            R{book.price.toFixed(2)}
          </span>
          <Badge variant="outline" className="text-xs">
            {book.condition}
          </Badge>
        </div>

        {book.category && (
          <Badge variant="secondary" className="text-xs mb-2">
            {book.category}
          </Badge>
        )}

        {(book.grade || book.universityYear) && (
          <div className="text-sm text-gray-500">
            {book.grade || book.universityYear}
          </div>
        )}

        {isOwnProfile && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center text-orange-700 mb-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Action Required</span>
            </div>
            <p className="text-xs text-orange-600">
              Add a pickup address in your profile to reactivate this listing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnavailableBookCard;
