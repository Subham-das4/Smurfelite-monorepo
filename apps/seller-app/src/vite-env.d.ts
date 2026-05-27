/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXPRESS_SERVER_API: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_PERSIST_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
