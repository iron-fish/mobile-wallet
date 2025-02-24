/**
 * Utility function for rendering balances that respects the hide balances setting
 * @param balance The balance amount to render
 * @param hideBalances Whether balances should be hidden
 * @param assetId Optional asset ID for custom formatting
 * @param verification Optional asset verification data
 * @returns The rendered balance or "•••••" if hidden
 */
export function renderBalance(
  balance: string,
  hideBalances: boolean,
  assetId?: string,
  verification?: any,
): string {
  if (hideBalances) {
    return "•••••";
  }

  if (assetId) {
    return CurrencyUtils.render(balance, false, assetId, verification);
  }

  return CurrencyUtils.render(balance);
}
