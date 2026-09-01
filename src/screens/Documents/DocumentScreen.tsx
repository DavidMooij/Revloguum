import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import ScreenHeader from "../components/ScreenHeader";
import DocumentSection from "../components/documents/DocumentSection";

type Props = NativeStackScreenProps<RootStackParamList, "Documents">;

export default function DocumentScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId, ownerType, ownerId, title } = route.params;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title={title} showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <DocumentSection
          vehicleId={vehicleId}
          ownerType={ownerType}
          ownerId={ownerId}
          title={title}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, paddingBottom: 80 },
});