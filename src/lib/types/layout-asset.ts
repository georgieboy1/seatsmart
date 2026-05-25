/**
 * A vendor's item placed at a specific coordinate on a layout.
 *
 * v0 design: `assetName` is free text. v1 will replace with a
 * `vendorItemId` foreign key into a `vendor_items` catalog table once
 * that exists.
 *
 * Coordinates use the same "row,column" geometry the seating algorithm
 * uses for assignments (see src/lib/seating/geometry.ts → positionKey).
 */
export type LayoutAssetRotation = 0 | 90 | 180 | 270;

export const LAYOUT_ASSET_ROTATIONS: readonly LayoutAssetRotation[] = [
  0,
  90,
  180,
  270,
] as const;

export type LayoutAsset = {
  id: string;
  layoutId: string;
  vendorId: string;
  /** Free-text display name. Will become a vendor_items FK in v1. */
  assetName: string;
  positionRow: number;
  positionColumn: number;
  rotationDegrees: LayoutAssetRotation;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewLayoutAsset = Omit<
  LayoutAsset,
  "id" | "createdAt" | "updatedAt"
>;
