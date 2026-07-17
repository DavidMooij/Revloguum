import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import {
  useServiceHistory,
  useServiceEntryActions,
} from "../../hooks/useServiceHistory";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { dateRangeFromPreset, type DateRangePreset } from "../../utils/date";
import type { ServiceEntryWithDetails } from "../../domain/entities/ServiceEntry";
import EntryListItem from "../History/components/EntryListItem";
import FilterBar from "../History/components/FilterBar";
import FAB from "../components/FAB";
import EmptyState from "../components/EmptyState";
import AlertModal from "../components/AlertModal";
import ScreenHeader from "../components/ScreenHeader";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleHistory">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VehicleHistoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { serviceTypes } = useServiceTypes();
  const { deleteEntry } = useServiceEntryActions();

  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [searchText, setSearchText] = useState("");
  const [actionAlert, setActionAlert] = useState<{
    visible: boolean;
    entry: ServiceEntryWithDetails | null;
  }>({ visible: false, entry: null });
  const [deleteAlert, setDeleteAlert] = useState<{
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

  const { entries, loading, loadingMore, refresh, loadMore } =
    useServiceHistory(filter);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title={t('history.title')} showBack />
      <FilterBar
        serviceTypes={serviceTypes}
        selectedTypeIds={selectedTypeIds}
        onToggleType={(id) =>
          setSelectedTypeIds((p) =>
            p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
          )
        }
        datePreset={datePreset}
        onDatePreset={setDatePreset}
        searchText={searchText}
        onSearchText={setSearchText}
        onClear={() => {
          setSelectedTypeIds([]);
          setDatePreset("all");
          setSearchText("");
        }}
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
              title={t('history.noServices')}
              subtitle={t('history.noServiceEntries')}
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
              onLongPress={() => setActionAlert({ visible: true, entry: item })}
            />
          )}
        />
      )}
      <FAB onPress={() => navigation.navigate("AddEntry", { vehicleId })} />
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
              if (actionAlert.entry)
                navigation.navigate("AddEntry", {
                  editEntryId: actionAlert.entry.id,
                });
            },
          },
          {
            label: t('common.delete'),
            variant: "danger",
            onPress: () =>
              setDeleteAlert({ visible: true, entry: actionAlert.entry }),
          },
          { label: t('common.cancel'), variant: "secondary", onPress: () => {} },
        ]}
      />
      <AlertModal
        visible={deleteAlert.visible}
        onClose={() => setDeleteAlert({ visible: false, entry: null })}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={t('history.deleteEntry')}
        message={t('common.cannotBeUndone')}
        actions={[
          { label: t('common.cancel'), variant: "secondary", onPress: () => {} },
          {
            label: t('common.delete'),
            variant: "danger",
            onPress: async () => {
              if (deleteAlert.entry) {
                await deleteEntry(deleteAlert.entry.id);
                refresh();
              }
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: 120 },
});
