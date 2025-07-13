
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from '@/types/book';

interface BookInfoProps {
  book: Book;
}

const BookInfo = ({ book }: BookInfoProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-4">by {book.author}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{book.category}</Badge>
          <Badge variant="outline">{book.condition}</Badge>
          {book.sold && <Badge variant="destructive">Sold</Badge>}
        </div>
      </div>

      {/* Book Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg">Book Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Category:</span>
              <p className="text-gray-600">{book.category}</p>
            </div>
            <div>
              <span className="font-medium">Condition:</span>
              <p className="text-gray-600">{book.condition}</p>
            </div>
            {book.universityYear && (
              <div>
                <span className="font-medium">University Year:</span>
                <p className="text-gray-600">{book.universityYear}</p>
              </div>
            )}
            {book.grade && (
              <div>
                <span className="font-medium">Grade:</span>
                <p className="text-gray-600">{book.grade}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookInfo;
