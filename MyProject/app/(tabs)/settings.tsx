import React, { useContext } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from "react-native";
import { ThemeContext } from "../ThemeContext";

const backgroundOptions = [
  "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800",
  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800",
  "https://images.unsplash.com/photo-1496309732348-3627f3f040ee?w=800",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
];

export default function SettingsScreen() {
  const { theme, toggleTheme, backgroundImage, setBackgroundImage } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";
  const hasBackgroundImage = !!backgroundImage;

  const handleAboutPress = () => {
    Alert.alert(
      "Про додаток",
      "Версія: 1.0.2\nАвтор: Максимчук Даниїл Сергійович\nЦей додаток створено як завдання до курсової роботи."
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        !hasBackgroundImage && (isDarkTheme ? styles.darkContainer : styles.lightContainer),
      ]}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>Тема</Text>
        <View style={styles.row}>
          <Text style={[styles.label, isDarkTheme && styles.darkText]}>Світла / Темна</Text>
          <Switch value={isDarkTheme} onValueChange={toggleTheme} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>Фон зображення</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {backgroundOptions.map((uri, index) => (
            <TouchableOpacity key={index} onPress={() => setBackgroundImage(uri)}>
              <Image source={{ uri }} style={styles.imageOption} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {hasBackgroundImage && (
          <TouchableOpacity onPress={() => setBackgroundImage(null)}>
            <Text style={[styles.resetText, isDarkTheme && styles.darkText]}>
              Скинути фон
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.section} onPress={handleAboutPress}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.darkText]}>Про додаток</Text>
        <Text style={[styles.aboutText, isDarkTheme && styles.darkText]}>
          Натисніть, щоб дізнатись більше
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  lightContainer: {
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  section: {
    marginBottom: 30,
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
  imageOption: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  resetText: {
    marginTop: 10,
    color: "red",
    textAlign: "center",
  },
});
