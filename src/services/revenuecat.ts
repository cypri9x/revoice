import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  CustomerInfoUpdateListener,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

export const REVENUECAT_ENTITLEMENT = "pro";
const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();
let configured = false;

export function isRevenueCatAvailable() {
  return Platform.OS !== "web" && Boolean(apiKey);
}

export async function configureRevenueCat() {
  if (configured) return true;
  if (!isRevenueCatAvailable()) return false;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: apiKey! });
  configured = true;
  return true;
}

async function requireConfiguration() {
  if (!(await configureRevenueCat()))
    throw new Error(
      "RevenueCat is unavailable. Open ReVoice in the Android Development Build.",
    );
}

export function hasProEntitlement(customerInfo: CustomerInfo | null) {
  return customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT] != null;
}

export async function getRevenueCatState(): Promise<{
  customerInfo: CustomerInfo;
  offering: PurchasesOffering | null;
}> {
  await requireConfiguration();
  const [customerInfo, offerings] = await Promise.all([
    Purchases.getCustomerInfo(),
    Purchases.getOfferings(),
  ]);
  return { customerInfo, offering: offerings.current };
}

export async function purchaseRevenueCatPackage(pkg: PurchasesPackage) {
  await requireConfiguration();
  return (await Purchases.purchasePackage(pkg)).customerInfo;
}

export async function restoreRevenueCatPurchases() {
  await requireConfiguration();
  return Purchases.restorePurchases();
}

export function addCustomerInfoListener(listener: CustomerInfoUpdateListener) {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

export function isPurchaseCancelled(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "userCancelled" in error &&
    error.userCancelled,
  );
}
