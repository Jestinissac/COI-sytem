/// <reference types="vite/client" />

// Vue SFC module shim
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
