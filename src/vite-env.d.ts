/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the Spring Boot API, e.g. "/api" or "http://localhost:8080/api" */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
