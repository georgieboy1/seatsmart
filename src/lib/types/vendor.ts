/**
 * A marketplace vendor listing (catering, rentals, etc.).
 *
 * Each Vendor row is owned by an auth.users account (`userId`). Other
 * authenticated users can SELECT Vendor rows where `isPublished` is
 * true; the owner can SELECT their own drafts as well. Only the owner
 * can INSERT / UPDATE / DELETE their own listing.
 */
export type VendorType =
  | "catering"
  | "rental"
  | "flowers"
  | "av"
  | "staffing"
  | "other";

export const VENDOR_TYPES: readonly VendorType[] = [
  "catering",
  "rental",
  "flowers",
  "av",
  "staffing",
  "other",
] as const;

export type Vendor = {
  id: string;
  /** auth.users.id of the vendor account that owns this listing. */
  userId: string;
  name: string;
  vendorType: VendorType;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  serviceArea: string | null;
  /** Only published vendors appear in the marketplace discovery surface. */
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewVendor = Omit<
  Vendor,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
