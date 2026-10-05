/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_GMAIL_DISPATCH?: string;
  readonly VITE_GMAIL_CLIENT_ID?: string;
  readonly VITE_GMAIL_CLIENT_SECRET?: string;
  readonly VITE_GMAIL_REFRESH_TOKEN?: string;
  readonly VITE_GMAIL_SENDER_EMAIL?: string;
  readonly VITE_GMAIL_RECIPIENT_OVERRIDE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module 'clsx' {
  export type ClassValue = ClassArray | ClassDictionary | string | number | null | boolean | undefined;
  export type ClassDictionary = Record<string, any>;
  export type ClassArray = ClassValue[];
  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}

