import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "oculta-verificados:settings";

export const DEFAULTS = {
  enabled: true,
  hideBlue: true,
  hideGold: false,
  hideGray: false,
  hideQuoted: false,
  mode: "hide",
  whitelist: [],
};

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings) {
  return AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
