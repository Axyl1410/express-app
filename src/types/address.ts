export type AddressType = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  province: string;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt: Date;
};
