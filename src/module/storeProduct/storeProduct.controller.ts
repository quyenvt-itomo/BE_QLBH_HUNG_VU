import { StoreProduct } from "@/database/models/store/StoreProduct";
import { SimpleController } from "../_shared/simple.controller";
import { StoreProductService } from "./storeProduct.service";
export class StoreProductController extends SimpleController<StoreProduct> { constructor(service: StoreProductService) { super(service); } }
