/// <reference types="vite/client" />

declare module '*?inline' {
  const content: string;
  export default content;
}

declare const __APP_VERSION__: string;
