import { useFacade } from "@/data/facades";
import { useEffect, useState } from "react";

/**
 * Hook that provides the current hide balances setting
 * @returns The current hide balances state
 */
export function useHideBalances(): boolean {
  const facade = useFacade();
  const [hideBalances, setHideBalances] = useState(true);
  const appSettings = facade.getAppSettings.useQuery();

  useEffect(() => {
    setHideBalances(appSettings.data?.hideBalances === "true");
  }, [appSettings.data?.hideBalances]);

  return hideBalances;
}
