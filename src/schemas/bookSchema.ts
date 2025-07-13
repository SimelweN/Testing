
import { z } from 'zod';

export const BookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  frontCover: z.string().optional(),
  backCover: z.string().optional(),
  insidePages: z.string().optional(),
});

export type BookInput = z.infer<typeof BookSchema>;
