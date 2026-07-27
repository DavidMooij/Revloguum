import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { getDatabase } from "../../data/db/database";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import { useServiceEntryActions } from "../../hooks/useServiceHistory";
import type { ServiceEntryWithDetails } from "../../domain/entities/ServiceEntry";
import { formatDate, formatDateTime } from "../../utils/date";
import { formatOdometer, formatCost } from "../../utils/format";
import ScreenHeader from "../components/ScreenHeader";
import AlertModal from "../components/AlertModal";
import { haptic } from "@/utils/haptics";
import { decryptImage } from "@/security/imageEncryption";
import EncryptedImage from "../components/EncryptedImage";
import { useServiceTypeLabel } from "@/hooks/useServiceTypeLabel";

type Props = NativeStackScreenProps<RootStackParamList, "EntryDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EntryDetailScreen() {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { entryId } = route.params;
  const { deleteEntry } = useServiceEntryActions();

  const [entry, setEntry] = useState<ServiceEntryWithDetails | null>(null);
  const [deleteAlert, setDeleteAlert] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const db = await getDatabase();
        const repo = new SQLiteServiceEntryRepo(db);
        const e = await repo.getById(entryId);
        if (isActive) setEntry(e);
      })();
      return () => {
        isActive = false;
      };
    }, [entryId]),
  );

  const openImage = (index: number) => {
    if (!entry?.imagePaths) return;
    navigation.navigate("ImageViewer", {
      images: entry.imagePaths,
      initialIndex: index,
    });
  };

  if (!entry) return null;

  const serviceLabel = getLabel({ name: entry.serviceTypeName, translationKey: entry.translationKey });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={serviceLabel}
        subtitle={entry.vehicleDisplayName}
        showBack
        rightElement={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AddEntry", { editEntryId: entry.id })
            }
            hitSlop={10}
            style={styles.editBtn}
          >
            <Icon name="pen" size={13} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon
              name={entry.serviceTypeIcon}
              size={36}
              color={colors.accent}
            />
          </View>
          <Text style={styles.heroTitle}>{serviceLabel}</Text>
          <Text style={styles.heroDate}>{formatDate(entry.dateTs)}</Text>
          {entry.cost != null && (
            <View style={styles.costBadge}>
              <Text style={styles.costBadgeText}>{formatCost(entry.cost)}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <InfoRow
            label={t("entryDetail.odometer")}
            value={formatOdometer(entry.odometerKm)}
            icon="tachometer-alt"
          />
          <InfoRow
            label={t("entryDetail.vehicle")}
            value={entry.vehicleDisplayName}
            icon="car"
            last
          />
        </View>

        {entry.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("entryDetail.notes")}</Text>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        ) : null}

        {(entry.imagePaths?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("addEntry.photos")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              contentContainerStyle={styles.imageScrollContent}
            >
              {entry.imagePaths?.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => openImage(i)}
                  activeOpacity={0.85}
                >
                  <EncryptedImage path={uri} style={styles.image} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.metaSection}>
          <Text style={styles.metaText}>
            {t("entryDetail.recorded")} · {formatDateTime(entry.createdAt)}
          </Text>
          {entry.updatedAt !== entry.createdAt && (
            <Text style={styles.metaText}>
              {t("entryDetail.lastEdited")} · {formatDateTime(entry.updatedAt)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            haptic.error();
            setDeleteAlert(true);
          }}
          activeOpacity={0.7}
        >
          <Icon name="trash-alt" size={13} color={colors.dangerText} />
          <Text style={styles.deleteBtnText}>
            {t("entryDetail.deleteEntry").replace("?", "")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertModal
        visible={deleteAlert}
        onClose={() => setDeleteAlert(false)}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={t("entryDetail.deleteEntry")}
        message={t("common.cannotBeUndone")}
        actions={[
          {
            label: t("common.cancel"),
            variant: "secondary",
            onPress: () => {},
          },
          {
            label: t("common.delete"),
            variant: "danger",
            onPress: async () => {
              await deleteEntry(entryId);
              navigation.goBack();
            },
          },
        ]}
      />
    </View>
  );
}

function InfoRow({
  label,
  value,
  icon,
  last,
}: {
  label: string;
  value: string;
  icon?: string;
  last?: boolean;
}) {
  return (
    <View style={[infoRowStyles.row, last && infoRowStyles.rowLast]}>
      <View style={infoRowStyles.iconWrap}>
        {icon && <Icon name={icon as any} size={13} color={colors.text2} />}
      </View>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
    gap: spacing.sm,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: { width: 20, alignItems: "center" },
  label: { flex: 1, fontSize: 13, color: colors.text2 },
  value: { fontSize: 14, fontWeight: "500", color: colors.text0 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, gap: spacing.md },

  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text0,
    textAlign: "center",
  },
  heroDate: { fontSize: 13, color: colors.text2 },
  costBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.successMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  costBadgeText: { fontSize: 16, fontWeight: "700", color: colors.successText },

  section: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingVertical: spacing.xs,
  },
  notesText: {
    fontSize: 14,
    color: colors.text1,
    lineHeight: 22,
    paddingBottom: spacing.sm,
  },

  imageScroll: { marginHorizontal: -spacing.md },
  imageScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  image: { width: 200, height: 140, borderRadius: radius.md },

  metaSection: { paddingVertical: spacing.sm, gap: 4, alignItems: "center" },
  metaText: { fontSize: 11, color: colors.text3 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  deleteBtnText: { color: colors.dangerText, fontSize: 13, fontWeight: "600" },
});
