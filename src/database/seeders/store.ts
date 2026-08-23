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
      state: "Thành phố Quy Nhơn, Bình Định",
      ward: "Phường Trần Quang Diệu",
      detail: "25 Lạc Long Quân",
      isPermanent: false,
    },
    isActive: true,
  },
  {
    code: "TV",
    name: "THẾ VŨ",
    phone: "0905644431",
    email: null,
    taxCode: null,
    address: {
      state: "Thành phố Quy Nhơn, Bình Định",
      ward: "Phường Trần Hưng Đạo",
      detail: "466 Trần Hưng Đạo",
      isPermanent: false,
    },
    isActive: true,
  },
];
