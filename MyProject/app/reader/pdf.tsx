import React from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";

export default function PdfReaderScreen() {
  const { bookUri } = useLocalSearchParams<{ bookUri: string }>();

  const decodedUri = decodeURIComponent(bookUri);

  if (!decodedUri) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: decodedUri }}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        javaScriptEnabled={true}
        startInLoadingState
        onError={(e) => {
          console.log("WebView error:", e.nativeEvent);
        }}
        onHttpError={(e) => {
          console.log("HTTP error:", e.nativeEvent);
        }}
      />
    </View>
  );
}
