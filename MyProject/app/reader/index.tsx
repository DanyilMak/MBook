import React from "react";
import { View, StyleSheet } from "react-native";
import { ReadiumView } from "react-native-readium";
import { useLocalSearchParams } from "expo-router";

export default function ReaderScreen() {
  const { bookUri } = useLocalSearchParams<{ bookUri: string }>();

  return (
    <View style={styles.container}>
      <ReadiumView
        file={{ url: bookUri }}
        style={{ flex: 1 }}
        onLocationChange={(location) => console.log("Нова сторінка:", location)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
