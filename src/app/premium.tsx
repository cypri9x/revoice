import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GradientButton, ScreenHeader } from "../components/ui";
import { useRevenueCat } from "../context/revenuecat";
import { isPurchaseCancelled } from "../services/revenuecat";
import { colors, radius } from "../theme";

const features = [
  ["sparkles", "AI Intent Builder"],
  ["camera", "Camera Assist"],
  ["people", "Multiple Care Profiles"],
  ["time", "Conversation History"],
  ["heart", "Personalized communication context"],
] as const;

export default function Premium() {
  const router = useRouter();
  const {
    isPro,
    packages,
    loading: initialLoading,
    error,
    refresh,
    purchase,
    restore,
  } = useRevenueCat();
  const [selected, setSelected] = useState(0);
  const [action, setAction] = useState<"purchase" | "restore" | null>(null);

  const buy = async () => {
    const pkg = packages[selected];
    if (!pkg) {
      Alert.alert(
        "Plans unavailable",
        error ?? "RevenueCat did not return any products. Please try again.",
      );
      return;
    }
    setAction("purchase");
    try {
      if (!(await purchase(pkg)))
        Alert.alert(
          "Purchase pending",
          "The purchase completed, but ReVoice+ is not active yet. Please try Restore purchases.",
        );
    } catch (caught) {
      if (!isPurchaseCancelled(caught))
        Alert.alert(
          "Purchase unavailable",
          "No charge was made. Please try again in a moment.",
        );
    } finally {
      setAction(null);
    }
  };

  const restoreAccess = async () => {
    setAction("restore");
    try {
      if (!(await restore()))
        Alert.alert(
          "No purchase found",
          "No active ReVoice+ purchase was found for this customer.",
        );
    } catch {
      Alert.alert(
        "Restore unavailable",
        "Please check your connection and try again.",
      );
    } finally {
      setAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader onBack={() => router.back()} />
        <View style={styles.badge}>
          <Ionicons name="diamond" size={16} color={colors.purple} />
          <Text style={styles.badgeText}>ReVoice+</Text>
        </View>
        <Text style={styles.title}>
          {isPro ? "ReVoice+ unlocked" : "Unlock more possibilities."}
        </Text>
        {isPro ? (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={64} color={colors.mint} />
            <Text style={styles.successTitle}>You're all set.</Text>
            <Text style={styles.successCopy}>
              Premium communication tools are now available.
            </Text>
          </View>
        ) : (
          <>
            {features.map(([icon, label]) => (
              <View key={label} style={styles.feature}>
                <Ionicons name={icon} size={21} color={colors.purple} />
                <Text style={styles.featureText}>{label}</Text>
              </View>
            ))}
            <View style={{ marginTop: 20 }}>
              {initialLoading ? (
                <Text style={styles.status}>Loading current plans...</Text>
              ) : packages.length ? (
                packages.map((pkg, i) => (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => setSelected(i)}
                    style={[styles.plan, selected === i && styles.planSelected]}
                  >
                    <Ionicons
                      name={
                        selected === i ? "radio-button-on" : "radio-button-off"
                      }
                      size={22}
                      color={selected === i ? "#2867FA" : colors.muted}
                    />
                    <View>
                      <Text style={styles.planTitle}>{pkg.product.title}</Text>
                      <Text style={styles.planPrice}>
                        {pkg.product.priceString}
                      </Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Pressable onPress={refresh} style={styles.retry}>
                  <Text style={styles.retryText}>
                    {error ?? "Plans are unavailable."} Tap to retry.
                  </Text>
                </Pressable>
              )}
            </View>
            <GradientButton
              title="Start ReVoice+"
              icon="diamond"
              onPress={buy}
              loading={action === "purchase"}
              style={{ marginTop: 14 }}
            />
            <Pressable disabled={action !== null} onPress={restoreAccess}>
              <Text style={styles.restore}>
                {action === "restore"
                  ? "Restoring purchases..."
                  : "Restore purchases"}
              </Text>
            </Pressable>
          </>
        )}
        <Text style={styles.footer}>
          Communication essentials — Quick Speak, Yes/No, basic phrases and
          device voice — are always free.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, paddingBottom: 35 },
  badge: {
    alignSelf: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: "#F1E9FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  badgeText: { fontFamily: "Jakarta-Bold", fontSize: 15, color: colors.purple },
  title: {
    fontFamily: "Jakarta-ExtraBold",
    fontSize: 34,
    lineHeight: 41,
    color: colors.text,
    textAlign: "center",
    marginTop: 22,
    marginBottom: 25,
    letterSpacing: -1.2,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  featureText: {
    fontFamily: "Jakarta-Medium",
    fontSize: 15,
    color: colors.text,
  },
  plan: {
    minHeight: 70,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 9,
  },
  planSelected: { borderColor: "#2867FA", backgroundColor: "#F4F7FF" },
  planTitle: {
    fontFamily: "Jakarta-SemiBold",
    fontSize: 14,
    color: colors.text,
  },
  planPrice: {
    fontFamily: "Jakarta-Regular",
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
  restore: {
    fontFamily: "Jakarta-SemiBold",
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
    padding: 16,
  },
  footer: {
    fontFamily: "Jakarta-Regular",
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 12,
  },
  success: {
    alignItems: "center",
    backgroundColor: "#ECFBF7",
    borderRadius: radius.lg,
    padding: 32,
  },
  successTitle: {
    fontFamily: "Jakarta-Bold",
    fontSize: 22,
    color: colors.text,
    marginTop: 12,
  },
  successCopy: {
    fontFamily: "Jakarta-Regular",
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
  },
  status: {
    fontFamily: "Jakarta-Medium",
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    padding: 24,
  },
  retry: {
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  retryText: {
    fontFamily: "Jakarta-Medium",
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    textAlign: "center",
  },
});
