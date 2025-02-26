import React, { useEffect, useState, useContext } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import iconv from "iconv-lite";
import { Buffer } from "buffer";
import { ThemeContext } from "../ThemeContext";

export default function ReaderScreen() {
  const { bookUri } = useLocalSearchParams();
  const [bookContent, setBookContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";

  // Налаштування шрифту та розміру тексту
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState(isDarkTheme ? "#fff" : "#000");

  useEffect(() => {
    const loadBook = async () => {
      try {
        if (!bookUri || typeof bookUri !== "string") return;

        const fileBase64 = await FileSystem.readAsStringAsync(bookUri, { encoding: FileSystem.EncodingType.Base64 });
        const binaryData = Buffer.from(fileBase64, "base64");
        const content = iconv.decode(binaryData, "win1251");

        setBookContent(content);

        // Завантажуємо останню позицію
        const savedPosition = await AsyncStorage.getItem(`position-${bookUri}`);
        if (savedPosition) {
          setScrollPosition(parseInt(savedPosition, 10));
        }
      } catch (error) {
        console.error("❌ Помилка при завантаженні файлу:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookUri]);

  // Збереження позиції прокрутки
  const handleScroll = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollPosition(offsetY);
    await AsyncStorage.setItem(`position-${bookUri}`, offsetY.toString());
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkTheme && styles.darkContainer]}>
      <View style={styles.toolbar}>
      <Text style={[styles.fileName, isDarkTheme && styles.darkText]}>
    {Array.isArray(bookUri) ? decodeURIComponent(bookUri[0].split("/").pop() || "Книга") : decodeURIComponent(bookUri.split("/").pop() || "Книга")}
  </Text>
        <TouchableOpacity onPress={() => setFontSize((prev) => prev + 2)}>
          <Text style={[styles.button, isDarkTheme && styles.darkText]}>A+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFontSize((prev) => Math.max(prev - 2, 12))}>
          <Text style={[styles.button, isDarkTheme && styles.darkText]}>A-</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFontColor(fontColor === "#000" ? "#007bff" : "#000")}>
          <Text style={[styles.button, isDarkTheme && styles.darkText]}>🎨</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: scrollPosition }} // Виправлення помилки
      >
        <Text style={[styles.text, { fontSize, color: fontColor }]}>{bookContent}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  darkContainer: { backgroundColor: "#222" },
  content: { flex: 1, padding: 20 },
  text: { fontSize: 16, color: "#000" },
  darkText: { color: "#fff" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
  },
  fileName: { fontSize: 18, fontWeight: "bold", flex: 1 },
  button: { fontSize: 18, paddingHorizontal: 10 },
});
