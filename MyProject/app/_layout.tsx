import React, { useContext } from "react";
import { Stack } from "expo-router";
import { ThemeProvider, ThemeContext } from "./ThemeContext";
import { View, StyleSheet, ImageBackground } from "react-native";

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme, backgroundImage }) => {
          const content = (
            <View style={styles.overlay}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="reader" options={{ title: "Читання книги" }} />
              </Stack>
            </View>
          );

          if (backgroundImage) {
            return (
              <ImageBackground
                source={{ uri: backgroundImage }}
                style={styles.container}
                resizeMode="cover"
              >
                {content}
              </ImageBackground>
            );
          }

          return (
            <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
              {content}
            </View>
          );
        }}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#222",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
});
