import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const ThemeContext = createContext(null);

const DEFAULTS = {
  accent_color: "#38BDF8",
  brand_color: "#2563EB",
  nav_bg_color: "#1D4ED8",
  site_name: "PunchListJobs",
  tagline: "A Blue Collar ME Company",
};

function applyVars(c) {
  const r = document.documentElement;
  r.style.setProperty("--theme-accent", c.accent_color);
  r.style.setProperty("--theme-brand",  c.brand_color);
  r.style.setProperty("--theme-nav-bg", c.nav_bg_color);
}

export function ThemeProvider({ children }) {
  const [colors, setColors] = useState(DEFAULTS);
  const [isDark, setIsDark] = useState(() =>
    localStorage.getItem("tdl_theme") !== "light"  // default: dark
  );

  // Apply CSS vars immediately from DEFAULTS on first paint
  useEffect(() => { applyVars(DEFAULTS); }, []);

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    localStorage.setItem("tdl_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark(p => !p);

  // Override vars once backend responds
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/settings/public`)
      .then(({ data }) => {
        const merged = {
          accent_color: data.accent_color || DEFAULTS.accent_color,
          brand_color:  data.brand_color  || DEFAULTS.brand_color,
          nav_bg_color: data.nav_bg_color || DEFAULTS.nav_bg_color,
          site_name:    data.site_name    || DEFAULTS.site_name,
          tagline:      data.tagline      || DEFAULTS.tagline,
        };
        setColors(merged);
        applyVars(merged);
      })
      .catch(() => {}); // DEFAULTS already applied; silently ignore
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme: isDark ? "dark" : "light",
      isDark,
      toggleTheme,
      colors,
      siteName: colors.site_name,
      tagline:  colors.tagline,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
