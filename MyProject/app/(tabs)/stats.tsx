import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { ThemeContext } from "../ThemeContext";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

export default function StatsScreen() {
  const { theme, backgroundImage } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [appTime, setAppTime] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [lastSession, setLastSession] = useState<string | null>(null);
  const [readBooksCount, setReadBooksCount] = useState(0);
  const [averageReadingTime, setAverageReadingTime] = useState(0);

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

        const allKeys = await AsyncStorage.getAllKeys();
        const timeKeys = allKeys.filter((key) => key.startsWith("readingTime_"));
        const stores = await AsyncStorage.multiGet(timeKeys);
        let total = 0;
        stores.forEach(([_, value]) => {
          if (value) total += parseInt(value, 10);
        });
        const avg = timeKeys.length > 0 ? total / timeKeys.length : 0;
        setAverageReadingTime(avg);
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
    if (hrs > 0) return `${hrs} год ${mins} хв`;
    if (mins > 0) return `${mins} хв ${secs} сек`;
    return `${secs} сек`;
  };

  const Card = ({ title, value }: { title: string; value: string }) => (
    <View style={[styles.card, isDark && styles.darkCard]}>
      <Text style={[styles.cardTitle, isDark && styles.darkText]}>{title}</Text>
      <Text style={[styles.cardValue, isDark && styles.darkText]}>{value}</Text>
    </View>
  );

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
        <Text style={[styles.header, isDark && styles.darkText]}>
          📊 Статистика
        </Text>

        <Card title="🕒 Час у додатку" value={formatTime(appTime)} />
        <Card title="📖 Час читання" value={formatTime(readingTime)} />
        <Card
          title="📆 Остання сесія"
          value={
            lastSession && !isNaN(new Date(lastSession).getTime())
              ? format(new Date(lastSession), "dd.MM.yyyy HH:mm", { locale: uk })
              : "Немає даних"
          }
        />
        <Card
          title="📚 Прочитаних книг"
          value={`${readBooksCount} книг${readBooksCount === 1 ? "а" : "и"}`}
        />
        <Card
          title="📊 Середній час читання на день"
          value={formatTime(Math.floor(averageReadingTime))}
        />
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
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  darkCard: {
    backgroundColor: "rgba(40,40,40,1)",
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
