
import { Book } from '@/types/book';

interface BookDescriptionProps {
  book: Book;
}

const BookDescription = ({ book }: BookDescriptionProps) => {
  if (!book.description) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Description</h3>
      <p className="text-gray-700 leading-relaxed">{book.description}</p>
    </div>
  );
};

export default BookDescription;
