
export interface Author {
  id: string;
  name: string;
  avatar: string;
  followers: number;
  likes: number;
  description: string;
}

export interface Character {
  id: string;
  authorId: string; // Link to an author
  name: string;
  description: string;
  avatarSeed: string;
  avatar?: string; // Base64 string or custom URL
  systemInstruction: string;
  isCustom?: boolean;
  backgroundImage?: string;
  backgroundImages?: string[]; // Support for multiple backgrounds
  affinityLevel?: number;
  likes?: number;
  chatCount?: number;
  gender?: 'male' | 'female' | 'other';
  isPublished?: boolean; // New field for visibility control
  openingMessage?: string; // First message sent by character
  tags?: string[]; // User defined tags (max 5)
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isMemory?: boolean; // Indicates if this message is a summary of previous context
}

export interface SavedModel {
  id?: string; // OpenRouter ID
  name: string; // e.g., "gemini-2.0-flash"
  displayName: string; // e.g., "Gemini 2.0 Flash"
}

export type ViewState = 'LOGIN' | 'LIST' | 'CHAT' | 'CREATE' | 'AUTHOR' | 'SETTINGS' | 'PROFILE_EDIT' | 'FOLLOWERS_LIST' | 'LIKES_LIST' | 'CHAR_PROFILE';
export type TabState = 'CHARS' | 'AUTHORS' | 'MSGS' | 'ME';

export interface ChatSession {
  characterId: string;
  messages: Message[];
}

export interface DialogConfig {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}