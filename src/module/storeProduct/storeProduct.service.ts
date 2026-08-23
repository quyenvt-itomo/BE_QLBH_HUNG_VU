import { StoreProduct } from "@/database/models/store/StoreProduct";
import { SimpleService } from "../_shared/simple.service";
import { StoreProductRepository } from "./storeProduct.repository";
export class StoreProductService extends SimpleService<StoreProduct> { constructor(repository: StoreProductRepository) { super(repository, "store"); } }
