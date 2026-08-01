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
import { readableColor } from "../theme/readability";
import { typography } from "../theme/typography";
import RootNavigator from "./navigation/RootNavigator";
import { FeedbackProvider } from "@/screens/components/feedback/Feedbackprovider";

export default function App() {
  const isDbReady = useAppStore((s) => s.isDbReady);
  const arePrefsReady = useAppStore((s) => s.arePrefsReady);
  const readabilityMode = useAppStore((s) => s.readabilityMode);
  const setDbReady = useAppStore((s) => s.setDbReady);
  const hydratePreferences = useAppStore((s) => s.hydratePreferences);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch((e) => setInitError((e as Error).message));
  }, [setDbReady]);

  if (initError) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: readableColor("bg0", readabilityMode) },
        ]}
      >
        <StatusBar style="light" />
        <Text
          style={[
            typography.h3,
            { color: readableColor("danger", readabilityMode) },
          ]}
        >
          Database error
        </Text>
        <Text
          style={[
            typography.bodySmall,
            {
              marginTop: 8,
              textAlign: "center",
              color: readableColor("text1", readabilityMode),
            },
          ]}
        >
          {initError}
        </Text>
      </View>
    );
  }

  if (!isDbReady || !arePrefsReady) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: readableColor("bg0", readabilityMode) },
        ]}
      >
        <StatusBar style="light" />
        <ActivityIndicator
          size="large"
          color={readableColor("accent", readabilityMode)}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FeedbackProvider>
          <StatusBar style="light" />
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: readableColor("accent", readabilityMode),
                background: readableColor("bg0", readabilityMode),
                card: readableColor("bg1", readabilityMode),
                text: readableColor("text0", readabilityMode),
                border: readableColor("border1", readabilityMode),
                notification: readableColor("accent", readabilityMode),
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
        </FeedbackProvider>
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
