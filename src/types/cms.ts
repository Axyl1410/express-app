export type StaticPageType = {
  id: string;
  title: string;
  slug: string;
  content: string;
  active: boolean;
  seoTitle?: string | null;
  seoDesc?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BannerType = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  position: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
