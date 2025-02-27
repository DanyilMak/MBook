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
  Modal,
  TextInput
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
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
  const [readingTime, setReadingTime] = useState(0);

  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000");
  const [bgColor, setBgColor] = useState("#fff");

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    const loadBook = async () => {
      try {
        if (!bookUri || typeof bookUri !== "string") return;

        const fileBase64 = await FileSystem.readAsStringAsync(bookUri, { encoding: FileSystem.EncodingType.Base64 });
        const binaryData = Buffer.from(fileBase64, "base64");
        const content = iconv.decode(binaryData, "win1251");

        setBookContent(content);

        const savedPosition = await AsyncStorage.getItem(`position-${bookUri}`);
        if (savedPosition) {
          setScrollPosition(parseInt(savedPosition, 10));
        }

        const savedNotes = await AsyncStorage.getItem(`notes-${bookUri}`);
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        }
      } catch (error) {
        console.error("❌ Помилка при завантаженні файлу:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookUri]);

  useEffect(() => {
    const loadProgress = async () => {
      if (!bookUri || Array.isArray(bookUri)) return;
  
      const savedProgress = await AsyncStorage.getItem("progress");
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        console.log("📥 Завантажений прогрес:", progressData[bookUri] || 0);
      }
    };
  
    loadProgress();
  }, [bookUri]);
  

  useEffect(() => {
    const loadReadingTime = async () => {
      const savedReadingTime = await AsyncStorage.getItem("readingTime");
      if (savedReadingTime) setReadingTime(parseInt(savedReadingTime, 10));
    };
    loadReadingTime();
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      let readingTimer = setInterval(() => {
        setReadingTime(prev => prev + 1);
      }, 1000);
  
      return () => {
        clearInterval(readingTimer);
        AsyncStorage.setItem("readingTime", readingTime.toString()).then(() => {
        });
        handleCloseBook();
      };
    }, [readingTime])
  );

  const handleScroll = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const offsetY = contentOffset.y;
    const visibleHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;
  
    const progress = (offsetY / (contentHeight - visibleHeight)) * 100;
  
    await AsyncStorage.setItem(`position-${bookUri}`, offsetY.toString());
  
    if (typeof bookUri !== "string") return;
  
    const savedProgress = await AsyncStorage.getItem("progress");
    const progressData: { [key: string]: number } = savedProgress ? JSON.parse(savedProgress) : {};
  
    progressData[bookUri] = progress;
    await AsyncStorage.setItem("progress", JSON.stringify(progressData));
  };

  const handleCloseBook = async () => {
    const currentDate = new Date().toLocaleString();
    await AsyncStorage.setItem("lastSession", currentDate);
  };
  
  const saveNote = async () => {
    if (newNote.trim()) {
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      setNewNote("");
      await AsyncStorage.setItem(`notes-${bookUri}`, JSON.stringify(updatedNotes));
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
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Text style={[styles.button, { color: fontColor }]}>⚙️ Налаштування</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNotesVisible(true)}>
          <Text style={[styles.button, { color: fontColor }]}>📝 Нотатки ({notes.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: scrollPosition }}
      >
        <Text style={[styles.text, { fontSize, color: fontColor }]} selectable={true}>{bookContent}</Text>
      </ScrollView>

      <Modal visible={settingsVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Налаштування</Text>

            <Text>Розмір шрифту:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setFontSize((prev) => Math.max(prev - 2, 12))}>
                <Text style={styles.modalButton}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize((prev) => prev + 2)}>
                <Text style={styles.modalButton}>A+</Text>
              </TouchableOpacity>
            </View>

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

            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalClose}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={notesVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Нотатки</Text>
            {notes.map((note, index) => (
              <Text key={index} style={styles.noteItem}>{note}</Text>
            ))}
            <TextInput
              style={styles.input}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Додати нотатку"
            />
            <TouchableOpacity onPress={saveNote}>
              <Text style={styles.modalButton}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNotesVisible(false)}>
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
  toolbar: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
  button: { fontSize: 18, paddingHorizontal: 10 },
  content: { flex: 1, padding: 15 },
  text: { lineHeight: 24 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  modalButton: { fontSize: 16, padding: 10, borderRadius: 5, backgroundColor: "#ddd" },
  modalClose: { textAlign: "center", marginTop: 10, color: "red" },
  input: { borderWidth: 1, padding: 10, marginVertical: 10, width: "100%" },
  noteItem: { padding: 5, borderBottomWidth: 1 },
});
