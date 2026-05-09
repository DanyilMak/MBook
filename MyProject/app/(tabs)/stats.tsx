import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { ThemeContext } from "../ThemeContext";
import { format, subDays } from "date-fns";
import { uk } from "date-fns/locale";
import { BarChart } from "react-native-chart-kit";

export default function StatsScreen() {
  const { theme, backgroundImage } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [isLoaded, setIsLoaded] = useState(false);

  const [appTime, setAppTime] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [lastSession, setLastSession] = useState<string | null>(null);
  const [readBooksCount, setReadBooksCount] = useState(0);
  const [averageReadingTime, setAverageReadingTime] = useState(0);
  
  const [chartData, setChartData] = useState<{labels: string[], datasets: {data: number[]}[] }>({
    labels: [],
    datasets: [{ data: [] }]
  });

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        try {
          const savedAppTime = await AsyncStorage.getItem("appTime");
          if (savedAppTime && isActive) setAppTime(parseInt(savedAppTime, 10));

          const savedReadingTime = await AsyncStorage.getItem("readingTime");
          if (savedReadingTime && isActive) setReadingTime(parseInt(savedReadingTime, 10));

          const savedLastSession = await AsyncStorage.getItem("lastSession");
          if (savedLastSession && isActive) setLastSession(savedLastSession);

          const savedProgress = await AsyncStorage.getItem("progress");
          if (savedProgress && isActive) {
            const progressData = JSON.parse(savedProgress);
            let completedBooks = 0;
            
            for (const uri in progressData) {
              if (progressData[uri] >= 98) {
                completedBooks++;
              }
            }
            setReadBooksCount(completedBooks);
          }

          const allKeys = await AsyncStorage.getAllKeys();
          const timeKeys = allKeys.filter((key) => key.startsWith("readingTime_"));
          const stores = await AsyncStorage.multiGet(timeKeys);
          
          let total = 0;
          stores.forEach(([_, value]) => {
            if (value) total += parseInt(value, 10);
          });
          const avg = timeKeys.length > 0 ? total / timeKeys.length : 0;
          if (isActive) setAverageReadingTime(avg);

          const labels: string[] = [];
          const dataValues: number[] = [];
          for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateKey = `readingTime_${format(date, "yyyy-MM-dd")}`;
            const label = format(date, "eeeee", { locale: uk });
            
            labels.push(label);
            
            const dayValue = await AsyncStorage.getItem(dateKey);
            dataValues.push(dayValue ? Math.round(parseInt(dayValue, 10) / 60) : 0);
          }
          
          if (isActive) {
            setChartData({
              labels,
              datasets: [{ data: dataValues }]
            });
            setIsLoaded(true);
          }
        } catch (error) {
          console.error("Помилка завантаження статистики:", error);
        }
      };

      loadStats();
      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!isLoaded) return; 

    const timer = setInterval(() => {
      setAppTime((prev) => {
        const newValue = prev + 1;
        AsyncStorage.setItem("appTime", newValue.toString());
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLoaded]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs} год ${mins} хв`;
    if (mins > 0) return `${mins} хв ${secs} сек`;
    return `${secs} сек`;
  };

  let formattedLastSession = "Немає даних";
  if (lastSession) {
    const parsedDate = new Date(lastSession);
    if (!isNaN(parsedDate.getTime())) {
      formattedLastSession = format(parsedDate, "dd.MM.yyyy HH:mm", { locale: uk });
    } else {
      formattedLastSession = lastSession;
    }
  }

  const Card = ({ title, value, children }: { title: string; value?: string, children?: React.ReactNode }) => (
    <View style={[styles.card, isDark && styles.darkCard]}>
      <Text style={[styles.cardTitle, isDark && styles.darkText]}>{title}</Text>
      {value && <Text style={[styles.cardValue, isDark && styles.darkText]}>{value}</Text>}
      {children}
    </View>
  );

  const chartConfig = {
    backgroundGradientFrom: isDark ? "#282828" : "#fff",
    backgroundGradientTo: isDark ? "#282828" : "#fff",
    color: (opacity = 1) => isDark ? `rgba(187, 134, 252, ${opacity})` : `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    propsForLabels: {
        fontSize: 10
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
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.header, isDark && styles.darkText]}>
          📊 Статистика
        </Text>

        <Card title="📈 Активність за тиждень (хв)">
           <BarChart
            style={{ marginLeft: -16, marginTop: 10, borderRadius: 16 }}
            data={chartData}
            width={Dimensions.get("window").width - 40}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero={true}
          />
        </Card>

        <Card title="🕒 Час у додатку" value={formatTime(appTime)} />
        <Card title="📖 Час читання" value={formatTime(readingTime)} />
        <Card title="📆 Остання сесія" value={formattedLastSession} />
        <Card
          title="📚 Прочитаних книг"
          value={`${readBooksCount} книг${readBooksCount === 1 ? "а" : "и"}`}
        />
        <Card
          title="📊 Середній час читання на день"
          value={formatTime(Math.floor(averageReadingTime))}
        />
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden'
  },
  darkCard: {
    backgroundColor: "rgba(40,40,40,1)",
    shadowColor: "#000",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000",
  },
  darkText: {
    color: "#eee",
  },
});