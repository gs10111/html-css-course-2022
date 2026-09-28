import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BLUE = "#1d9bf0";

const TOGGLES = [
  { key: "hideBlue", label: "Selo azul (X Premium)", color: BLUE },
  { key: "hideGold", label: "Selo dourado (organizações)", color: "#e2b719" },
  { key: "hideGray", label: "Selo cinza (governo)", color: "#829aab" },
  { key: "hideQuoted", label: "Também ocultar tweets que citam verificados" },
];

const MODES = [
  { value: "hide", label: "Remover" },
  { value: "collapse", label: "Recolher" },
];

export default function SettingsModal({ visible, settings, hiddenCount, onClose, onSave, onReload }) {
  const dark = useColorScheme() === "dark";
  const colors = dark
    ? { bg: "#000", text: "#e7e9ea", muted: "#71767b", border: "#2f3336" }
    : { bg: "#fff", text: "#0f1419", muted: "#536471", border: "#eff3f4" };

  const [draft, setDraft] = useState(settings);
  const [whitelistText, setWhitelistText] = useState("");

  useEffect(() => {
    if (!visible) return;
    setDraft(settings);
    setWhitelistText(settings.whitelist.map((h) => "@" + h).join("\n"));
  }, [visible, settings]);

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    const whitelist = [
      ...new Set(
        whitelistText
          .split(/[\s,]+/)
          .map((h) => h.replace(/^@/, "").toLowerCase())
          .filter(Boolean),
      ),
    ];
    onSave({ ...draft, whitelist });
  };

  const row = [styles.row, { borderColor: colors.border }];
  const text = { color: colors.text };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.link, { color: colors.muted }]}>Cancelar</Text>
          </Pressable>
          <Text style={[styles.title, text]}>Oculta Verificados</Text>
          <Pressable onPress={save} hitSlop={12}>
            <Text style={styles.link}>Salvar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={{ color: colors.muted }}>
            <Text style={styles.count}>{hiddenCount}</Text> tweets ocultos nesta página
          </Text>

          <View style={row}>
            <Text style={[styles.label, text, styles.bold]}>Ativado</Text>
            <Switch value={draft.enabled} onValueChange={(v) => set("enabled", v)} trackColor={{ true: BLUE }} />
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>OCULTAR</Text>
          {TOGGLES.map(({ key, label, color }) => (
            <View key={key} style={row}>
              {color && <View style={[styles.dot, { backgroundColor: color }]} />}
              <Text style={[styles.label, text]}>{label}</Text>
              <Switch value={draft[key]} onValueChange={(v) => set(key, v)} trackColor={{ true: BLUE }} />
            </View>
          ))}

          <Text style={[styles.section, { color: colors.muted }]}>MODO</Text>
          <View style={[styles.segmented, { borderColor: BLUE }]}>
            {MODES.map(({ value, label }) => {
              const active = draft.mode === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => set("mode", value)}
                  style={[styles.segment, active && { backgroundColor: BLUE }]}
                >
                  <Text style={[styles.bold, { color: active ? "#fff" : BLUE }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>EXCEÇÕES (UM @ POR LINHA)</Text>
          <TextInput
            value={whitelistText}
            onChangeText={setWhitelistText}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={"@nasa\n@exemplo"}
            placeholderTextColor={colors.muted}
            style={[styles.input, text, { borderColor: colors.border }]}
          />

          <Pressable onPress={onReload} style={[styles.button, { borderColor: colors.border }]}>
            <Text style={[styles.bold, text]}>Recarregar página</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: "700" },
  link: { fontSize: 16, fontWeight: "700", color: BLUE },
  content: { padding: 16, gap: 4 },
  count: { color: BLUE, fontWeight: "700", fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1, fontSize: 15 },
  bold: { fontWeight: "700" },
  dot: { width: 12, height: 12, borderRadius: 6 },
  section: { marginTop: 20, marginBottom: 4, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  segmented: { flexDirection: "row", borderWidth: 1, borderRadius: 999, overflow: "hidden" },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8 },
  input: { minHeight: 90, padding: 10, borderWidth: 1, borderRadius: 8, textAlignVertical: "top", fontSize: 15 },
  button: { marginTop: 24, alignItems: "center", padding: 12, borderWidth: 1, borderRadius: 999 },
});
