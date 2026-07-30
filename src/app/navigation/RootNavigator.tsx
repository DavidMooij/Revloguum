import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import type { RootStackParamList, RootTabParamList } from "./routes";
import DashboardScreen from "../../screens/Dashboard/DashboardScreen";
import HistoryScreen from "../../screens/History/HistoryScreen";
import SettingsScreen from "../../screens/Settings/SettingsScreen";
import AddEntryScreen from "../../screens/AddEntry/AddEntryScreen";
import EntryDetailScreen from "../../screens/History/EntryDetailScreen";
import ManageServiceTypesScreen from "../../screens/Settings/ManageServiceTypesScreen";
import ImageViewerScreen from "@/screens/History/ImageViewerScreen";
import VehicleHistoryScreen from "@/screens/Vehicles/VehicleHistoryScreen";
import VehicleFuelHistoryScreen from "@/screens/Vehicles/VehicleFuelHistoryScreen";
import VehicleStatsScreen from "@/screens/Vehicles/VehicleStatsScreen";
import VehicleScreen from "@/screens/Vehicles/VehicleScreen";
import AddVehicleScreen from "@/screens/Vehicles/AddVehicleScreen";
import VehicleDetailScreen from "@/screens/Vehicles/VehicleDetailScreen";
import VehicleCostsScreen from "@/screens/Vehicles/VehicleCostsScreen";
import ExportPdfScreen from "@/screens/Settings/ExportPdfScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { typeScale } from "../../theme/typography";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg1,
          borderTopColor: colors.border0,
          borderTopWidth: 1,

          height: 72 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 8,
        },

        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text2,
        tabBarLabelStyle: {
          fontSize: typeScale.overline,
          fontWeight: "600",
          letterSpacing: 0.3,
        },

        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: "tachometer-alt",
            Vehicles: "motorcycle",
            Settings: "cog",
          };

          return (
            <Icon
              name={icons[route.name] ?? "circle"}
              size={size - 2}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Vehicles" component={VehicleScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg0 },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ animation: "none" }}
      />
      <Stack.Screen name="AddEntry" component={AddEntryScreen} />
      <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen
        name="ManageServiceTypes"
        component={ManageServiceTypesScreen}
      />
      <Stack.Screen name="ImageViewer" component={ImageViewerScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="VehicleCosts" component={VehicleCostsScreen} />
      <Stack.Screen name="VehicleHistory" component={VehicleHistoryScreen} />
      <Stack.Screen
        name="VehicleFuelHistory"
        component={VehicleFuelHistoryScreen}
      />
      <Stack.Screen name="VehicleStats" component={VehicleStatsScreen} />
      <Stack.Screen name="ExportPdf" component={ExportPdfScreen} />
    </Stack.Navigator>
  );
}
