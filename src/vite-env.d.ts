/// <reference types="vite/client" />

declare module 'vue' {
  interface ComponentCustomProperties {
    canAction: (code: string) => boolean
  }
}

declare module '*.svg?component' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

