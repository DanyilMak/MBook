import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
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
  const isDark = theme === "dark";
  const [bookProgress, setBookProgress] = useState<{ [key: string]: number }>(
    {}
  );

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
        const newBooks = [
          ...prevBooks,
          { id: String(prevBooks.length + 1), title: name, uri, progress: 0 },
        ];
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
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>
        📚 Моя бібліотека
      </Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, isDark && styles.darkCard]}
            onPress={() => {
              router.push(`/reader?bookUri=${encodeURIComponent(item.uri)}`);
              AsyncStorage.getItem("readBooks").then((data) => {
                const readBooks = data ? JSON.parse(data) : [];
                if (!readBooks.includes(item.uri)) {
                  AsyncStorage.setItem(
                    "readBooks",
                    JSON.stringify([...readBooks, item.uri])
                  );
                }
              });
            }}
          >
            <Text style={[styles.bookTitle, isDark && styles.darkText]}>
              {item.title}
            </Text>
            <Text style={[styles.progressText, isDark && styles.darkText]}>
              Прогрес: {bookProgress[item.uri]?.toFixed(2) || 0}%
            </Text>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => updateProgress(item.uri)}
            >
              <Text style={styles.updateButtonText}>🔁 Оновити прогрес</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.addButton, isDark && styles.darkAddButton]}
        onPress={pickDocument}
      >
        <Text style={styles.addButtonText}>+ Додати книгу</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f0f0" },
  darkContainer: { backgroundColor: "#121212" },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000",
  },
  darkText: {
    color: "#eee",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: "#1e1e1e",
  },

  bookTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },
  progressText: {
    fontSize: 14,
    color: "#444",
  },

  updateButton: {
    marginTop: 10,
    backgroundColor: "#007bff",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  addButton: {
    marginTop: 16,
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  darkAddButton: {
    backgroundColor: "#333",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
