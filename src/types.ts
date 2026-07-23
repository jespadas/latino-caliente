export type LanguageCode = 'fr' | 'es' | 'en';

export type ResourceKey = 'teachers' | 'courses' | 'news' | 'pricing-plans' | 'pages' | 'settings';

export type AdminProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
};

export type Teacher = {
  id: string;
  full_name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  description?: string | null;
  specialties?: string[] | null;
  levels?: string[] | null;
  photo_url?: string | null;
  instagram_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  teacher?: Pick<Teacher, 'id' | 'full_name' | 'slug' | 'photo_url'> | null;
};

export type Course = {
  id: string;
  title: string;
  title_fr?: string | null;
  title_es?: string | null;
  title_en?: string | null;
  slug?: string;
  dance_style: string;
  dance_style_fr?: string | null;
  dance_style_es?: string | null;
  dance_style_en?: string | null;
  level: string;
  level_fr?: string | null;
  level_es?: string | null;
  level_en?: string | null;
  description?: string | null;
  teacher_id?: string | null;
  weekday: number;
  starts_at: string;
  ends_at: string;
  room?: string | null;
  capacity?: number | null;
  price_note?: string | null;
  is_new?: boolean;
  sort_order?: number;
  is_active?: boolean;
  teacher?: Pick<Teacher, 'id' | 'full_name' | 'slug' | 'photo_url'> | null;
};

export type NewsPost = {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  cover_image_url?: string | null;
  document_url?: string | null;
  gallery_image_urls?: string[] | null;
  support_links?: Array<{ label: string; url: string; kind?: string }> | null;
  document_links?: Array<{ label: string; url: string }> | null;
  category?: string;
  status?: 'draft' | 'published';
  published_at?: string | null;
};

export type PricingPlan = {
  id: string;
  title: string;
  slug?: string;
  normal_price: string;
  reduced_price?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  hero_image_url?: string | null;
  document_url?: string | null;
  gallery_image_urls?: string[] | null;
  support_links?: Array<{ label: string; url: string; kind?: string }> | null;
  document_links?: Array<{ label: string; url: string }> | null;
  status?: 'draft' | 'published';
  show_in_nav?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  published_at?: string | null;
};

export type SiteSetting = {
  id: string;
  setting_key: string;
  group_name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'url' | 'image' | 'file' | 'number';
  value?: string | null;
  sort_order?: number;
  is_public?: boolean;
};

export type ResourceRecord = Teacher | Course | NewsPost | PricingPlan | Page | SiteSetting;

export type RecordsByResource = {
  teachers: EditableRecord[];
  courses: EditableRecord[];
  news: EditableRecord[];
  'pricing-plans': EditableRecord[];
  pages: EditableRecord[];
  settings: EditableRecord[];
};

export type EditableRecord = Partial<Teacher & Course & NewsPost & PricingPlan & Page & SiteSetting> & {
  id?: string;
  [key: string]: unknown;
};

export type UploadResult = {
  path: string;
  publicUrl: string;
};




