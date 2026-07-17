import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { Vehicle } from "../../domain/entities/Vehicle";
import type { FuelEntry } from "../../domain/entities/FuelEntry";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { haptic } from "@/utils/haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    odometerKm: number;
    liters: number;
    cost: number;
    notes: string | null;
  }) => Promise<void>;
  vehicle: Vehicle;
  lastEntry: FuelEntry | null;
}

const { width } = Dimensions.get("window");
const BTN_WIDTH = (width - 80 - spacing.sm * 2) / 3;
const NAV_BTN_WIDTH = 140;

function NumPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
  return (
    <View style={numStyles.grid}>
      {keys.map((k, i) => (
        <TouchableOpacity
          key={i}
          style={[numStyles.key, k === "" && numStyles.keyEmpty]}
          onPress={() => {
            if (!k) return;
            haptic.soft();
            if (k === "⌫") {
              onChange(value.slice(0, -1) || "0");
              return;
            }
            const next = value === "0" ? k : value + k;
            if (next.length <= 7) onChange(next);
          }}
          activeOpacity={0.55}
          disabled={!k}
        >
          {k !== "" &&
            (k === "⌫" ? (
              <Icon name="backspace" size={18} color={colors.text1} />
            ) : (
              <Text style={numStyles.keyText}>{k}</Text>
            ))}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const numStyles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  key: {
    width: BTN_WIDTH,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: { backgroundColor: "transparent", borderWidth: 0 },
  keyText: { fontSize: 22, fontWeight: "600", color: colors.text0 },
});

function Dots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === current && dotStyles.dotActive,
            i < current && dotStyles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}
const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignSelf: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bg3 },
  dotActive: { width: 20, backgroundColor: colors.accent },
  dotDone: { backgroundColor: colors.accentMuted },
});

function ConfirmRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={cfStyles.row}>
      <Text style={cfStyles.label}>{label}</Text>
      <Text style={[cfStyles.value, accent && cfStyles.accent]}>{value}</Text>
    </View>
  );
}
const cfStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  label: { fontSize: 14, color: colors.text2 },
  value: { fontSize: 14, fontWeight: "600", color: colors.text0 },
  accent: { color: colors.accent, fontSize: 17, fontWeight: "700" },
});

function AdjBtn({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[adjStyles.btn, accent && adjStyles.btnAccent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[adjStyles.text, accent && adjStyles.textAccent]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const adjStyles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAccent: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  text: { fontSize: 15, fontWeight: "700", color: colors.text0 },
  textAccent: { color: colors.accentText },
});

export default function QuickFuelModal({
  visible,
  onClose,
  onSave,
  vehicle,
  lastEntry,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState(0);
  const [pricePerLiter, setPricePerLiter] = useState(0);
  const [saving, setSaving] = useState(false);

  const defaultLiters = vehicle.defaultTankLiters ?? 15;
  const defaultPrice =
    vehicle.defaultFuelPrice ??
    (lastEntry ? lastEntry.cost / lastEntry.liters : 2.05);
  const kmSinceLast = lastEntry
    ? vehicle.currentOdometer - lastEntry.odometerKm
    : 0;

  useEffect(() => {
    if (visible) {
      setStep(0);
      setOdometer(String(vehicle.currentOdometer));
      setLiters(defaultLiters);
      setPricePerLiter(Math.round(defaultPrice * 100) / 100);
      setSaving(false);
    }
  }, [visible]);

  const totalCost = Math.round(liters * pricePerLiter * 100) / 100;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        odometerKm: parseInt(odometer, 10),
        liters: Math.round(liters * 10) / 10,
        cost: totalCost,
        notes: null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [odometer, liters, totalCost, onSave, onClose]);

  const adjustLiters = (delta: number) => {
    haptic.selection();
    setLiters((p) => Math.max(0.5, Math.round((p + delta) * 2) / 2));
  };
  const adjustPrice = (delta: number) => {
    haptic.selection();
    setPricePerLiter((p) =>
      Math.max(0.01, Math.round((p + delta) * 100) / 100),
    );
  };

  const enteredOdometer = parseInt(odometer || "0", 10);
  const canNext = odometer !== "" && enteredOdometer >= vehicle.currentOdometer;
  const goNext = () => {
    if (!canNext) {
      haptic.error();

      Alert.alert(
        t("fuel.invalidOdometerTitle"),
        t("fuel.invalidOdometerMessage", {
          km: vehicle.currentOdometer.toLocaleString(),
        }),
      );

      return;
    }

    haptic.medium();
    setStep((s) => s + 1);
  };
  const goBack = () => {
    haptic.selection();
    setStep((s) => s - 1);
  };

  const fillPct = Math.min(100, Math.round((liters / defaultLiters) * 100));
  const vehicleName = vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {vehicleName}
              </Text>
              {kmSinceLast > 0 && (
                <Text style={styles.kmSince}>
                  {t("fuel.kmSinceLast", { km: kmSinceLast.toLocaleString() })}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <Icon name="times" size={16} color={colors.text2} />
            </TouchableOpacity>
          </View>

          <Dots current={step} total={4} />

          {step === 0 && (
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>{t("fuel.stepOdometer")}</Text>
              <Text style={styles.bigNumber}>
                {t("fuel.odometerDisplay", {
                  km: parseInt(odometer || "0", 10).toLocaleString(),
                })}
              </Text>
              {lastEntry && (
                <Text style={styles.hint}>
                  {t("fuel.lastTankAt", {
                    km: lastEntry.odometerKm.toLocaleString(),
                  })}
                </Text>
              )}
              <NumPad value={odometer} onChange={setOdometer} />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>{t("fuel.stepLiters")}</Text>
              <Text style={styles.bigNumber}>
                {t("fuel.litersDisplay", { liters: liters.toFixed(1) })}
              </Text>
              <View style={styles.adjRow}>
                <AdjBtn label="−5" onPress={() => adjustLiters(-5)} />
                <AdjBtn label="−½" onPress={() => adjustLiters(-0.5)} />
                <AdjBtn
                  label={t("fuel.resetDefault", { liters: defaultLiters })}
                  onPress={() => {
                    haptic.selection();
                    setLiters(defaultLiters);
                  }}
                  accent
                />
                <AdjBtn label="+½" onPress={() => adjustLiters(0.5)} />
                <AdjBtn label="+5" onPress={() => adjustLiters(5)} />
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${fillPct}%` }]} />
              </View>
              <Text style={styles.hint}>
                {t("fuel.tankPercent", { pct: fillPct })}
              </Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>{t("fuel.stepPrice")}</Text>
              <Text style={styles.bigNumber}>
                {t("fuel.priceDisplay", { price: pricePerLiter.toFixed(2) })}
              </Text>
              <View style={styles.adjRow}>
                <AdjBtn label="−10 Rp." onPress={() => adjustPrice(-0.1)} />
                <AdjBtn label="−1 Rp." onPress={() => adjustPrice(-0.01)} />
                <AdjBtn label="+1 Rp." onPress={() => adjustPrice(0.01)} />
                <AdjBtn label="+10 Rp." onPress={() => adjustPrice(0.1)} />
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {t("fuel.totalPreview", {
                    liters: liters.toFixed(1),
                    price: pricePerLiter.toFixed(2),
                  })}
                </Text>
                <Text style={styles.totalValue}>
                  {t("fuel.totalEq", { total: totalCost.toFixed(2) })}
                </Text>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>{t("fuel.stepConfirm")}</Text>
              <View style={styles.confirmCard}>
                <ConfirmRow
                  label={t("fuel.labelOdometer")}
                  value={t("fuel.odometerDisplay", {
                    km: parseInt(odometer, 10).toLocaleString(),
                  })}
                />
                <ConfirmRow
                  label={t("fuel.labelFilled")}
                  value={t("fuel.litersDisplay", { liters: liters.toFixed(1) })}
                />
                <ConfirmRow
                  label={t("fuel.labelPricePerL")}
                  value={t("fuel.priceDisplay", {
                    price: pricePerLiter.toFixed(2),
                  })}
                />
                <ConfirmRow
                  label={t("fuel.labelTotal")}
                  value={t("fuel.priceDisplay", {
                    price: totalCost.toFixed(2),
                  })}
                  accent
                />
              </View>
            </View>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.navBtnBack,
                step === 0 && styles.navBtnInvisible,
              ]}
              onPress={goBack}
              disabled={step === 0}
            >
              <Icon name="chevron-left" size={14} color={colors.text1} />
              <Text style={styles.navBtnBackText}>{t("fuel.back")}</Text>
            </TouchableOpacity>

            {step < 3 ? (
              <TouchableOpacity
                style={[
                  styles.navBtn,
                  styles.navBtnNext,
                  !canNext && styles.navBtnDisabled,
                ]}
                onPress={goNext}
                disabled={!canNext}
              >
                <Text style={styles.navBtnNextText}>{t("fuel.next")}</Text>
                <Icon name="chevron-right" size={14} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.navBtn,
                  styles.navBtnNext,
                  saving && styles.navBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.navBtnNextText}>
                      {t("fuel.saveChanges")}
                    </Text>
                    <Icon name="check" size={14} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.bg1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border2,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1, marginRight: spacing.md },
  vehicleName: { fontSize: 17, fontWeight: "700", color: colors.text0 },
  kmSince: { fontSize: 12, color: colors.text2, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBody: { gap: spacing.md, minHeight: 240 },
  stepLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
  },
  bigNumber: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.text0,
    letterSpacing: -1.5,
    textAlign: "center",
  },
  hint: { fontSize: 12, color: colors.text2, textAlign: "center" },
  adjRow: { flexDirection: "row", gap: spacing.sm },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg3,
    overflow: "hidden",
  },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  totalLabel: { fontSize: 14, color: colors.text2 },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.accent },
  confirmCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    paddingHorizontal: spacing.md,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    width: NAV_BTN_WIDTH,
    height: 50,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  navBtnBack: {
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
  },
  navBtnBackText: { fontSize: 15, fontWeight: "600", color: colors.text1 },
  navBtnNext: { backgroundColor: colors.accent },
  navBtnNextText: { fontSize: 15, fontWeight: "700", color: colors.white },
  navBtnInvisible: { opacity: 0 },
  navBtnDisabled: { opacity: 0.4 },
});
