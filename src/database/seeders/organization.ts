import { Organization, OrganizationTypeEnum } from "../models/Organization";
import { roleSeeder } from "./role";
import { DeepPartial } from "typeorm";

export const organizationSeeder: DeepPartial<Organization>[] = [
  {
    code: "TA-DA",
    type: OrganizationTypeEnum.HEADQUARTER,
    name: "CÔNG TY CỔ PHẦN THÉP ĐÔNG ANH",
    responsibility: "Chịu trách nhiệm toàn bộ hệ thống",
    industry: null,
    establishment: "2015-08-20",
    address: {
      state: "Thành phố Hà Nội",
      ward: "Xã Phúc Thịnh",
      detail: "Cụm CN ô tô 1-5",
      isPermanent: false,
    },
    phone: "02439686769",
    roles: roleSeeder,
    isDefault: true,
  },
];
