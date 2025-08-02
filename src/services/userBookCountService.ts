import { supabase } from '@/integrations/supabase/client';

/**
 * Service to check if this is a user's first book listing
 */

export const getUserBookCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('id', { count: 'exact' })
      .eq('seller_id', userId);

    if (error) {
      console.error('Error fetching user book count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Exception in getUserBookCount:', error);
    return 0;
  }
};

export const isFirstBookListing = async (userId: string): Promise<boolean> => {
  const bookCount = await getUserBookCount(userId);
  // After creating a book, count will be 1, so this is their first book
  return bookCount === 1;
};

export const hasListedBookseBefore = async (userId: string): Promise<boolean> => {
  const bookCount = await getUserBookCount(userId);
  // If they have more than 1 book, they've listed before
  return bookCount > 1;
};
