import { CurrencyUtils, DecimalUtils } from "@ironfish/sdk";

/**
 * CurrencyUtils.render doesn't allow for specifying the max precision,
 * so this function is a workaround to render the amount without trailing zeros.
 */
export function renderWithoutDecimals(
  amount: bigint | string,
  assetId?: string,
  verifiedAssetMetadata?: {
    decimals?: number;
    symbol?: string;
  },
): string {
  const { value: majorValue, decimals: majorDecimals } =
    CurrencyUtils.minorToMajor(BigInt(amount), assetId, verifiedAssetMetadata);

  const renderedValue = DecimalUtils.render(majorValue, majorDecimals);

  return renderedValue;
}
