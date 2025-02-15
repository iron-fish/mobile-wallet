import { Asset } from "@/data/facades/chain/types";
import { IRON_ASSET_ID_HEX } from "../data/constants";
import { CurrencyUtils } from "@ironfish/sdk";

export const isValidBigInt = (num: string) => {
  if (num.length === 0) return false;
  try {
    const bi = BigInt(num);
    return bi > 0;
  } catch {
    return false;
  }
};

export const getAssetDecimals = (
  asset: Asset | undefined,
): number | undefined => {
  if (!asset) return undefined;
  try {
    return asset.verification.status === "verified"
      ? asset.verification.decimals
      : JSON.parse(asset.metadata).decimals;
  } catch {
    return undefined;
  }
};

export const convertAmountToMinor = (
  amount: string,
  assetId: string,
  assetMap: Map<string, Asset>,
) => {
  const asset =
    assetId === IRON_ASSET_ID_HEX ? undefined : assetMap.get(assetId);
  return CurrencyUtils.tryMajorToMinor(amount, assetId, {
    decimals: getAssetDecimals(asset),
  });
};

export const isValidAmount = (
  value: string,
  assetId: string,
  assetMap: Map<string, Asset>,
) => {
  if (value.length === 0) return true;

  const asset =
    assetId === IRON_ASSET_ID_HEX ? undefined : assetMap.get(assetId);

  if (asset && asset.verification.status !== "verified") {
    return !value.includes(".");
  }

  const decimals = getAssetDecimals(asset) ?? 8;
  const parts = value.split(".");
  return parts.length <= 2 && (parts[1]?.length ?? 0) <= decimals;
};

export const enforceDecimals = (
  value: string,
  assetId: string,
  assetMap: Map<string, Asset>,
): string => {
  if (value.length === 0) return value;

  const asset =
    assetId === IRON_ASSET_ID_HEX ? undefined : assetMap.get(assetId);

  if (asset && asset.verification.status !== "verified") {
    return value.replace(/\./g, "");
  }

  const decimals = getAssetDecimals(asset) ?? 8;
  const parts = value.split(".");
  if (parts.length === 2 && parts[1].length > decimals) {
    return `${parts[0]}.${parts[1].slice(0, decimals)}`;
  }

  return value;
};
