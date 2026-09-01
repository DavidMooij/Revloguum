import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../theme/colors";
import FAB from "../../components/FAB";
import ScreenHeader from "../../components/ScreenHeader";

interface Props {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
  showAdd?: boolean;
}

export default function VehicleHistoryLayout({
  title,
  onAdd,
  children,
  showAdd = true,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title={title} showBack />
      {children}
      {showAdd && <FAB onPress={onAdd} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
});