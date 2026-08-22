import * as fs from "fs";
import * as path from "path";
import logger from "@/shared/utils/logger";
import { Address } from "../base/BaseValidator";

// ============================================================
// Types
// ============================================================

interface LocationEntry {
  Name: string;
  Wards: { Name: string }[];
  Plates: number[];
}

interface ResolvedAddress {
  detail: string;
  ward: string;
  province: string;
}

// ============================================================
// Normalization helpers
// ============================================================

const PROVINCE_PREFIXES = [
  "tỉnh",
  "thành phố",
  "tp.",
  "tp",
  "thành phố ",
  "tỉnh ",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/[^a-z0-9\s]/g, "") // bỏ ký tự đặc biệt
    .replace(/\s+/g, " ")
    .trim();
}

function stripProvincePrefix(name: string): string {
  let result = name.toLowerCase().trim();
  for (const prefix of PROVINCE_PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length).trim();
    }
  }
  return result;
}

// ============================================================
// Location data loader
// ============================================================

let _locationData: LocationEntry[] | null = null;

function loadLocationData(): LocationEntry[] {
  if (_locationData) return _locationData;

  // Try multiple paths: src first, then dist
  const paths = [
    path.resolve(
      __dirname,
      "../../../../../public/select-address/location-data.json",
    ),
    path.resolve(__dirname, "../public/select-address/location-data.json"),
    path.resolve(process.cwd(), "public/select-address/location-data.json"),
    path.resolve(
      process.cwd(),
      "FE_THEP_DONG_ANH_V2/public/select-address/location-data.json",
    ),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        _locationData = JSON.parse(fs.readFileSync(p, "utf-8"));
        logger.info(`[Address] Loaded location data from ${p}`);
        return _locationData!;
      } catch {
        // try next path
      }
    }
  }

  logger.warn("[Address] Could not find location-data.json in any path");
  return [];
}

// ============================================================
// Build lookup maps (lazy)
// ============================================================

let _provinceMap: Map<string, LocationEntry> | null = null;
let _provinceNames: string[] | null = null;

function getProvinceMap(): Map<string, LocationEntry> {
  if (_provinceMap) return _provinceMap;

  const data = loadLocationData();
  _provinceMap = new Map();
  _provinceNames = [];

  for (const entry of data) {
    const key = stripProvincePrefix(entry.Name);
    _provinceMap.set(key, entry);

    // Also store normalized version
    const normKey = normalize(key);
    if (normKey !== key) {
      _provinceMap.set(normKey, entry);
    }
  }

  return _provinceMap;
}

// ============================================================
// Address resolver
// ============================================================

/**
 * Parse a raw address string into structured {detail, ward, province}
 * using location-data.json for fuzzy matching.
 *
 * Algorithm:
 * 1. Split by comma
 * 2. Find province by fuzzy matching (last segment first)
 * 3. Find ward within province's wards
 * 4. Remaining parts become detail
 */
export function parseAddressFromExcel(
  rawAddress: string | null | undefined,
): Address | null {
  const fullAddress = (rawAddress || "").trim();
  if (!fullAddress) return null;

  const parts = fullAddress
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const provinceMap = getProvinceMap();

  // 1. Find province — try from last segment backwards
  let provinceEntry: LocationEntry | null = null;
  let provinceSegment = "";

  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts[i];
    const cleaned = stripProvincePrefix(seg);
    const normCleaned = normalize(cleaned);

    // Fuzzy match: try exact strip, then normalized strip, then just the segment
    provinceEntry =
      (provinceMap.get(cleaned) ||
        provinceMap.get(normCleaned) ||
        provinceMap.get(stripProvincePrefix(normalize(seg)))) ??
      null;

    // Also try partial match (e.g., "hà nội" should match "thành phố hà nội")
    if (!provinceEntry) {
      for (const [key, entry] of provinceMap) {
        if (
          key.includes(cleaned) ||
          cleaned.includes(key) ||
          key.includes(normCleaned) ||
          normCleaned.includes(key)
        ) {
          provinceEntry = entry;
          break;
        }
      }
    }

    if (provinceEntry) {
      provinceSegment = parts.splice(i, 1)[0];
      break;
    }
  }

  const province = provinceEntry?.Name || "";

  // 2. Find ward within province's wards
  let wardName = "";
  if (provinceEntry) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i];
      const normSeg = normalize(seg);

      // Remove "phường", "xã" prefix for matching
      const cleanedWard = seg
        .toLowerCase()
        .replace(/^(phường|xã|ph\.)\s*/i, "")
        .trim();

      const found = provinceEntry.Wards.find((w) => {
        const wNorm = normalize(w.Name);
        const wCleaned = w.Name.toLowerCase()
          .replace(/^(phường|xã|ph\.)\s*/i, "")
          .trim();
        return (
          normSeg === wNorm ||
          normalize(cleanedWard) === normalize(wCleaned) ||
          wCleaned.includes(cleanedWard)
        );
      });

      if (found) {
        wardName = found.Name;
        parts.splice(i, 1);
        break;
      }
    }
  }

  // 3. Remaining parts → detail
  const detail = parts.join(", ");

  if (!province && !wardName) {
    // No match found → whole string is detail
    return { detail: fullAddress, ward: "", state: "", isPermanent: false };
  }

  return { detail, ward: wardName, state: province, isPermanent: false };
}

/**
 * Format a structured address for Excel export:
 * "detail, ward, province"
 */
export function formatAddressForExcel(
  address:
    | {
        detail?: string | null;
        ward?: string | null;
        province?: string | null;
      }
    | null
    | undefined,
): string {
  if (!address) return "";

  const detail = (address.detail || "").trim();
  const ward = (address.ward || "").trim();
  const province = (address.province || "").trim();

  return [detail, ward, province].filter(Boolean).join(", ");
}

// ============================================================
// Date helpers
// ============================================================

/**
 * Parse a dd/mm/yyyy string to Date.
 * Returns undefined if invalid.
 */
export function parseDateDMY(
  value: string | null | undefined,
): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  // Try dd/mm/yyyy
  const dmy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10) - 1;
    const y = parseInt(dmy[3], 10);
    const date = new Date(y, m, d);
    if (
      date.getFullYear() === y &&
      date.getMonth() === m &&
      date.getDate() === d
    ) {
      return date;
    }
  }
  // Fallback: try as ISO
  const iso = new Date(trimmed);
  if (!isNaN(iso.getTime())) return iso;
  return undefined;
}

/**
 * Format a Date to dd/mm/yyyy string for Excel export.
 */
export function formatDateDMY(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
