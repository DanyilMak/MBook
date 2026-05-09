import React, { useEffect, useState, useContext, useRef } from "react";
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
  TextInput,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, Stack } from "expo-router";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import iconv from "iconv-lite";
import { Buffer } from "buffer";
import { ThemeContext } from "../ThemeContext";
import { format } from "date-fns";
import * as Speech from "expo-speech";

export default function ReaderScreen() {
  const { bookUri } = useLocalSearchParams();
  const [bookContent, setBookContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";

  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState(isDarkTheme ? "#eee" : "#111");
  const [bgColor, setBgColor] = useState(isDarkTheme ? "#121212" : "#fdfdfd");

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);

  const timeRef = useRef({ total: 0, today: 0 });

  useEffect(() => {
    setFontColor(isDarkTheme ? "#eee" : "#111");
    setBgColor(isDarkTheme ? "#121212" : "#fdfdfd");
  }, [isDarkTheme]);

  useEffect(() => {
    const loadBookAndData = async () => {
      try {
        if (!bookUri || typeof bookUri !== "string") return;

        const fileBase64 = await FileSystem.readAsStringAsync(bookUri, { encoding: FileSystem.EncodingType.Base64 });
        const binaryData = Buffer.from(fileBase64, "base64");
        const content = iconv.decode(binaryData, "win1251");
        setBookContent(content);

        const savedPosition = await AsyncStorage.getItem(`position-${bookUri}`);
        if (savedPosition) setScrollPosition(parseInt(savedPosition, 10));

        const savedNotes = await AsyncStorage.getItem(`notes-${bookUri}`);
        if (savedNotes) setNotes(JSON.parse(savedNotes));

        const today = format(new Date(), "yyyy-MM-dd");
        const savedTotal = await AsyncStorage.getItem("readingTime");
        const savedToday = await AsyncStorage.getItem(`readingTime_${today}`);
        if (savedTotal) timeRef.current.total = parseInt(savedTotal, 10);
        if (savedToday) timeRef.current.today = parseInt(savedToday, 10);

      } catch (error) {
        console.error("Помилка при завантаженні файлу:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBookAndData();
  }, [bookUri]);

  useEffect(() => {
    return () => {
      isSpeakingRef.current = false;
      Speech.stop();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const timer = setInterval(() => {
        timeRef.current.total += 1;
        timeRef.current.today += 1;
      }, 1000);

      return () => {
        clearInterval(timer);
        AsyncStorage.setItem("readingTime", timeRef.current.total.toString());
        AsyncStorage.setItem(`readingTime_${today}`, timeRef.current.today.toString());
        handleCloseBook();
      };
    }, [])
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
    const progressData = savedProgress ? JSON.parse(savedProgress) : {};
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

  const readChunks = (chunks: string[], index = 0) => {
    if (!isSpeakingRef.current || index >= chunks.length) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    Speech.speak(chunks[index], {
      language: "uk-UA",
      rate: 0.9,
      onDone: () => readChunks(chunks, index + 1),
      onError: () => readChunks(chunks, index + 1),
      onStopped: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    });
  };

  const toggleSpeech = () => {
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      Speech.stop();
    } else {
      if (bookContent) {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        const chunks = bookContent.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        readChunks(chunks, 0);
      }
    }
  };

  const screenOptions = {
    headerShown: true,
    title: "Читання книги",
    headerStyle: { backgroundColor: bgColor },
    headerTintColor: fontColor,
  };

  const borderColor = bgColor === "#121212" ? "#333" : (bgColor === "#f5deb3" ? "#d4c09a" : "#ddd");

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={screenOptions} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={fontColor} />
        </View>
      ) : (
        <>
          <View style={[styles.toolbar, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.toolbarBtn}>
              <Text style={[styles.button, { color: fontColor }]}>⚙️ Налаштування</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNotesVisible(true)} style={styles.toolbarBtn}>
              <Text style={[styles.button, { color: fontColor }]}>📝 Нотатки ({notes.length})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentOffset={{ x: 0, y: scrollPosition }}
          >
            <Text style={[styles.text, { fontSize, color: fontColor }]} selectable={true}>
              {bookContent}
            </Text>
            <View style={styles.bottomSpacer} />
          </ScrollView>

          <TouchableOpacity 
            style={[styles.fab, isSpeaking ? styles.fabStop : styles.fabPlay]} 
            onPress={toggleSpeech}
          >
            <Text style={styles.fabText}>
              {isSpeaking ? "🛑 Зупинити" : "🔊 Слухати книгу"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={settingsVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <Text style={[styles.modalTitle, { color: fontColor }]}>Налаштування</Text>
            <Text style={{ color: fontColor }}>Розмір шрифту:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setFontSize((prev) => Math.max(prev - 2, 12))}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setFontSize((prev) => prev + 2)}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>A+</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: fontColor }}>Колір тексту:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setFontColor("#111")}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>Чорний</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setFontColor("#eee")}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>Білий</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: fontColor }}>Колір фону:</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setBgColor("#fdfdfd")}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>Світлий</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setBgColor("#121212")}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>Темний</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, isDarkTheme && styles.darkBtn]} onPress={() => setBgColor("#f5deb3")}>
                <Text style={isDarkTheme ? styles.darkText : undefined}>Сепія</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalClose}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={notesVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <Text style={[styles.modalTitle, { color: fontColor }]}>Нотатки</Text>
            <ScrollView style={styles.notesScrollView}>
              {notes.length === 0 ? (
                <Text style={[styles.noteItem, { color: fontColor, borderBottomColor: borderColor }, styles.emptyNotes]}>Нотаток поки немає...</Text>
              ) : (
                notes.map((note, index) => (
                  <Text key={index} style={[styles.noteItem, { color: fontColor, borderBottomColor: borderColor }]}>{note}</Text>
                ))
              )}
            </ScrollView>
            <TextInput
              style={[styles.input, { color: fontColor, borderColor: borderColor, backgroundColor: bgColor === "#121212" ? "#222" : (bgColor === "#fdfdfd" ? "#f9f9f9" : "#eed5a6") }]}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Додати нотатку"
              placeholderTextColor={fontColor === "#eee" ? "#888" : "#aaa"}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveNote}>
                <Text style={styles.saveButtonText}>Зберегти</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.closeButton]} onPress={() => setNotesVisible(false)}>
                <Text style={styles.closeButtonText}>Закрити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  toolbar: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    padding: 12, 
    borderBottomWidth: 1,
    elevation: 3
  },
  toolbarBtn: { padding: 8 },
  button: { fontSize: 16, fontWeight: "600" },
  content: { flex: 1, padding: 20 },
  text: { lineHeight: 26 },
  bottomSpacer: { height: 100 },
  fab: { position: "absolute", bottom: 30, right: 20, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabPlay: { backgroundColor: "#007bff" },
  fabStop: { backgroundColor: "#dc3545" },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalContent: { width: "85%", padding: 25, borderRadius: 15 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: "#e0e0e0" },
  darkBtn: { backgroundColor: "#444" },
  darkText: { color: "#eee" },
  modalClose: { textAlign: "center", marginTop: 15, color: "#ff4d4d", fontSize: 16, fontWeight: "bold" },
  notesScrollView: { maxHeight: 200, marginBottom: 10 },
  emptyNotes: { fontStyle: "italic" },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginVertical: 15, width: "100%", fontSize: 16 },
  noteItem: { paddingVertical: 10, borderBottomWidth: 1, fontSize: 16 },
  saveButton: { flex: 1, marginRight: 5, backgroundColor: "#28a745" },
  saveButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  closeButton: { flex: 1, marginLeft: 5, backgroundColor: "#dc3545" },
  closeButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" }
});