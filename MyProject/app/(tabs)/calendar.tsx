import React, { useState, useContext, useCallback } from "react";
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
import { useFocusEffect } from "expo-router";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from "date-fns";
import { uk } from "date-fns/locale";
import { ThemeContext } from "../ThemeContext";

type DailyActivity = { time: number; books: number; note: string };

export default function CalendarScreen() {
  const { theme, backgroundImage } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [readingTime, setReadingTime] = useState(0);
  const [readBooksCount, setReadBooksCount] = useState(0);
  const [noteInput, setNoteInput] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [activityData, setActivityData] = useState<Record<string, DailyActivity>>({});

  const today = new Date();
  const monthName =
    format(currentMonth, "LLLL yyyy", { locale: uk }).charAt(0).toUpperCase() +
    format(currentMonth, "LLLL yyyy", { locale: uk }).slice(1);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncCompletedBooks = async () => {
        try {
          const todayDate = format(new Date(), "yyyy-MM-dd");

          const savedProgress = await AsyncStorage.getItem("progress");
          const progressData = savedProgress ? JSON.parse(savedProgress) : {};

          const trackedSaved = await AsyncStorage.getItem("completed_books_tracked");
          const trackedBooks: string[] = trackedSaved ? JSON.parse(trackedSaved) : [];

          const newlyCompleted: string[] = [];

          for (const uri in progressData) {
            if (progressData[uri] >= 98 && !trackedBooks.includes(uri)) {
              newlyCompleted.push(uri);
            }
          }

          if (newlyCompleted.length > 0) {
            const todaySavedBooks = await AsyncStorage.getItem(`readBooks_${todayDate}`);
            const todayBooks: string[] = todaySavedBooks ? JSON.parse(todaySavedBooks) : [];
            
            const updatedTodayBooks = [...todayBooks, ...newlyCompleted];
            await AsyncStorage.setItem(`readBooks_${todayDate}`, JSON.stringify(updatedTodayBooks));

            const updatedTracked = [...trackedBooks, ...newlyCompleted];
            await AsyncStorage.setItem("completed_books_tracked", JSON.stringify(updatedTracked));
          }
        } catch (error) {
          console.error("Помилка синхронізації прочитаних книг:", error);
        }
      };

      const loadCalendarData = async () => {
        await syncCompletedBooks();

        const allKeys = await AsyncStorage.getAllKeys();
        const relevantKeys = allKeys.filter(
          (key) => key.startsWith("note_") || key.startsWith("readingTime_") || key.startsWith("readBooks_")
        );
        
        const stores = await AsyncStorage.multiGet(relevantKeys);
        const data: Record<string, DailyActivity> = {};

        stores.forEach(([key, value]) => {
          if (!value) return;

          let dateStr = "";
          if (key.startsWith("note_")) dateStr = key.replace("note_", "");
          else if (key.startsWith("readingTime_")) dateStr = key.replace("readingTime_", "");
          else if (key.startsWith("readBooks_")) dateStr = key.replace("readBooks_", "");

          if (!data[dateStr]) data[dateStr] = { time: 0, books: 0, note: "" };

          if (key.startsWith("note_")) {
            data[dateStr].note = value;
          } else if (key.startsWith("readingTime_")) {
            data[dateStr].time = parseInt(value, 10);
          } else if (key.startsWith("readBooks_")) {
            data[dateStr].books = JSON.parse(value).length;
          }
        });

        if (isActive) setActivityData(data);
      };

      loadCalendarData();

      return () => { isActive = false; };
    }, [])
  );

  const openModal = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(formattedDate);

    const dayData = activityData[formattedDate] || { time: 0, books: 0, note: "" };
    
    setReadingTime(dayData.time);
    setReadBooksCount(dayData.books);
    setNoteInput(dayData.note);

    setModalVisible(true);
  };

  const saveNote = async () => {
    if (selectedDate) {
      await AsyncStorage.setItem(`note_${selectedDate}`, noteInput);
      
      setActivityData((prev) => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || { time: 0, books: 0 }),
          note: noteInput,
        },
      }));
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
            
            const dayData = activityData[formattedDay];
            const hasActivity = dayData && (dayData.note || dayData.time > 0 || dayData.books > 0);

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
                <Text style={[styles.dayText, isDark && styles.darkText, isToday && {color: "white"}]}>
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
    width: "100%"
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});