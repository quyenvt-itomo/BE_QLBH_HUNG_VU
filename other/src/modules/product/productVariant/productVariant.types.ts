export const PRODUCT_VARIANT_TYPES = {
  ProductVariantService: Symbol.for("ProductVariantService"),
  ProductVariantController: Symbol.for("ProductVariantController"),
  ProductVariantRepository: Symbol.for("ProductVariantRepository"),
  ProductVariantRouter: Symbol.for("ProductVariantRouter"),
};
export interface ProductVariantSnapshot {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    code: string;
    hasVariant?: boolean;
    category: {
      id: string;
      name: string;
    };
    unit: {
      id: string;
      name: string;
    };
  };
  sku?: string | null;
  barcode?: string | null;
  costPrice: number;
  price: number;
  options?: {
    type: {
      id: string;
      name: string;
    };
    value: string;
    typeIndex: number;
  }[];

  isActive: boolean;
}
