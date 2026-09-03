export const PARTNER_FIELD_LIMITS = {
  name: 255,
  code: 50,
  email: 255,
  phone: 50,
  taxCode: 20,
  gender: 20,
  groupName: 255,
  contactName: 255,
  contactEmail: 255,
  contactPhone: 50,
  identityCode: 20,
  representativeName: 255,
  representativeEmail: 255,
  representativePhone: 50,
  representativeIdentityCode: 20,
} as const;

export const PARTNER_FIELD_LABELS = {
  name: "Tên",
  code: "Mã",
  email: "Email",
  phone: "Số điện thoại",
  taxCode: "Mã số thuế",
  gender: "Giới tính",
  groupName: "Tên nhóm",
  contactName: "Tên người liên hệ",
  contactEmail: "Email người liên hệ",
  contactPhone: "Số điện thoại người liên hệ",
  identityCode: "CCCD/CMND",
  representativeName: "Tên người đại diện",
  representativeEmail: "Email người đại diện",
  representativePhone: "Số điện thoại người đại diện",
  representativeIdentityCode: "CCCD/CMND người đại diện",
} as const;

export type PartnerField = keyof typeof PARTNER_FIELD_LIMITS;

export const partnerMaxLengthMessage = (field: PartnerField): string =>
  `${PARTNER_FIELD_LABELS[field]} có độ dài tối đa là ${PARTNER_FIELD_LIMITS[field]} ký tự`;
