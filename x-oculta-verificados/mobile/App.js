import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import SettingsModal from "./src/SettingsModal";
import { buildApplyScript, buildInjectedScript } from "./src/injectedScript";
import { loadSettings, saveSettings } from "./src/settings";

const HOME = "https://x.com/home";
const ALLOWED_HOSTS = [
  "x.com",
  "twitter.com",
  "twimg.com",
  "accounts.google.com",
  "appleid.apple.com",
  "api.arkoselabs.com",
  "client-api.arkoselabs.com",
];

function isAllowed(url) {
  const match = url.match(/^https?:\/\/([^/?#]+)/i);
  if (!match) return true;
  const host = match[1].toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed));
}

export default function App() {
  const webViewRef = useRef(null);
  const [settings, setSettings] = useState(null);
  const [initialSettings, setInitialSettings] = useState(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded);
      setInitialSettings(loaded);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const injectedScript = useMemo(
    () => (initialSettings ? buildInjectedScript(initialSettings) : ""),
    [initialSettings],
  );

  const handleSave = useCallback((next) => {
    setSettings(next);
    saveSettings(next);
    webViewRef.current?.injectJavaScript(buildApplyScript(next));
    setSettingsOpen(false);
  }, []);

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "count") setHiddenCount(message.count);
    } catch {}
  }, []);

  const handleShouldStart = useCallback((request) => {
    if (request.isTopFrame === false || isAllowed(request.url)) return true;
    Linking.openURL(request.url);
    return false;
  }, []);

  if (!settings) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <StatusBar style="auto" />
        <WebView
          ref={webViewRef}
          source={{ uri: HOME }}
          style={styles.flex}
          injectedJavaScriptBeforeContentLoaded={injectedScript}
          injectedJavaScript={injectedScript}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={handleShouldStart}
          onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
          onLoadStart={() => setHiddenCount(0)}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
        />
        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={[styles.fab, !settings.enabled && styles.fabOff]}
          accessibilityLabel="Configurações do Oculta Verificados"
        >
          <Text style={styles.fabText}>{settings.enabled ? `${hiddenCount} ocultos` : "Pausado"}</Text>
        </Pressable>
        <SettingsModal
          visible={settingsOpen}
          settings={settings}
          hiddenCount={hiddenCount}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSave}
          onReload={() => {
            setSettingsOpen(false);
            webViewRef.current?.reload();
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: "absolute",
    left: 16,
    bottom: 80,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1d9bf0",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabOff: { backgroundColor: "#536471" },
  fabText: { color: "#fff", fontWeight: "700" },
});
