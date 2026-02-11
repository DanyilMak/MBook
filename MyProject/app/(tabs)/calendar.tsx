import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from "date-fns";
import { uk } from "date-fns/locale";
import { ThemeContext } from "../ThemeContext";

export default function CalendarScreen() {
  const { theme, backgroundImage } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [readBooksCount, setReadBooksCount] = useState(0);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  const today = new Date();

  const monthName =
    format(currentMonth, "LLLL yyyy", { locale: uk }).charAt(0).toUpperCase() +
    format(currentMonth, "LLLL yyyy", { locale: uk }).slice(1);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  useEffect(() => {
    const loadNotes = async () => {
      const allKeys = await AsyncStorage.getAllKeys();
      const noteKeys = allKeys.filter((key) => key.startsWith("note_"));
      const stores = await AsyncStorage.multiGet(noteKeys);
      const loadedNotes: { [key: string]: string } = {};
      stores.forEach(([key, value]) => {
        if (value) loadedNotes[key.replace("note_", "")] = value;
      });
      setNotes(loadedNotes);
    };
    loadNotes();
  }, []);

  const openModal = async (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(formattedDate);

    const storedTime = await AsyncStorage.getItem(`readingTime_${formattedDate}`);
    const storedBooks = await AsyncStorage.getItem(`readBooks_${formattedDate}`);
    const storedNote = await AsyncStorage.getItem(`note_${formattedDate}`);

    setReadingTime(storedTime ? parseInt(storedTime, 10) : 0);
    setReadBooksCount(storedBooks ? JSON.parse(storedBooks).length : 0);
    setNoteInput(storedNote || "");

    setModalVisible(true);
  };

  const saveNote = async () => {
    if (selectedDate) {
      await AsyncStorage.setItem(`note_${selectedDate}`, noteInput);
      setNotes((prev) => ({ ...prev, [selectedDate]: noteInput }));
    }
    setModalVisible(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs} год ${mins} хв ${secs} сек`;
  };

  return (
    <ImageBackground
      source={backgroundImage ? { uri: backgroundImage } : undefined}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Перемикання місяців */}
        <View style={styles.monthSwitcher}>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, -1))}>
            <Text style={[styles.switchText, isDark && styles.darkText]}>◀</Text>
          </TouchableOpacity>
          <Text style={[styles.header, isDark && styles.darkText]}>{monthName}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <Text style={[styles.switchText, isDark && styles.darkText]}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          {daysInMonth.map((day) => {
            const formattedDay = format(day, "yyyy-MM-dd");
            const isToday = formattedDay === format(today, "yyyy-MM-dd");
            const hasActivity =
              notes[formattedDay] || readingTime > 0 || readBooksCount > 0;

            return (
              <TouchableOpacity
                key={day.toISOString()}
                onPress={() => openModal(day)}
                style={[
                  styles.day,
                  isDark && styles.darkDay,
                  isToday && { backgroundColor: "#007bff" },
                  hasActivity && { borderColor: "#28a745", borderWidth: 2 },
                ]}
              >
                <Text style={[styles.dayText, isDark && styles.darkText]}>
                  {format(day, "d")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={[styles.modalCard, isDark && styles.darkCard]}>
              <Text style={[styles.modalHeader, isDark && styles.darkText]}>
                📅 {selectedDate}
              </Text>
              <Text style={[styles.modalItem, isDark && styles.darkText]}>
                ⏳ Час читання: {formatTime(readingTime)}
              </Text>
              <Text style={[styles.modalItem, isDark && styles.darkText]}>
                📚 Прочитано книг: {readBooksCount}
              </Text>
              <Text style={[styles.modalItem, isDark && styles.darkText]}>
                📝 Нотатка:
              </Text>
              <TextInput
                style={[
                  styles.noteInput,
                  isDark && { backgroundColor: "#333", color: "#eee" },
                ]}
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Введіть нотатку..."
                placeholderTextColor={isDark ? "#aaa" : "#555"}
              />
              <TouchableOpacity
                onPress={saveNote}
                style={[styles.closeButton, isDark && { backgroundColor: "#444" }]}
              >
                <Text style={styles.closeButtonText}>Зберегти</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeButton, { backgroundColor: "#ff5757" }]}
              >
                <Text style={styles.closeButtonText}>Закрити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(242,242,242,0.5)",
  },
  darkContainer: {
    backgroundColor: "rgba(18,18,18,0.5)",
  },
  scrollContent: {
    padding: 20,
  },
  monthSwitcher: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchText: {
    fontSize: 24,
    fontWeight: "700",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
  },
  darkText: {
    color: "#eee",
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  day: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(230,230,230,1)",
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: "transparent",
  },
  darkDay: {
    backgroundColor: "rgba(51,51,51,1)",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  darkCard: {
    backgroundColor: "rgba(30,30,30,0.9)",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalItem: {
    fontSize: 16,
    marginVertical: 4,
    textAlign: "center",
  },
  noteInput: {
    width: "100%",
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    color: "#000",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});