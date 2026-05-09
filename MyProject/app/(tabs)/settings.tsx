import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ImageBackground,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  useEffect(() => {
    const loadBackground = async () => {
      const savedBackground = await AsyncStorage.getItem("backgroundImage");
      if (savedBackground) {
        setBackgroundImage(savedBackground);
      }
    };
    loadBackground();
  }, []);

  useEffect(() => {
    if (backgroundImage) {
      AsyncStorage.setItem("backgroundImage", backgroundImage);
    } else {
      AsyncStorage.removeItem("backgroundImage");
    }
  }, [backgroundImage]);

  const handleAboutPress = () => {
    Alert.alert(
      "Про додаток",
      "Версія: 1.0.8\nАвтор: Максимчук Даниїл Сергійович\nЦей застосунок створено як завдання до виробничої практики, та модифіковано у рамках курсової та дипломної робіт."
    );
  };

  const pickCustomImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Доступ заборонено", "Додаток потребує доступу до галереї");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [9, 16],
      });


      if (!result.canceled) {
        setBackgroundImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося вибрати зображення");
    }
  };

  return (
    <ImageBackground
      source={backgroundImage ? { uri: backgroundImage } : undefined}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
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
                <Image
                  source={{ uri }}
                  style={[
                    styles.imageOption,
                    backgroundImage === uri && { borderColor: "#007bff", borderWidth: 3 },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.customButton,
              { backgroundColor: isDark ? "#444" : "#007bff" },
            ]}
            onPress={pickCustomImage}
          >
            <Text style={styles.customButtonText}>📂 Обрати своє зображення</Text>
          </TouchableOpacity>

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
  card: {
    backgroundColor: "rgba(255,255,255,1)",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: "rgba(30,30,30,1)",
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
  customButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  customButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  resetText: {
    marginTop: 12,
    fontSize: 14,
    color: "#ff4d4d",
    textAlign: "center",
  },
});
