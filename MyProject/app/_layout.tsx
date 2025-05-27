import React, { useContext } from "react";
import { Stack } from "expo-router";
import { ThemeProvider, ThemeContext } from "./ThemeContext";
import { View, ImageBackground, StyleSheet } from "react-native";

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme, backgroundImage }) => {
          const isDark = theme === "dark";

          const Content = (
            <View style={[styles.overlay, isDark && styles.darkOverlay]}>
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
                style={styles.background}
                resizeMode="cover"
              >
                {Content}
              </ImageBackground>
            );
          }

          return (
            <View style={[styles.background, isDark && styles.darkOverlay]}>
              {Content}
            </View>
          );
        }}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)", // прозорість поверх зображення
  },
  darkOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
});
