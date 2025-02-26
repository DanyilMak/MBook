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

  useEffect(() => {
    let appTimer = setInterval(() => {
      setAppTime((prev) => prev + 1);
    }, 1000);

    const loadTimes = async () => {
      const savedAppTime = await AsyncStorage.getItem("appTime");
      if (savedAppTime) setAppTime(parseInt(savedAppTime, 10));

      const savedReadingTime = await AsyncStorage.getItem("readingTime");
      if (savedReadingTime) setReadingTime(parseInt(savedReadingTime, 10));
    };

    loadTimes();

    return () => clearInterval(appTimer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadReadingTime = async () => {
        const savedReadingTime = await AsyncStorage.getItem("readingTime");
        if (savedReadingTime) setReadingTime(parseInt(savedReadingTime, 10));
      };

      loadReadingTime();
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
      <Text style={[styles.text, isDarkTheme && styles.darkText]}>
        Час у додатку: {formatTime(appTime)}
      </Text>
      <Text style={[styles.text, isDarkTheme && styles.darkText]}>
        Час читання: {formatTime(readingTime)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  text: {
    fontSize: 18,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
});
