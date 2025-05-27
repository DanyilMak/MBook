import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { ThemeContext } from "../ThemeContext";

export default function StatsScreen() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [appTime, setAppTime] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [lastSession, setLastSession] = useState<string | null>(null);
  const [readBooksCount, setReadBooksCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setAppTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        const savedAppTime = await AsyncStorage.getItem("appTime");
        if (savedAppTime && isActive) setAppTime(parseInt(savedAppTime, 10));

        const savedReadingTime = await AsyncStorage.getItem("readingTime");
        if (savedReadingTime && isActive)
          setReadingTime(parseInt(savedReadingTime, 10));

        const savedLastSession = await AsyncStorage.getItem("lastSession");
        if (savedLastSession && isActive) setLastSession(savedLastSession);

        const savedBooks = await AsyncStorage.getItem("readBooks");
        if (savedBooks && isActive) {
          const books = JSON.parse(savedBooks);
          setReadBooksCount(books.length);
        }
      };

      loadStats();
      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    AsyncStorage.setItem("appTime", appTime.toString());
  }, [appTime]);

  useEffect(() => {
    AsyncStorage.setItem("readingTime", readingTime.toString());
  }, [readingTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs} год ${mins} хв ${secs} сек`;
  };

  const Card = ({ title, value }: { title: string; value: string }) => (
    <View style={[styles.card, isDark && styles.darkCard]}>
      <Text style={[styles.cardTitle, isDark && styles.darkText]}>{title}</Text>
      <Text style={[styles.cardValue, isDark && styles.darkText]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.header, isDark && styles.darkText]}>
        📊 Статистика
      </Text>

      <Card title="🕒 Час у додатку" value={formatTime(appTime)} />
      <Card title="📖 Час читання" value={formatTime(readingTime)} />
      <Card
        title="📆 Остання сесія"
        value={lastSession || "Немає даних"}
      />
      <Card
        title="📚 Прочитаних книг"
        value={`${readBooksCount} книг${readBooksCount === 1 ? "а" : "и"}`}
      />
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
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#000",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000",
  },
  darkText: {
    color: "#eee",
  },
});
