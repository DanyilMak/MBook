import React, { createContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "light" | "dark";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  backgroundImage: string | null;
  setBackgroundImage: (uri: string | null) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: "light",
  toggleTheme: () => {},
  backgroundImage: null,
  setBackgroundImage: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setBackgroundImage = async (uri: string | null) => {
    setBackgroundImageState(uri);
    await AsyncStorage.setItem("backgroundImage", uri || "");
  };

  useEffect(() => {
    const loadBackground = async () => {
      const saved = await AsyncStorage.getItem("backgroundImage");
      if (saved) setBackgroundImageState(saved);
    };
    loadBackground();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, backgroundImage, setBackgroundImage }}>
      {children}
    </ThemeContext.Provider>
  );
};
