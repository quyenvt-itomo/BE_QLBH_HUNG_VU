import { Router, Request, Response } from "express";
import { IsNull } from "typeorm";
import DatabaseConfig from "@/config/database";
import { getCode } from "@/shared/utils/code.utils";
import { Product } from "@/database/models/Product";
import { Partner } from "@/database/models/Partner";
import { Attribute } from "@/database/models/Attribute";
import { Store } from "@/database/models/Store";
import { User } from "@/database/models/User";
import { Role } from "@/database/models/Role";
import { Fund } from "@/database/models/Fund";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { FundTransfer } from "@/database/models/FundTransfer";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { Order } from "@/database/models/store/Order";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { PartnerContact } from "@/database/models/PartnerContact";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { StoreUser } from "@/database/models/store/StoreUser";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { VatTransaction } from "@/database/models/VatTransaction";
import { PartnerDebtTransaction } from "@/database/models/DebtTransaction";

const router = Router();
const models = {
  product: Product, partner: Partner, attribute: Attribute, store: Store,
  user: User, role: Role, fund: Fund, fundAdjustment: FundAdjustment,
  fundTransfer: FundTransfer, incomeExpense: IncomeExpense,
  inventoryAdjustment: InventoryAdjustment, order: Order,
  priceHistory: ProductPriceHistory, partnerContact: PartnerContact,
  storeProduct: StoreProduct, storeUser: StoreUser, storeTransfer: StoreTransfer,
  storeTransferLine: StoreTransferLine, debtAdjustment: DebtAdjustment,
  vatAdjustment: VatAdjustment, vatTransaction: VatTransaction,
  partnerDebtTransaction: PartnerDebtTransaction,
} as const;

function repoFor(key: keyof typeof models) { return DatabaseConfig.getRepository(models[key]); }
function scopeWhere(req: Request, extra: Record<string, unknown> = {}) {
  const storeId = (req.headers["x-store-id"] || req.query.storeId || req.body?.storeId) as string | undefined;
  return storeId ? { ...extra, storeId, deletedAt: IsNull() } : { ...extra, deletedAt: IsNull() };
}

for (const [key] of Object.entries(models) as [keyof typeof models, unknown][]) {
  const path = `/${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  router.get(path, async (req, res, next) => { try { const data = await repoFor(key).find({ where: scopeWhere(req) as any, order: { createdAt: "DESC" } as any }); res.json({ statusCode: 200, success: true, message: "OK", data }); } catch (e) { next(e); } });
  router.get(`${path}/:id`, async (req, res, next) => { try { const data = await repoFor(key).findOne({ where: { id: req.params.id } as any }); if (!data) return res.status(404).json({ statusCode: 404, success: false, message: "not_found" }); res.json({ statusCode: 200, success: true, message: "OK", data }); } catch (e) { next(e); } });
  router.post(path, async (req, res, next) => { try { const data = await repoFor(key).save(repoFor(key).create(req.body)); res.status(201).json({ statusCode: 201, success: true, message: "created", data }); } catch (e) { next(e); } });
  router.patch(`${path}/:id`, async (req, res, next) => { try { await repoFor(key).update(req.params.id, req.body); const data = await repoFor(key).findOne({ where: { id: req.params.id } as any }); res.json({ statusCode: 200, success: true, message: "updated", data }); } catch (e) { next(e); } });
  router.delete(`${path}/:id`, async (req, res, next) => { try { await repoFor(key).softDelete(req.params.id); res.json({ statusCode: 200, success: true, message: "deleted", data: true }); } catch (e) { next(e); } });
}

router.get("/code", getCode);
router.get("/inventory/transactions", async (req, res, next) => { try { const where: any = { productId: req.query.productId, deletedAt: IsNull() }; if (req.query.storeId) where.storeId = req.query.storeId; const data = await DatabaseConfig.getRepository(InventoryTransaction).find({ where, order: { occurredAt: "ASC", createdAt: "ASC" } as any }); res.json({ statusCode: 200, success: true, message: "OK", data }); } catch (e) { next(e); } });
router.get("/inventory/report", async (_req, res, next) => { try { const data = await DatabaseConfig.getRepository(Product).find({ where: { deletedAt: IsNull() } as any }); res.json({ statusCode: 200, success: true, message: "OK", data }); } catch (e) { next(e); } });

export default router;
