import React, { useState, useContext, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../ThemeContext";

interface Book {
  id: string;
  title: string;
  uri: string;
  progress?: number;
}

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme === "dark";
  const [bookProgress, setBookProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const loadBooks = async () => {
      const savedBooks = await AsyncStorage.getItem("books");
      const booksArray: Book[] = savedBooks ? JSON.parse(savedBooks) : [];

      const savedProgress = await AsyncStorage.getItem("progress");
      const progressData = savedProgress ? JSON.parse(savedProgress) : {};

      const updatedBooks = booksArray.map((book) => ({
        ...book,
        progress: progressData[book.uri] || 0,
      }));

      setBooks(updatedBooks);
      setBookProgress(progressData);
    };

    loadBooks();
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
      });

      if (result.canceled || !result.assets?.length) return;

      const { uri, name } = result.assets[0];

      setBooks((prevBooks) => {
        const newBooks = [...prevBooks, { id: String(prevBooks.length + 1), title: name, uri, progress: 0 }];
        AsyncStorage.setItem("books", JSON.stringify(newBooks));
        return newBooks;
      });
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося вибрати файл");
    }
  };

  const updateProgress = async (uri: string) => {
    const savedProgress = await AsyncStorage.getItem("progress");
    const progressData = savedProgress ? JSON.parse(savedProgress) : {};
    const currentProgress = progressData[uri] || 0;

    setBookProgress((prevProgress) => {
      const updatedProgress = { ...prevProgress, [uri]: currentProgress };
      return updatedProgress;
    });

    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.uri === uri ? { ...book, progress: currentProgress } : book
      )
    );
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
            onPress={() => {
              router.push(`/reader?bookUri=${encodeURIComponent(item.uri)}`);
              AsyncStorage.getItem("readBooks").then((data) => {
                const readBooks = data ? JSON.parse(data) : [];
                if (!readBooks.includes(item.uri)) {
                  AsyncStorage.setItem("readBooks", JSON.stringify([...readBooks, item.uri]));
                }
              });
            }}
          >
            <Text style={[styles.bookTitle, isDarkTheme && styles.darkBookTitle]}>{item.title}</Text>
            <Text style={{ color: isDarkTheme ? "#bbb" : "#555", fontSize: 14 }}>
              Прогрес: {bookProgress[item.uri]?.toFixed(2) || 0}%
            </Text>
            <TouchableOpacity
              style={styles.updateProgressButton}
              onPress={() => updateProgress(item.uri)}
            >
              <Text style={styles.updateProgressText}>Оновити прогрес</Text>
            </TouchableOpacity>
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
  progress: { fontSize: 14, color: "#007bff", marginTop: 5 },
  importButton: { marginTop: 20, backgroundColor: "#007bff", padding: 15, borderRadius: 10, alignItems: "center" },
  importButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  darkContainer: { backgroundColor: "#222" },
  darkTitle: { color: "#fff" },
  darkBookItem: { backgroundColor: "#333" },
  darkBookTitle: { color: "#fff" },
  darkText: { color: "#fff" },
  darkImportButton: { backgroundColor: "#444" },
  darkImportButtonText: { color: "#fff" },
  updateProgressButton: {
    marginTop: 10,
    padding: 5,
    backgroundColor: "#007bff",
    borderRadius: 5,
    alignItems: "center",
  },
  updateProgressText: { color: "#fff", fontSize: 12 },
});
