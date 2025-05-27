import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { uk } from "date-fns/locale";
import { ThemeContext } from "../ThemeContext";

export default function CalendarScreen() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [readBooksCount, setReadBooksCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const today = new Date();
  const monthName =
    format(today, "LLLL yyyy", { locale: uk }).charAt(0).toUpperCase() +
    format(today, "LLLL yyyy", { locale: uk }).slice(1);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  useEffect(() => {
    const loadTodayBooks = async () => {
      const formattedDate = format(today, "yyyy-MM-dd");
      const storedBooks = await AsyncStorage.getItem(
        `readBooks_${formattedDate}`
      );
      setReadBooksCount(storedBooks ? JSON.parse(storedBooks).length : 0);
    };

    loadTodayBooks();
  }, []);

  const openModal = async (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(formattedDate);

    const storedTime = await AsyncStorage.getItem(
      `readingTime_${formattedDate}`
    );
    const storedBooks = await AsyncStorage.getItem(
      `readBooks_${formattedDate}`
    );

    setReadingTime(storedTime ? parseInt(storedTime, 10) : 0);
    setReadBooksCount(storedBooks ? JSON.parse(storedBooks).length : 0);

    setModalVisible(true);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs} год ${mins} хв ${secs} сек`;
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.header, isDark && styles.darkText]}>{monthName}</Text>

      <View style={styles.calendar}>
        {daysInMonth.map((day) => (
          <TouchableOpacity
            key={day.toISOString()}
            onPress={() => openModal(day)}
            style={[styles.day, isDark && styles.darkDay]}
          >
            <Text style={[styles.dayText, isDark && styles.darkText]}>
              {format(day, "d")}
            </Text>
          </TouchableOpacity>
        ))}
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
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
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
    backgroundColor: "#e6e6e6",
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  darkDay: {
    backgroundColor: "#333",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#1e1e1e",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalItem: {
    fontSize: 16,
    marginVertical: 4,
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#ff5757",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
