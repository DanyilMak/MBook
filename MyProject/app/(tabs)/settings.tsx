import React, { useContext } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ThemeContext } from "../ThemeContext"; 

export default function SettingsScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";

  const handleAboutPress = () => {
    Alert.alert(
      "Про додаток",
      "Версія: 1.0.0\nАвтор: Максимчук Даниїл\nЦей додаток створено як завдання до виробничої практики, студентом КН-3 Максимчуком Даниїлом.\nМета додатку, читання книг у певному форматі з трекінгом статистики."
    );
  };

  return (
    <View style={[styles.container, isDarkTheme && styles.darkContainer]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>Тема</Text>
        <View style={styles.row}>
          <Text style={[styles.label, isDarkTheme && styles.darkText]}>
            Світла / Темна
          </Text>
          <Switch value={isDarkTheme} onValueChange={toggleTheme} />
        </View>
      </View>

      <TouchableOpacity style={styles.section} onPress={handleAboutPress}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>Про додаток</Text>
        <Text style={[styles.aboutText, isDarkTheme && styles.darkText]}>
          Натисніть, щоб дізнатись більше
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  section: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    color: "#000",
  },
  aboutText: {
    fontSize: 16,
    color: "#007bff",
  },
  darkText: {
    color: "#fff",
  },
});
