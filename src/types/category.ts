export type CategoryType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BrandType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
