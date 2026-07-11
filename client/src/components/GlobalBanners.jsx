import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Cookie, Check, Settings2, Info } from 'lucide-react';

const GlobalBanners = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Cookie Preferences State
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check Cookies
    const savedConsent = localStorage.getItem('cookieConsent');
    if (!savedConsent) {
      setTimeout(() => setShowCookies(true), 1500);
    } else {
        try {
            const parsed = JSON.parse(savedConsent);
            if(parsed.analytics === false || parsed.marketing === false) {
                clearNonEssentialCookies();
            }
        } catch (e) {}
    }

    // Check PWA Install
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const installDismissed = localStorage.getItem('installDismissed');
      if (!installDismissed && !window.matchMedia('(display-mode: standalone)').matches) {
        setTimeout(() => setShowInstall(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const dismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem('installDismissed', 'true');
  };

  const clearNonEssentialCookies = () => {
      // Actively clear common tracking cookies in real-time
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Keep essential JWT/Auth cookies, delete _ga, _gid, fbp etc
          if (name !== 'token' && name !== 'session') {
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          }
      }
  };

  const saveCookieConsent = (newPreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(newPreferences));
    
    // If rejected analytics/marketing, enforce it in real-time
    if (!newPreferences.analytics || !newPreferences.marketing) {
        clearNonEssentialCookies();
    }
    
    setShowCookies(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
      saveCookieConsent({ essential: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
      saveCookieConsent({ essential: true, analytics: false, marketing: false });
  };

  const handleSaveSettings = () => {
      saveCookieConsent(preferences);
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-[100] flex flex-col items-center gap-4 px-4 pointer-events-none">
      <AnimatePresence>
        {/* Install App Banner */}
        {showInstall && !showCookies && !showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-md bg-slate-900 border border-blue-500/30 shadow-2xl shadow-blue-900/20 rounded-2xl p-4 flex items-center justify-between gap-4 pointer-events-auto backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <img src="/logo2.png" alt="Logo" className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-200" onError={(e) => { e.target.src = '/logo.png'; }} />
              <div>
                <h4 className="text-white font-bold text-sm">Install CampusMind AI</h4>
                <p className="text-slate-400 text-xs mt-0.5">Get the official desktop app</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <Download size={16} /> Install
              </button>
              <button onClick={dismissInstall} className="text-slate-400 hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Cookie Banner */}
        {showCookies && !showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-6 pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Cookie className="text-blue-600 dark:text-blue-400" size={24} />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">We Value Your Privacy</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-3xl">
                  We use strictly necessary cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience, analyze website traffic, and assist in our marketing efforts. By clicking "Accept All", you agree to our website's cookie use as described in our Privacy Policy.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
                  >
                    <Check size={16} /> Accept All
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <Settings2 size={16} /> Cookies Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Detailed Cookie Settings Modal */}
        {showSettings && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto"
            >
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings2 className="text-blue-600" /> Cookie Preferences
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Essential */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                Strictly Necessary Cookies <Info size={14} className="text-slate-400" />
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                These cookies are essential for the website to function securely and cannot be switched off in our systems (e.g., authentication tokens, security layers).
                            </p>
                        </div>
                        <div className="shrink-0 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                            Always Active
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />

                    {/* Analytics */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">Performance & Analytics Cookies</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Allow us to count visits and traffic sources so we can measure and improve the performance of our site. All information these cookies collect is aggregated and therefore anonymous.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={preferences.analytics}
                                onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />

                    {/* Marketing */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">Targeting & Marketing Cookies</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                These cookies may be set through our site by our advertising partners. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={preferences.marketing}
                                onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button
                        onClick={handleAcceptAll}
                        className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 text-sm font-semibold transition-colors"
                    >
                        Accept All
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-md"
                    >
                        Save Preferences
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalBanners;
