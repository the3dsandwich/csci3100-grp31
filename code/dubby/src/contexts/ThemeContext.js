import React, { createContext, useState } from "react";

export const ThemeContext = createContext();

const purple = "#AD93AB";
const yellow = "#F0C27B";

const backgroundStyle = {
  minHeight: "100vh",
  paddingBottom: "1rem",
  overflowX: "hidden",
};

const jumbotronStyle = { textAlign: "center" };

const loadingStyle = {
  width: "100vw",
  height: "80vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-around",
};

const themes = {
  primary: {
    background: {
      backgroundColor: yellow,
      ...backgroundStyle,
    },
    jumbotron: {
      backgroundColor: yellow,
      ...jumbotronStyle,
    },
    loading: {
      ...loadingStyle,
    },
    spinnerColor: "dark",
  },
  secondary: {
    background: {
      backgroundColor: purple,
      ...backgroundStyle,
    },
    jumbotron: {
      backgroundColor: purple,
      ...jumbotronStyle,
    },
    loading: {
      ...loadingStyle,
    },
    spinnerColor: "light",
  },
};

const ThemeContextProvider = (props) => {
  const [isPrimaryTheme, setIsPrimaryTheme] = useState(true);

  const toggleTheme = () => {
    setIsPrimaryTheme(!isPrimaryTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        toggleTheme,
        isPrimaryTheme,
        theme: isPrimaryTheme ? themes.primary : themes.secondary,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
