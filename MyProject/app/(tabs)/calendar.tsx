import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { uk } from "date-fns/locale";
import { ThemeContext } from "../ThemeContext";

export default function CalendarScreen() {
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";

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
      const storedBooks = await AsyncStorage.getItem(`readBooks_${formattedDate}`);
      setReadBooksCount(storedBooks ? JSON.parse(storedBooks).length : 0);
    };

    loadTodayBooks();

  }, []);

  const openModal = async (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(formattedDate);
  
    const storedTime = await AsyncStorage.getItem(`readingTime_${formattedDate}`);
    const storedBooks = await AsyncStorage.getItem(`readBooks_${formattedDate}`);
  
    setReadingTime(storedTime ? parseInt(storedTime, 10) : 0);
    setReadBooksCount(storedBooks ? JSON.parse(storedBooks).length : 0);
  
    setModalVisible(true);
  };
  
  return (
    <View style={[styles.container, isDarkTheme && styles.darkContainer]}>
      <Text style={[styles.header, isDarkTheme && styles.darkText]}>{monthName}</Text>
      <View style={styles.calendar}>
        {daysInMonth.map((day) => (
          <TouchableOpacity key={day.toISOString()} onPress={() => openModal(day)} style={styles.day}>
            <Text style={[styles.dayText, isDarkTheme && styles.darkText]}>{format(day, "d")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkTheme && styles.darkModal]}>
            <Text style={[styles.modalHeader, isDarkTheme && styles.darkText]}>📆 {selectedDate}</Text>
            <Text style={[styles.modalText, isDarkTheme && styles.darkText]}>
              ⏳ Час читання: {readingTime} сек
            </Text>
            <Text style={[styles.modalText, isDarkTheme && styles.darkText]}>
              📚 Кількість прочитаних книг: {readBooksCount}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#222",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  darkText: {
    color: "#fff",
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  day: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  dayText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  darkModal: {
    backgroundColor: "#444",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ff5757",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
