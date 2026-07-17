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
} from "../../hooks/useServiceHistory";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { useAppStore } from "../../store/appStore";
import { dateRangeFromPreset, type DateRangePreset } from "../../utils/date";
import type { ServiceEntryWithDetails } from "../../domain/entities/ServiceEntry";
import EntryListItem from "./components/EntryListItem";
import FilterBar from "./components/FilterBar";
import FAB from "../components/FAB";
import EmptyState from "../components/EmptyState";
import AlertModal from "../components/AlertModal";
import { haptic } from "../../utils/haptics";
import { useIsFocused } from "@react-navigation/native";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, "History">;

export default function HistoryScreen() {
  const { t } = useTranslation();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { activeVehicleId } = useAppStore();
  const { serviceTypes } = useServiceTypes();
  const { deleteEntry } = useServiceEntryActions();
  const isFocused = useIsFocused();

  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [searchText, setSearchText] = useState("");
  const [actionAlert, setActionAlert] = useState<{
    visible: boolean;
    entry: ServiceEntryWithDetails | null;
  }>({ visible: false, entry: null });

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
          data={entries}
          keyExtractor={(item) => item.id}
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
            <EntryListItem
              entry={item}
              onPress={() =>
                navigation.navigate("EntryDetail", { entryId: item.id })
              }
              onLongPress={() => {
                haptic.heavy();
                setActionAlert({ visible: true, entry: item });
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
        onClose={() => setActionAlert({ visible: false, entry: null })}
        icon="wrench"
        iconColor={colors.accentText}
        title={actionAlert.entry?.serviceTypeName ?? ""}
        message={t('history.whatToDo')}
        actions={[
          {
            label: t('common.edit'),
            variant: "primary",
            onPress: () => {
              if (actionAlert.entry) {
                navigation.navigate("AddEntry", {
                  editEntryId: actionAlert.entry.id,
                });
              }
            },
          },
          {
            label: t('common.delete'),
            variant: "danger",
            onPress: async () => {
              if (actionAlert.entry) {
                await deleteEntry(actionAlert.entry.id);
                refresh();
              }
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
