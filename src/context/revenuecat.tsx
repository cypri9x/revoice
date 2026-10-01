import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import {
  addCustomerInfoListener,
  configureRevenueCat,
  getRevenueCatState,
  hasProEntitlement,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from "../services/revenuecat";

type RevenueCatContextValue = {
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  loading: boolean;
  error: string | null;
  packages: PurchasesPackage[];
  refresh: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);
const readableError = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "RevenueCat could not be reached. Please try again.";

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await getRevenueCatState();
      setCustomerInfo(state.customerInfo);
      setPackages(state.offering?.availablePackages ?? []);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => boolean) | undefined;
    let mounted = true;
    configureRevenueCat()
      .then((ready) => {
        if (!mounted) return;
        if (!ready) {
          setError(
            "RevenueCat is unavailable. Open ReVoice in the Android Development Build.",
          );
          setLoading(false);
          return;
        }
        unsubscribe = addCustomerInfoListener((info) => setCustomerInfo(info));
        refresh();
      })
      .catch((caught) => {
        if (mounted) {
          setError(readableError(caught));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    const info = await purchaseRevenueCatPackage(pkg);
    setCustomerInfo(info);
    return hasProEntitlement(info);
  }, []);

  const restore = useCallback(async () => {
    const info = await restoreRevenueCatPurchases();
    setCustomerInfo(info);
    return hasProEntitlement(info);
  }, []);

  const value = useMemo(
    () => ({
      customerInfo,
      isPro: hasProEntitlement(customerInfo),
      loading,
      error,
      packages,
      refresh,
      purchase,
      restore,
    }),
    [customerInfo, loading, error, packages, refresh, purchase, restore],
  );
  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const value = useContext(RevenueCatContext);
  if (!value)
    throw new Error("useRevenueCat must be used inside RevenueCatProvider.");
  return value;
}
