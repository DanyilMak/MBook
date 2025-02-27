import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { ThemeContext } from "../ThemeContext";

export default function StatsScreen() {
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";

  const [appTime, setAppTime] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [lastSession, setLastSession] = useState<string | null>(null);
  const [readBooksCount, setReadBooksCount] = useState(0);

  useEffect(() => {
    let appTimer = setInterval(() => {
      setAppTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(appTimer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        const savedAppTime = await AsyncStorage.getItem("appTime");
        if (savedAppTime && isActive) setAppTime(parseInt(savedAppTime, 10));

        const savedReadingTime = await AsyncStorage.getItem("readingTime");
        if (savedReadingTime && isActive) setReadingTime(parseInt(savedReadingTime, 10));

        const savedLastSession = await AsyncStorage.getItem("lastSession");
        if (savedLastSession && isActive) setLastSession(savedLastSession);

        const savedBooks = await AsyncStorage.getItem("readBooks");
        if (savedBooks && isActive) setReadBooksCount(JSON.parse(savedBooks).length);
      };

      loadStats();

      const sessionUpdater = setInterval(async () => {
        const savedLastSession = await AsyncStorage.getItem("lastSession");
        if (savedLastSession && isActive) setLastSession(savedLastSession);
      }, 5000);

      return () => {
        isActive = false;
        clearInterval(sessionUpdater);
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

  return (
    <View style={[styles.container, isDarkTheme && styles.darkContainer]}>
      <Text style={[styles.header, isDarkTheme && styles.darkText]}>📊 Статистика</Text>
      <View style={[styles.card, isDarkTheme && styles.darkCard]}>
        <Text style={[styles.text, isDarkTheme && styles.darkText]}>
          ⏳ Час у додатку: {formatTime(appTime)}
        </Text>
      </View>
      <View style={[styles.card, isDarkTheme && styles.darkCard]}>
        <Text style={[styles.text, isDarkTheme && styles.darkText]}>
          📖 Час читання: {formatTime(readingTime)}
        </Text>
      </View>
      <View style={[styles.card, isDarkTheme && styles.darkCard]}>
        <Text style={[styles.text, isDarkTheme && styles.darkText]}>
          📆 Остання сесія: {lastSession || "Немає даних"}
        </Text>
      </View>
      <View style={[styles.card, isDarkTheme && styles.darkCard]}>
        <Text style={[styles.text, isDarkTheme && styles.darkText]}>
          📚 Прочитаних книг: {readBooksCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  darkContainer: {
    backgroundColor: "#222",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    width: "90%",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkCard: {
    backgroundColor: "#333",
    shadowColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
  },
  darkText: {
    color: "#fff",
  },
});

