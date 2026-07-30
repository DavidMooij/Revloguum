import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import {
  useServiceHistory,
  useServiceEntryActions,
  groupServiceEntries,
  type ServiceEntryGroup,
} from "../../hooks/useServiceHistory";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { useAppStore } from "../../store/appStore";
import { dateRangeFromPreset, type DateRangePreset } from "../../utils/date";
import ServiceGroupCard from "./components/ServiceGroupCard";
import FilterBar from "./components/FilterBar";
import FAB from "../components/FAB";
import EmptyState from "../components/EmptyState";
import AlertModal from "../components/AlertModal";
import { haptic } from "../../utils/haptics";
import { useIsFocused } from "@react-navigation/native";
import { useServiceTypeLabel } from "../../hooks/useServiceTypeLabel";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, "History">;

export default function HistoryScreen() {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { activeVehicleId } = useAppStore();
  const { serviceTypes } = useServiceTypes();
  const { deleteEntry, deleteGroup } = useServiceEntryActions();
  const isFocused = useIsFocused();

  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [searchText, setSearchText] = useState("");
  const [actionAlert, setActionAlert] = useState<{
    visible: boolean;
    group: ServiceEntryGroup | null;
  }>({ visible: false, group: null });

  const dateRange = useMemo(
    () => dateRangeFromPreset(datePreset),
    [datePreset],
  );

  const filter = useMemo(
    () => ({
      vehicleId,
      serviceTypeIds: selectedTypeIds.length ? selectedTypeIds : undefined,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      searchText: searchText || undefined,
    }),
    [vehicleId, selectedTypeIds, dateRange.from, dateRange.to, searchText],
  );

  const { entries, loading, loadingMore, refresh, loadMore } = useServiceHistory(filter);

  const groups = useMemo(() => groupServiceEntries(entries), [entries]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (isFocused) {
      refresh();
    }
  }, [isFocused, refresh]);

  const toggleType = (id: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearFilters = () => {
    setSelectedTypeIds([]);
    setDatePreset("all");
    setSearchText("");
  };

  if (!vehicleId) navigation.goBack();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={typography.h2}>History</Text>
        {entries.length > 0 && (
          <Text style={typography.bodySmall}>{entries.length} records</Text>
        )}
      </View>

      <FilterBar
        serviceTypes={serviceTypes}
        selectedTypeIds={selectedTypeIds}
        onToggleType={toggleType}
        datePreset={datePreset}
        onDatePreset={setDatePreset}
        searchText={searchText}
        onSearchText={setSearchText}
        onClear={clearFilters}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlashList
          data={groups}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title={t('history.noEntries')}
              subtitle={t('history.noEntriesHint')}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.accent} style={{ margin: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <ServiceGroupCard
              group={item}
              onPress={() =>
                navigation.navigate("EntryDetail", { entryId: item.items[0].id })
              }
              onLongPress={() => {
                haptic.heavy();
                setActionAlert({ visible: true, group: item });
              }}
            />
          )}
        />
      )}

      <FAB
        onPress={() =>
          navigation.navigate("AddEntry", {
            vehicleId: activeVehicleId ?? undefined,
          })
        }
      />

      <AlertModal
        visible={actionAlert.visible}
        onClose={() => setActionAlert({ visible: false, group: null })}
        icon="wrench"
        iconColor={colors.accentText}
        title={
          actionAlert.group
            ? actionAlert.group.items.length > 1
              ? t("history.servicesCount", {
                  count: actionAlert.group.items.length,
                })
              : getLabel({
                  name: actionAlert.group.items[0].serviceTypeName,
                  translationKey: actionAlert.group.items[0].translationKey,
                })
            : ""
        }
        message={t('history.whatToDo')}
        actions={[
          {
            label: t('common.edit'),
            variant: "primary",
            onPress: () => {
              if (actionAlert.group) {
                navigation.navigate("AddEntry", {
                  editEntryId: actionAlert.group.items[0].id,
                });
              }
            },
          },
          {
            label: t('common.delete'),
            variant: "danger",
            onPress: async () => {
              const g = actionAlert.group;
              if (!g) return;
              if (g.groupId) await deleteGroup(g.groupId);
              else await deleteEntry(g.items[0].id);
              refresh();
            },
          },
          {
            label: t('common.cancel'),
            variant: "secondary",
            onPress: () => {},
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: 120 },
});
