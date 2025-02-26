import React, { useEffect, useState, useContext } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal
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

  // Налаштування тексту
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000");
  const [bgColor, setBgColor] = useState("#fff");

  // Модальне вікно
  const [settingsVisible, setSettingsVisible] = useState(false);

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

  // Додавання закладки
  const saveBookmark = async () => {
    try {
      const bookmarks = JSON.parse(await AsyncStorage.getItem(`bookmarks-${bookUri}`) || "[]");
      bookmarks.push(scrollPosition);
      await AsyncStorage.setItem(`bookmarks-${bookUri}`, JSON.stringify(bookmarks));
      alert("Закладка збережена!");
    } catch (error) {
      console.error("❌ Помилка збереження закладки:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>

      {/* Панель управління */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Text style={[styles.button, { color: fontColor }]}>⚙️ Налаштування</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveBookmark}>
          <Text style={[styles.button, { color: fontColor }]}>🔖 Закладка</Text>
        </TouchableOpacity>
      </View>

      {/* Контент книги */}
      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: scrollPosition }}
      >
        <Text style={[styles.text, { fontSize, color: fontColor }]} selectable={true}>
  {bookContent}
</Text>
      </ScrollView>

      {/* Модальне вікно з налаштуваннями */}
      <Modal visible={settingsVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Налаштування</Text>

            {/* Зміна розміру шрифту */}
            <Text>Розмір шрифту:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setFontSize((prev) => Math.max(prev - 2, 12))}>
                <Text style={styles.modalButton}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize((prev) => prev + 2)}>
                <Text style={styles.modalButton}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Зміна кольору тексту */}
            <Text>Колір тексту:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setFontColor("#000")}>
                <Text style={styles.modalButton}>Чорний</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontColor("#fff")}>
                <Text style={styles.modalButton}>Білий</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontColor("#007bff")}>
                <Text style={styles.modalButton}>Синій</Text>
              </TouchableOpacity>
            </View>

            {/* Зміна фону */}
            <Text>Колір фону:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setBgColor("#fff")}>
                <Text style={styles.modalButton}>Білий</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBgColor("#000")}>
                <Text style={styles.modalButton}>Чорний</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBgColor("#f5deb3")}>
                <Text style={styles.modalButton}>Бежевий</Text>
              </TouchableOpacity>
            </View>

            {/* Закриття модального вікна */}
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalClose}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fileName: { fontSize: 18, fontWeight: "bold", textAlign: "center", padding: 10 },
  toolbar: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
  button: { fontSize: 18, paddingHorizontal: 10 },
  content: { flex: 1, padding: 15 }, // Додано стиль для ScrollView
  text: { lineHeight: 24 }, // Додано стиль для тексту книги
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  modalButton: { fontSize: 16, padding: 10, borderRadius: 5, backgroundColor: "#ddd" },
  modalClose: { textAlign: "center", marginTop: 10, color: "red" },
});