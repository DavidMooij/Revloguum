import "react-native-gesture-handler";
import "../i18n";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { getDatabase } from "../data/db/database";
import { useAppStore } from "../store/appStore";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  const { isDbReady, setDbReady } = useAppStore();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch((e) => setInitError((e as Error).message));
  }, [setDbReady]);

  if (initError) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <Text style={[typography.h3, { color: colors.danger }]}>
          Database error
        </Text>
        <Text
          style={[typography.bodySmall, { marginTop: 8, textAlign: "center" }]}
        >
          {initError}
        </Text>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: colors.accent,
              background: colors.bg0,
              card: colors.bg1,
              text: colors.text0,
              border: colors.border1,
              notification: colors.accent,
            },
            fonts: {
              regular: { fontFamily: "System", fontWeight: "400" },
              medium: { fontFamily: "System", fontWeight: "500" },
              bold: { fontFamily: "System", fontWeight: "600" },
              heavy: { fontFamily: "System", fontWeight: "700" },
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
