import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerRepository } from "./partner.repository";
import { PARTNER_TYPES } from "./partner.types";
import { Partner } from "@/database/models/company/Partner";
import { PartnerContact } from "@/database/models/company/PartnerContact";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
} from "@/shared/types/errors";
import { withTransaction } from "@/shared/base/TransactionManager";

/**
 * Partner Service
 */
@injectable()
export class PartnerService extends BaseService<Partner> {
  protected repository: PartnerRepository;
  protected uniqueFields: (keyof Partner)[] = ["code"];
  protected uniqueScope?: (keyof Partner)[] | undefined = ["companyId"];
  protected searchableFields = [
    "name",
    "code",
    "email",
    "phone",
    "taxCode",
    "note",
  ];

  constructor(
    @inject(PARTNER_TYPES.PartnerRepository)
    repository: PartnerRepository,
  ) {
    super();
    this.repository = repository;
  }

  async getPublicByTaxCode(
    taxCode: string,
    companyId: string,
  ): Promise<Partner | null> {
    return this.repository.findByTaxCode(taxCode, companyId);
  }

  async update(
    id: string,
    data: DeepPartial<Partner>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Partner | null> {
    const runWithManager = async (trxManager: EntityManager) => {
      const trashFileIds = this.collectTrashFileIds(data as any);
      const rawData = data as Record<string, any>;
      const contacts = Array.isArray(rawData.contacts)
        ? (rawData.contacts as DeepPartial<PartnerContact>[])
        : undefined;

      delete rawData.contacts;

      await this.validateBeforeUpdate(id, data, trxManager, req);

      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const existingEntity = await this.repository.findById(id, trxManager);
        if (!existingEntity) return null;

        const dataWithScope: any = { ...data, id };
        if (this.uniqueScope && this.uniqueScope.length > 0) {
          for (const scopeField of this.uniqueScope) {
            if (dataWithScope[scopeField] === undefined) {
              dataWithScope[scopeField] = existingEntity[scopeField];
            }
          }
        }

        const errs = await this.checkExistInDb(
          dataWithScope,
          this.uniqueFields as any,
          (this.uniqueScope as any) || [],
        );
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }

      const refErrs = await this.checkReferencesInDb(
        { ...data, id },
        trxManager,
      );
      if (refErrs && refErrs.length > 0)
        throw new ValidationError("input.invalid", refErrs);

      const updatedEntity = await this.repository.update(id, data, trxManager);
      if (!updatedEntity) return null;

      if (contacts) {
        await this.syncContacts(id, contacts, trxManager);
      }

      await this.actionAfterUpdate(updatedEntity, trxManager, req);
      const fullData = await this.repository.findById(
        updatedEntity.id,
        trxManager,
      );

      await this.deleteTrashFiles(trashFileIds);

      return fullData;
    };

    return manager
      ? await runWithManager(manager)
      : await withTransaction(runWithManager);
  }

  async getContacts(partnerId: string): Promise<PartnerContact[]> {
    return this.repository
      .getContactRepository()
      .find({ where: { partnerId } });
  }

  async createContact(
    partnerId: string,
    data: DeepPartial<PartnerContact>,
    req?: RequestContext,
  ): Promise<PartnerContact> {
    const partner = await this.repository.findById(partnerId);
    if (!partner) throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y Ä‘á»‘i tÃ¡c");
    return this.repository.getContactRepository().save({ ...data, partnerId });
  }

  async updateContact(
    partnerId: string,
    contactId: string,
    data: DeepPartial<PartnerContact>,
    req?: RequestContext,
  ): Promise<PartnerContact> {
    const repo = this.repository.getContactRepository();
    const contact = await repo.findOne({ where: { id: contactId, partnerId } });
    if (!contact)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i liÃªn há»‡");
    return repo.save({ ...contact, ...data });
  }

  async deleteContact(partnerId: string, contactId: string): Promise<void> {
    const repo = this.repository.getContactRepository();
    const contact = await repo.findOne({ where: { id: contactId, partnerId } });
    if (!contact)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i liÃªn há»‡");
    await repo.remove(contact);
  }

  private async syncContacts(
    partnerId: string,
    incoming: DeepPartial<PartnerContact>[],
    manager: EntityManager,
  ): Promise<void> {
    const repo = this.repository.getContactRepository(manager);
    const existing = await repo.find({ where: { partnerId } as any });
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const incomingIds = new Set(
      incoming.map((item) => item.id).filter((id): id is string => !!id),
    );

    const invalidIds = Array.from(incomingIds).filter(
      (contactId) => !existingById.has(contactId),
    );
    if (invalidIds.length > 0) {
      throw new BadRequestError("Dữ liệu không hợp lệ", [
        {
          field: "contacts",
          message: "Có người liên hệ không thuộc đối tác này",
        },
      ]);
    }

    const removedIds = existing
      .filter((item) => !incomingIds.has(item.id))
      .map((item) => item.id);
    if (removedIds.length > 0) {
      await manager.softDelete(PartnerContact, removedIds);
    }

    const toSave = incoming.map((item) => ({
      id: item.id,
      partnerId,
      name: item.name,
      phone: item.phone ?? null,
      email: item.email ?? null,
      banks: item.banks ?? [],
    }));

    if (toSave.length > 0) {
      await repo.save(toSave as any);
    }
  }

  async validateBeforeCreate(
    data: DeepPartial<Partner>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Partner>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
