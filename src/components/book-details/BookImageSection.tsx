import BookImageCarousel from "@/components/BookImageCarousel";
import { Book } from "@/types/book";

interface BookImageSectionProps {
  book: Book;
}

const BookImageSection = ({ book }: BookImageSectionProps) => {
  const images = [book.frontCover, book.backCover, book.insidePages]
    .filter(Boolean)
    .slice(0, 3) as string[]; // Limit to maximum 3 images

  return (
    <div className="space-y-4">
      <BookImageCarousel images={images} />
    </div>
  );
};

export default BookImageSection;
