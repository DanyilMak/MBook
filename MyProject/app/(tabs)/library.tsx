import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../ThemeContext";

interface Book {
  id: string;
  title: string;
  uri: string;
  type: "txt" | "pdf";
  progress?: number;
  favorite?: boolean;
}

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<"all" | "txt" | "pdf" | "favorites">("all");
  const [sort, setSort] = useState<"none" | "progress">("none");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [bookProgress, setBookProgress] = useState<{ [key: string]: number }>({});
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const router = useRouter();

  useEffect(() => {
    const loadBooks = async () => {
      const savedBooks = await AsyncStorage.getItem("books");
      const booksArray: Book[] = savedBooks ? JSON.parse(savedBooks) : [];

      const savedProgress = await AsyncStorage.getItem("progress");
      const progressData = savedProgress ? JSON.parse(savedProgress) : {};

      const updatedBooks = booksArray.map((book) => {
        let fixedType: "txt" | "pdf" = "txt";
        if (book.type === "pdf" || book.title?.toLowerCase().endsWith(".pdf")) {
          fixedType = "pdf";
        }
        return {
          ...book,
          type: fixedType,
          progress: progressData[book.uri] || 0,
          favorite: book.favorite || false,
        };
      });

      setBooks(updatedBooks);
      setBookProgress(progressData);
      await AsyncStorage.setItem("books", JSON.stringify(updatedBooks));
    };

    loadBooks();
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "application/pdf"],
      });

      if (result.canceled || !result.assets?.length) return;

      const { uri, name } = result.assets[0];
      const type: "pdf" | "txt" = name.toLowerCase().endsWith(".pdf") ? "pdf" : "txt";

      setBooks((prevBooks) => {
        const newBooks = [
          ...prevBooks,
          {
            id: String(prevBooks.length + 1),
            title: name,
            uri,
            type,
            progress: 0,
            favorite: false,
          },
        ];
        AsyncStorage.setItem("books", JSON.stringify(newBooks));
        return newBooks;
      });
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося вибрати файл");
    }
  };

  const toggleFavorite = async (uri: string) => {
    setBooks(prev => {
      const updated = prev.map(book =>
        book.uri === uri ? { ...book, favorite: !book.favorite } : book
      );

      AsyncStorage.setItem("books", JSON.stringify(updated));
      return updated;
    });
  };


  const updateProgress = async (uri: string) => {
    const savedProgress = await AsyncStorage.getItem("progress");
    const progressData = savedProgress ? JSON.parse(savedProgress) : {};
    const currentProgress = progressData[uri] || 0;

    setBookProgress((prevProgress) => ({
      ...prevProgress,
      [uri]: currentProgress,
    }));

    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.uri === uri ? { ...book, progress: currentProgress } : book
      )
    );
  };

  const deleteBook = (uri: string) => {
    Alert.alert("Видалити книгу", "Ви впевнені, що хочете видалити цю книгу?", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          const updatedBooks = books.filter((book) => book.uri !== uri);
          setBooks(updatedBooks);
          await AsyncStorage.setItem("books", JSON.stringify(updatedBooks));
        },
      },
    ]);
  };

  let filteredBooks = books;
  if (filter === "txt" || filter === "pdf") {
    filteredBooks = books.filter((book) => book.type === filter);
  } else if (filter === "favorites") {
    filteredBooks = books.filter((book) => book.favorite);
  }

  if (sort === "progress") {
    filteredBooks = [...filteredBooks].sort(
      (a, b) => (b.progress || 0) - (a.progress || 0)
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>
        📚 Моя бібліотека
      </Text>

      <View style={{ flexDirection: "row", marginBottom: 10, gap: 5 }}>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={[styles.filterButtonBox,
          isDark && styles.darkFilterButtonBox,
          filter !== "all" && { backgroundColor: "#3154e1" }]}
          activeOpacity={0.8}
        >
          <Text style={styles.filterButtonText}>🔍 Фільтр</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={[styles.filterButtonBox,
          isDark && styles.darkFilterButtonBox,
          sort !== "none" && { backgroundColor: "#3154e1" }]}
          activeOpacity={0.8}
        >
          <Text style={styles.filterButtonText}>⬇️ Сортування</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setFilter(prev => (prev === "favorites" ? "all" : "favorites"))
          }
          style={[
            styles.filterButtonBox,
            isDark && styles.darkFilterButtonBox,
            filter === "favorites" && { backgroundColor: "#3154e1" }
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.filterButtonText}>
            ❤️ Улюблені
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, isDark && styles.darkCard]}
            onPress={() => {
              const route = item.type === "pdf" ? "/reader/pdf" : "/reader";
              router.push(`${route}?bookUri=${encodeURIComponent(item.uri)}`);

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
              onPress={() => toggleFavorite(item.uri)}
              style={{ marginTop: 8 }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: item.favorite ? "#e63946" : "#555",
                }}
              >
                {item.favorite ? "❤️ Улюблена" : "🤍 Додати в улюблені"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => updateProgress(item.uri)}
            >
              <Text style={styles.updateButtonText}>🔁 Оновити прогрес</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: "#dc3545", marginTop: 6 }]}
              onPress={() => deleteBook(item.uri)}
            >
              <Text style={styles.updateButtonText}>🗑️ Видалити книгу</Text>
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

      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && { backgroundColor: "#222" }]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Обрати фільтр</Text>
            {["all", "txt", "pdf"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setFilter(type as "all" | "txt" | "pdf");
                  setFilterModalVisible(false);
                }}
                style={{ marginVertical: 8 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: filter === type ? "#007bff" : isDark ? "#eee" : "#000",
                  }}
                >
                  {type === "all" ? "Усі книги" : `Тільки ${type.toUpperCase()}`}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: "#888" }}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={sortModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && { backgroundColor: "#222" }]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Сортувати книги</Text>
            {["none", "progress"].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setSort(option as "none" | "progress");
                  setSortModalVisible(false);
                }}
                style={{ marginVertical: 8 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: sort === option ? "#007bff" : isDark ? "#eee" : "#000",
                  }}
                >
                  {option === "none" ? "Без сортування" : "За прогресом"}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setSortModalVisible(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: "#888" }}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f0f0" },
  darkContainer: { backgroundColor: "#121212" },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
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

  filterButtonBox: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  darkFilterButtonBox: {
    backgroundColor: "#444",
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
});
