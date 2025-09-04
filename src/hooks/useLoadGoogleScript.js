// src/hooks/useLoadGoogleScript.js
import { useEffect, useState } from "react";

export default function useLoadGoogleScript() {
  const [loaded, setLoaded] = useState(!!window.google);

  useEffect(() => {
    if (window.google) { setLoaded(true); return; }
    const el = document.createElement("script");
    el.src = "https://accounts.google.com/gsi/client";
    el.async = true;
    el.defer = true;
    el.onload = () => setLoaded(true);
    el.onerror = () => setLoaded(false);
    document.head.appendChild(el);
    return () => { /* keep script for the app lifetime */ };
  }, []);

  return loaded;
}
