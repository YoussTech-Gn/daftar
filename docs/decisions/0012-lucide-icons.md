# Decision 0012 — One icon set: Lucide

**Status:** Accepted · **Date:** 2026-11-21 · **Requested by:** the user ("same package, Lucide, for all icons")

## Decision
- All icons come from **`lucide-react-native`** (with `react-native-svg`, bundled in Expo Go).
- Emojis and text symbols used as icons (⚙️ 📦 🔍 📒 💵 🛒 📇 ↑ ↓ ⌫ ✕ ＋) were removed from screens and translations.
- Icons are imported **only** through `src/components/icons.ts`, which re-exports the Lucide icons the app
  uses and defines standard sizes (`ICON.sm/md/lg/xl`). Adding an icon = add it to that file.
- `Button` has an `icon` prop; the icon follows the text direction (after the label in Arabic).

## Mapping
| Place | Icon |
|---|---|
| Settings (header + button) | `Settings` |
| Products | `Package` |
| Search | `Search` |
| Empty list | `BookOpen` |
| Add customer / quick credit / add product / keypad + | `Plus` |
| Gave credit / received payment / history | `ArrowUp` / `ArrowDown` |
| Money loan / goods | `Banknote` / `ShoppingCart` |
| WhatsApp reminder / call | `MessageCircle` / `Phone` |
| Edit / edit products | `Pencil` |
| Delete customer / product | `Trash2` |
| Keypad backspace / clear | `Delete` / `Eraser` |
| Add note | `StickyNote` |
| Pick from contacts | `ContactRound` |
| PIN set / remove | `LockKeyhole` / `LockKeyholeOpen` |
| CSV / backup / restore | `FileSpreadsheet` / `HardDriveDownload` / `HardDriveUpload` |
