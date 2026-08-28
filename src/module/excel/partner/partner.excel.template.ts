import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import { IsNull } from "typeorm";
import { RequestContext } from "@/shared/types/interfaces";
import { Partner, PartnerType } from "@/database/models/Partner";
import { DebtSide, TransactionType } from "@/shared/constants/enum";
import { DebtTransaction } from "@/database/models/DebtTransaction";
import { PartnerService } from "@/module/partner/partner.service";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PartnerContactRepository } from "@/module/partnerContact/partnerContact.repository";
import { PARTNER_CONTACT_TYPES } from "@/module/partnerContact/partnerContact.types";
import { DebtAdjustmentRepository } from "@/module/debtAdjustment/debtAdjustment.repository";
import { DEBT_ADJUSTMENT_TYPES } from "@/module/debtAdjustment/debtAdjustment.types";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats, formatHeader } from "../excel.dropdown";
import {
  PARTNER_ADDRESS_COLUMNS,
  PARTNER_BANK_COLUMNS,
  PARTNER_COLUMNS,
  PARTNER_CONTACT_COLUMNS,
  PARTNER_SHEET_NAMES,
} from "./partner.excel.types";

@injectable()
export class PartnerExcelTemplate {
  constructor(
    @inject(PARTNER_TYPES.PartnerService)
    private partnerService: PartnerService,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
    @inject(DEBT_ADJUSTMENT_TYPES.Repository)
    private debtAdjustmentRepository: DebtAdjustmentRepository,
  ) {}

  async generateTemplate(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const main = this.createSheet(workbook, PARTNER_SHEET_NAMES.MAIN, PARTNER_COLUMNS);
    main.addRow({
      type: "Khách hàng",
      code: "KH001",
      name: "Đối tác mẫu",
      isOrganization: "Tổ chức",
      groupName: "Nhóm mẫu",
      phone: "0900000000",
      receivableDebtAmount: 0,
      payableDebtAmount: 0,
      note: "Dòng mẫu, có thể xóa trước khi nhập",
    });
    this.applyRowsValidation(main, PARTNER_COLUMNS);

    const address = this.createSheet(workbook, PARTNER_SHEET_NAMES.ADDRESSES, PARTNER_ADDRESS_COLUMNS);
    address.addRow({ partnerCode: "KH001", state: "Hà Nội", ward: "Phường mẫu", detail: "Số nhà mẫu", isPermanent: "Có" });
    this.applyRowsValidation(address, PARTNER_ADDRESS_COLUMNS);

    const contacts = this.createSheet(workbook, PARTNER_SHEET_NAMES.CONTACTS, PARTNER_CONTACT_COLUMNS);
    contacts.addRow({ partnerCode: "KH001", name: "Người liên hệ mẫu", phone: "0900000001" });
    this.applyRowsValidation(contacts, PARTNER_CONTACT_COLUMNS);

    const banks = this.createSheet(workbook, PARTNER_SHEET_NAMES.BANKS, PARTNER_BANK_COLUMNS);
    banks.addRow({ partnerCode: "KH001", bankName: "Ngân hàng mẫu", accountNumber: "0123456789", accountHolder: "Đối tác mẫu" });
    this.applyRowsValidation(banks, PARTNER_BANK_COLUMNS);

    const guide = workbook.addWorksheet(PARTNER_SHEET_NAMES.GUIDE);
    guide.addRow(["HƯỚNG DẪN NHẬP ĐỐI TÁC"]);
    guide.addRow(["Sheet Đối tác: mỗi dòng là một khách hàng, nhà cung cấp hoặc đơn vị vận chuyển. Mã có thể để trống để hệ thống tự sinh; tên và loại là bắt buộc."]);
    guide.addRow(["Sheet Địa chỉ, Người liên hệ, Ngân hàng: dùng Mã đối tác để liên kết về sheet Đối tác. Có thể có nhiều dòng cho cùng một đối tác."]);
    guide.addRow(["Công nợ phải thu/phải trả là số dư theo toàn hệ thống, không theo cửa hàng. Khi import, hệ thống tạo phiếu điều chỉnh để đưa số dư hiện tại về đúng giá trị trong file."]);
    guide.addRow(["Để cập nhật đối tác, ưu tiên giữ nguyên Mã đối tác. Nếu bỏ trống mã, hệ thống dò theo số điện thoại hoặc email."]);
    guide.getColumn(1).width = 120;
    guide.getRow(1).font = { bold: true, size: 14 };
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
    sheetColumns?: Record<string, ExportColumnConfig[]>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const result = await this.partnerService.findAllWithPagination(
      { ...(filters || {}), page: 1, size: 1000000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const partners = result.data || [];
    const balances = await this.getDebtBalances();
    const mainColumns = columns.length ? columns : PARTNER_COLUMNS;
    const addressColumns = sheetColumns?.[PARTNER_SHEET_NAMES.ADDRESSES]?.length
      ? sheetColumns[PARTNER_SHEET_NAMES.ADDRESSES]
      : PARTNER_ADDRESS_COLUMNS;
    const contactColumns = sheetColumns?.[PARTNER_SHEET_NAMES.CONTACTS]?.length
      ? sheetColumns[PARTNER_SHEET_NAMES.CONTACTS]
      : PARTNER_CONTACT_COLUMNS;
    const bankColumns = sheetColumns?.[PARTNER_SHEET_NAMES.BANKS]?.length
      ? sheetColumns[PARTNER_SHEET_NAMES.BANKS]
      : PARTNER_BANK_COLUMNS;

    const main = this.createSheet(workbook, PARTNER_SHEET_NAMES.MAIN, mainColumns);
    const mainRows = new Map<string, number>();
    partners.forEach((partner: Partner) => {
      const balance = balances.get(partner.id) || { receivable: 0, payable: 0 };
      const row = main.addRow(this.partnerRow(partner, balance));
      mainRows.set(partner.code, row.number);
    });
    applyColumnFormats(main, mainColumns);

    const address = this.createSheet(workbook, PARTNER_SHEET_NAMES.ADDRESSES, addressColumns);
    partners.forEach((partner: Partner) => {
      (partner.addresses || []).forEach((item) => {
        const row = address.addRow({ partnerCode: partner.code, ...item, isPermanent: item.isPermanent ? "Có" : "Không" });
        this.linkToMain(row, partner.code, mainRows, PARTNER_SHEET_NAMES.MAIN);
      });
    });
    applyColumnFormats(address, addressColumns);

    const contactRows = await this.partnerContactRepository.getRepository().find({
      where: { deletedAt: IsNull() } as any,
      order: { createdAt: "ASC" } as any,
    });
    const contactsByPartner = new Map<string, any[]>();
    contactRows.forEach((contact) => {
      const items = contactsByPartner.get(contact.partnerId) || [];
      items.push(contact);
      contactsByPartner.set(contact.partnerId, items);
    });
    const contacts = this.createSheet(workbook, PARTNER_SHEET_NAMES.CONTACTS, contactColumns);
    partners.forEach((partner: Partner) => {
      (contactsByPartner.get(partner.id) || partner.contacts || []).forEach((contact: any) => {
        const bank = contact.banks?.[0] || {};
        const row = contacts.addRow({ partnerCode: partner.code, name: contact.name, phone: contact.phone || "", email: contact.email || "", ...bank });
        this.linkToMain(row, partner.code, mainRows, PARTNER_SHEET_NAMES.MAIN);
      });
    });
    applyColumnFormats(contacts, contactColumns);

    const bank = this.createSheet(workbook, PARTNER_SHEET_NAMES.BANKS, bankColumns);
    partners.forEach((partner: Partner) => {
      (partner.banks || []).forEach((item) => {
        const row = bank.addRow({ partnerCode: partner.code, ...item });
        this.linkToMain(row, partner.code, mainRows, PARTNER_SHEET_NAMES.MAIN);
      });
    });
    applyColumnFormats(bank, bankColumns);
    return workbook;
  }

  private partnerRow(partner: Partner, balance: { receivable: number; payable: number }): Record<string, any> {
    const representative = partner.representative || {};
    return {
      type: this.partnerTypeLabel(partner.type),
      code: partner.code,
      name: partner.name,
      isOrganization: partner.isOrganization ? "Tổ chức" : "Cá nhân",
      groupName: partner.group?.name || "",
      taxCode: partner.taxCode || "",
      phone: partner.phone || "",
      email: partner.email || "",
      maxDebtAmount: partner.maxDebtAmount,
      receivableDebtAmount: balance.receivable,
      payableDebtAmount: balance.payable,
      representativeName: representative.name || "",
      representativePosition: representative.position || "",
      representativePhone: representative.phone || "",
      representativeEmail: representative.email || "",
      representativeIdentityCode: representative.identityCode || "",
      note: partner.note || "",
    };
  }

  private async getDebtBalances(): Promise<Map<string, { receivable: number; payable: number }>> {
    const adjustmentRows = await this.debtAdjustmentRepository.getRepository().createQueryBuilder("adjustment")
      .select("adjustment.partnerId", "partnerId")
      .addSelect("adjustment.side", "side")
      .addSelect("COALESCE(SUM(adjustment.deltaAmount), 0)", "amount")
      .where("adjustment.deletedAt IS NULL")
      .andWhere("adjustment.partnerId IS NOT NULL")
      .groupBy("adjustment.partnerId")
      .addGroupBy("adjustment.side")
      .getRawMany();
    const transactionRows = await this.debtAdjustmentRepository.getRepository().manager.getRepository(DebtTransaction)
      .createQueryBuilder("transaction")
      .select("transaction.partnerId", "partnerId")
      .addSelect("transaction.side", "side")
      .addSelect("COALESCE(SUM(CASE WHEN transaction.type = :inType THEN transaction.amount ELSE -transaction.amount END), 0)", "amount")
      .where("transaction.deletedAt IS NULL")
      .groupBy("transaction.partnerId")
      .addGroupBy("transaction.side")
      .setParameter("inType", TransactionType.IN)
      .getRawMany();
    const balances = new Map<string, { receivable: number; payable: number }>();
    [...adjustmentRows, ...transactionRows].forEach((row: any) => {
      const current = balances.get(row.partnerId) || { receivable: 0, payable: 0 };
      if (row.side === DebtSide.RECEIVABLE) current.receivable = Number(row.amount) || 0;
      if (row.side === DebtSide.PAYABLE) current.payable = Number(row.amount) || 0;
      balances.set(row.partnerId, current);
    });
    return balances;
  }

  private partnerTypeLabel(type: PartnerType): string {
    if (type === PartnerType.SUPPLIER) return "Nhà cung cấp";
    if (type === PartnerType.SHIPPER) return "Đơn vị vận chuyển";
    return "Khách hàng";
  }

  private createSheet(workbook: ExcelJS.Workbook, name: string, columns: ExportColumnConfig[]): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.field,
      width: column.width || 15,
      ...(column.numberFormat ? { style: { numFmt: column.numberFormat } } : {}),
    }));
    formatHeader(sheet.getRow(1));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    if (columns.length) sheet.autoFilter = { from: "A1", to: `${this.columnName(columns.length)}1` };
    return sheet;
  }

  private applyRowsValidation(sheet: ExcelJS.Worksheet, columns: ExportColumnConfig[]): void {
    columns.forEach((column, index) => {
      if (!column.options?.length) return;
      for (let row = 2; row <= 200; row++) {
        sheet.getCell(row, index + 1).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"' + column.options.join(",") + '"'],
        };
      }
    });
  }

  private linkToMain(row: ExcelJS.Row, code: string, mainRows: Map<string, number>, sheetName: string): void {
    const mainRow = mainRows.get(code);
    if (mainRow) row.getCell(1).value = { text: code, hyperlink: `#'${sheetName}'!A${mainRow}` };
  }

  private columnName(index: number): string {
    let value = index;
    let result = "";
    while (value > 0) {
      const remainder = (value - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      value = Math.floor((value - 1) / 26);
    }
    return result;
  }
}
