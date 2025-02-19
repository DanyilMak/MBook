import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Імпортуємо екрани (поки створимо їх як заглушки)
import LibraryScreen from "../screens/LibraryScreen";
import StatsScreen from "../screens/StatsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Library") {
            iconName = "book";
          } else if (route.name === "Stats") {
            iconName = "stats-chart";
          } else if (route.name === "Calendar") {
            iconName = "calendar";
          } else if (route.name === "Settings") {
            iconName = "settings";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
