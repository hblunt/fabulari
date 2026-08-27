// client/src/app/core/models/types.ts
// Union types constraining the string fields used across the models
// (Phase1.md §5 "Models"). Unions rather than enums: they exist only at
// compile time, so they add no runtime code and compare as plain strings —
// exactly what the JSON API sends.

export type Role = 'SUPER_ADMIN' | 'USER';

export type RequestType =
  | 'GROUP_CREATE'
  | 'GROUP_DELETE'
  | 'GROUP_JOIN'
  | 'ROOM_CREATE'
  | 'USER_REPORT'
  | 'SYSTEM_BAN';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MessageType = 'TEXT' | 'IMAGE';

// Keys of the preset colour palettes defined in styles.css (§3 assumption 14:
// group themes come from a fixed set). Adding a palette means adding a CSS
// class and extending this list — nothing else changes.
export const GROUP_THEMES = ['slate', 'moss', 'ocean', 'plum', 'ember', 'sand'] as const;

export type GroupTheme = (typeof GROUP_THEMES)[number];

export function themeLabel(theme: string): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}
