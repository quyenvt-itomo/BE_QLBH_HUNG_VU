import fs from "node:fs";

const products = [
  {
    id: 20,
    name: "Bột rút thép loại 2",
    code: "BRT-L2",
    current_price: 9000,
    vat: null,
    image: null,
    packing_standard: null,
    note: null,
    type: "sub_material",
    parent_id: null,
    is_public: false,
    unit: {
      id: 1,
      name: "kg",
      is_default: false,
    },
    extra_units: [],
    bom: null,
    product_group: {
      id: 18,
      name: "Bột",
      type: "sub_material",
    },
    parent: null,
    product_histories: [
      {
        id: 21,
        price: 9000,
        time_at: "2025-10-20T04:14:13.856Z",
        product_id: 20,
      },
    ],
    stock_trackings: [],
    stock_trackings_child: [],
    current_balance: 0,
  },
  {
    id: 19,
    name: "Bột rút thép loại 1",
    code: "BRT-L1",
    current_price: 12000,
    vat: null,
    image: null,
    packing_standard: null,
    note: null,
    type: "sub_material",
    parent_id: null,
    is_public: false,
    unit: {
      id: 1,
      name: "kg",
      is_default: false,
    },
    extra_units: [],
    bom: null,
    product_group: {
      id: 18,
      name: "Bột",
      type: "sub_material",
    },
    parent: null,
    product_histories: [
      {
        id: 20,
        price: 12000,
        time_at: "2025-10-20T04:13:38.867Z",
        product_id: 19,
      },
    ],
    stock_trackings: [],
    stock_trackings_child: [],
    current_balance: 0,
  },
];
function getBaseCode(code: string) {
  return code.replace(/\s*\([^)]*\)\s*$/, "");
}

function getBaseName(name: string) {
  return name.replace(/\s*\([^)]*\)\s*$/, "");
}

function printForExcel(products: any[]) {
  const groups = new Map<string, any[]>();

  for (const product of products) {
    const code = getBaseCode(product.code);

    if (!groups.has(code)) {
      groups.set(code, []);
    }

    groups.get(code)!.push(product);
  }

  // ================= Sheet 1 =================

  const productHeaders = [
    "Mã hàng hóa (*)",
    "Tên hàng hóa (*)",
    "Loại (*)",
    "Nhóm hàng hóa",
    "Đơn vị tính",
    "Giá",
    "%VAT",
    "Công khai",
    "Ghi chú",
  ];

  const productRows: string[] = [];

  for (const [code, items] of groups) {
    const main =
      items.find((x) => x.unit?.name?.toLowerCase() === "kg") ?? items[0];

    productRows.push(
      [
        code,
        getBaseName(main.name),
        "Thành phẩm",
        main.product_group?.name ?? "",
        "kg",
        main.current_price ?? 0,
        main.vat ?? "",
        main.is_public ? "Có" : "Không",
        main.note ?? "",
      ].join("\t"),
    );
  }

  // ================= Sheet 2 =================

  const unitHeaders = [
    "Mã hàng hóa (*)",
    "Tên đơn vị tính (*)",
    "Tỷ lệ quy đổi (*)",
    "Giá",
  ];

  const unitRows: string[] = [];

  for (const [code, items] of groups) {
    for (const item of items) {
      if (item.unit?.name?.toLowerCase() === "kg") {
        continue;
      }

      unitRows.push([code, item.unit?.name ?? "", 1, ""].join("\t"));
    }
  }

  return {
    products: [productHeaders.join("\t"), ...productRows].join("\n"),
    units: [unitHeaders.join("\t"), ...unitRows].join("\n"),
  };
}

const result = printForExcel(products);

fs.writeFileSync("seeds/products.tsv", result.products, "utf8");
fs.writeFileSync("seeds/product-units.tsv", result.units, "utf8");

console.log("Xuất thành công!");
