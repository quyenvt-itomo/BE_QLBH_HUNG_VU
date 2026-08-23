export const nullUuidMap = {
  incomeCategory: "00000000-0000-4000-8000-000000000001",
  expenseCategory: "00000000-0000-4000-8000-000000000002",
};

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum IdentificationType {
  CCCD = "cccd", // Căn cước công dân
  CMND = "cmnd", // Chứng minh nhân dân
  HC = "hc", // Hộ chiếu
}

export enum TransactionType {
  IN = "in",
  OUT = "out",
}

export enum RateType {
  AMOUNT = "amount",
  PERCENT = "percent",
}

export enum DebtSide {
  RECEIVABLE = "receivable",
  PAYABLE = "payable",
}
