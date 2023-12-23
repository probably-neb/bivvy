/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_IS_LOCAL: string
  readonly VITE_API_URL: string
  readonly VITE_REPLICACHE_LICENSE_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}