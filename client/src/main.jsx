import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import AppPreloader from './components/AppPreloader';
import { setupSessionInterceptor, syncSession } from './utils/sessionManager';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const preloadMs = Number(import.meta.env.VITE_PRELOADER_MS || 2200);

setupSessionInterceptor();

const Root = () => {
  const [loading, setLoading] = React.useState(true);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frameId;
    const duration = Math.max(1200, preloadMs);
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const nextProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(nextProgress);
      if (nextProgress < 100) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    const bootstrap = async () => {
      await syncSession();
      window.setTimeout(() => setLoading(false), duration);
    };

    bootstrap();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <AnimatePresence mode="wait">
          {loading ? (
            <AppPreloader key="preloader" progress={progress} />
          ) : (
            <BrowserRouter key="app">
              <App />
            </BrowserRouter>
          )}
        </AnimatePresence>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
);
