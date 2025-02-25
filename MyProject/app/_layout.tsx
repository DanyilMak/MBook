import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider, ThemeContext } from "./ThemeContext";
import { View, StyleSheet } from "react-native";

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme }) => (
          <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="reader" options={{ title: "Читання книги" }} />
            </Stack>
          </View>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#222",
  },
});
