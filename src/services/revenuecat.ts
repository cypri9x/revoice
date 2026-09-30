import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const key = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
let configured = false;
export async function configureRevenueCat() {
  if (!key || Platform.OS === 'web' || configured) return false;
  try { Purchases.setLogLevel(LOG_LEVEL.WARN); Purchases.configure({ apiKey: key }); configured = true; return true; } catch { return false; }
}
export async function getOfferings() { if (!(await configureRevenueCat())) return null; return (await Purchases.getOfferings()).current; }
export async function purchasePackage(pkg: PurchasesPackage) { const result = await Purchases.purchasePackage(pkg); return result.customerInfo.entitlements.active.pro != null; }
export async function restorePurchases() { if (!(await configureRevenueCat())) return false; const info = await Purchases.restorePurchases(); return info.entitlements.active.pro != null; }
export async function hasProEntitlement() { if (!(await configureRevenueCat())) return false; const info = await Purchases.getCustomerInfo(); return info.entitlements.active.pro != null; }
