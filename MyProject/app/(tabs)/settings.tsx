import React, { useContext } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { ThemeContext } from "../ThemeContext";

const backgroundOptions = [
  "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800",
  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800",
  "https://images.unsplash.com/photo-1496309732348-3627f3f040ee?w=800",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
];

export default function SettingsScreen() {
  const { theme, toggleTheme, backgroundImage, setBackgroundImage } =
    useContext(ThemeContext);

  const isDark = theme === "dark";
  const hasBackground = !!backgroundImage;

  const handleAboutPress = () => {
    Alert.alert(
      "Про додаток",
      "Версія: 1.0.3\nАвтор: Максимчук Даниїл Сергійович\nЦей застосунок створено як завдання до виробничої практики, та модифіковано у рамках курсової роботи."
    );
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={{ padding: 20 }}
    >
      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.title, isDark && styles.darkText]}>🎨 Тема</Text>
        <View style={styles.row}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Світла / Темна
          </Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          🖼️ Фон зображення
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {backgroundOptions.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => setBackgroundImage(uri)}>
              <Image source={{ uri }} style={styles.imageOption} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {hasBackground && (
          <TouchableOpacity onPress={() => setBackgroundImage(null)}>
            <Text style={[styles.resetText, isDark && styles.darkText]}>
              ❌ Скинути фон
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handleAboutPress}
        style={[styles.card, isDark && styles.darkCard]}
      >
        <Text style={[styles.title, isDark && styles.darkText]}>
          ℹ️ Про додаток
        </Text>
        <Text style={[styles.aboutText, isDark && styles.darkText]}>
          Натисніть, щоб дізнатись більше
        </Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: "#1e1e1e",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#000",
  },
  darkText: {
    color: "#eee",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    color: "#000",
  },
  aboutText: {
    fontSize: 16,
    color: "#007bff",
  },
  imageOption: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  resetText: {
    marginTop: 12,
    fontSize: 14,
    color: "#ff4d4d",
    textAlign: "center",
  },
});
