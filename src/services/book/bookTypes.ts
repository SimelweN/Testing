export interface BookFilters {
  search?: string;
  category?: string;
  condition?: string;
  grade?: string;
  universityYear?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
}

export interface BookQueryResult {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image_url?: string;
  front_cover?: string;
  back_cover?: string;
  inside_pages?: string;
  sold: boolean;
  created_at: string;
  grade?: string;
  university_year?: string;
  university?: string;
  province?: string;
  seller_id: string;
  profiles?: ProfileData | null;
}
