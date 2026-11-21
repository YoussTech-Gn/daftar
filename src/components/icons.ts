/**
 * Every icon in the app comes from one package: lucide-react-native (decision 0012).
 * Import icons from here, never emojis or text symbols, so the look stays consistent.
 */
export {
  ArrowDown,
  ArrowUp,
  Banknote,
  BookOpen,
  ContactRound,
  Delete,
  Eraser,
  FileSpreadsheet,
  HardDriveDownload,
  HardDriveUpload,
  LockKeyhole,
  LockKeyholeOpen,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  StickyNote,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react-native';

/** Default icon sizes, kept in one place. */
export const ICON = { sm: 16, md: 20, lg: 24, xl: 44 } as const;
