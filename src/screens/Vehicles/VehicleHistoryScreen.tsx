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
  groupServiceEntries,
  type ServiceEntryGroup,
} from "../../hooks/useServiceHistory";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { dateRangeFromPreset, type DateRangePreset } from "../../utils/date";
import ServiceGroupCard from "../History/components/ServiceGroupCard";
import FilterBar from "../History/components/FilterBar";
import FAB from "../components/FAB";
import EmptyState from "../components/EmptyState";
import AlertModal from "../components/AlertModal";
import { useServiceTypeLabel } from "@/hooks/useServiceTypeLabel";
import ScreenHeader from "../components/ScreenHeader";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleHistory">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VehicleHistoryScreen() {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { serviceTypes } = useServiceTypes();
  const { deleteEntry, deleteGroup } = useServiceEntryActions();

  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [searchText, setSearchText] = useState("");
  const [actionAlert, setActionAlert] = useState<{
    visible: boolean;
    group: ServiceEntryGroup | null;
  }>({ visible: false, group: null });
  const [deleteAlert, setDeleteAlert] = useState<{
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

  const { entries, loading, loadingMore, refresh, loadMore } =
    useServiceHistory(filter);

  const groups = useMemo(() => groupServiceEntries(entries), [entries]);

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
          data={groups}
          keyExtractor={(item) => item.key}
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
            <ServiceGroupCard
              group={item}
              onPress={() =>
                navigation.navigate("EntryDetail", { entryId: item.items[0].id })
              }
              onLongPress={() => setActionAlert({ visible: true, group: item })}
            />
          )}
        />
      )}
      <FAB onPress={() => navigation.navigate("AddEntry", { vehicleId })} />
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
              if (actionAlert.group)
                navigation.navigate("AddEntry", {
                  editEntryId: actionAlert.group.items[0].id,
                });
            },
          },
          {
            label: t('common.delete'),
            variant: "danger",
            onPress: () =>
              setDeleteAlert({ visible: true, group: actionAlert.group }),
          },
          { label: t('common.cancel'), variant: "secondary", onPress: () => {} },
        ]}
      />
      <AlertModal
        visible={deleteAlert.visible}
        onClose={() => setDeleteAlert({ visible: false, group: null })}
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
              const g = deleteAlert.group;
              if (!g) return;
              if (g.groupId) await deleteGroup(g.groupId);
              else await deleteEntry(g.items[0].id);
              refresh();
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
