import { DeepPartial } from "typeorm";
import { Store } from "../models/Store";
import { FundType } from "../models";

export const storeSeeders: DeepPartial<Store>[] = [
  {
    code: "PT",
    name: "PHÚC THỊNH",
    phone: "0766706668",
    email: null,
    taxCode: null,
    address: {
      state: "Tỉnh Gia Lai",
      ward: "Phường Quy Nhơn Bắc",
      detail: "25 Lạc Long Quân",
      isPermanent: false,
    },
    isActive: true,
    sortOrder: 10,

    funds: [
      {
        code: "TM-PT",
        name: "Tiền mặt",
        type: FundType.CASH,
        isDefault: true,
        isActive: true,
      },
    ],
  },
  {
    code: "TV",
    name: "THẾ VŨ",
    phone: "0905644431",
    email: null,
    taxCode: null,
    address: {
      state: "Tỉnh Gia Lai",
      ward: "Phường Quy Nhơn",
      detail: "466 Trần Hưng Đạo",
      isPermanent: false,
    },
    isActive: true,
    sortOrder: 20,

    funds: [
      {
        code: "TM-TV",
        name: "Tiền mặt",
        type: FundType.CASH,
        isDefault: true,
        isActive: true,
      },
    ],
  },
];
