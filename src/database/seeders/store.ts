import { DeepPartial } from "typeorm";
import { Store } from "../models/Store";

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
  },
];
