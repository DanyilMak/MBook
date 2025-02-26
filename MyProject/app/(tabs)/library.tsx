import React, { useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { ThemeContext } from "../ThemeContext";

interface Book {
  id: string;
  title: string;
  uri: string;
}

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });

      if (result.canceled || !result.assets?.length) return;

      const { uri, name } = result.assets[0];

      setBooks((prevBooks) => [
        ...prevBooks,
        { id: String(prevBooks.length + 1), title: name, uri },
      ]);
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося вибрати файл");
    }
  };

  return (
    <View style={[styles.container, isDarkTheme && styles.darkContainer]}>
      <Text style={[styles.title, isDarkTheme && styles.darkTitle]}>Моя бібліотека</Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bookItem, isDarkTheme && styles.darkBookItem]}
            onPress={() => router.push(`/reader?bookUri=${encodeURIComponent(item.uri)}`)}
          >
            <Text style={[styles.bookTitle, isDarkTheme && styles.darkBookTitle]}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={[styles.importButton, isDarkTheme && styles.darkImportButton]} onPress={pickDocument}>
        <Text style={[styles.importButtonText, isDarkTheme && styles.darkImportButtonText]}>+ Додати книгу</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
  bookItem: { padding: 15, marginBottom: 10, backgroundColor: "#f0f0f0", borderRadius: 10 },
  bookTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  importButton: { marginTop: 20, backgroundColor: "#007bff", padding: 15, borderRadius: 10, alignItems: "center" },
  importButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  darkContainer: { backgroundColor: "#222" },
  darkTitle: { color: "#fff" },
  darkBookItem: { backgroundColor: "#333" },
  darkBookTitle: { color: "#fff" },
  darkImportButton: { backgroundColor: "#444" },
  darkImportButtonText: { color: "#fff" },
});
