export type Waiting = {
  questions: { id: number; from: string; question: string; task: string }[]
  answers: { id: number; from: string; answer: string }[]
}

declare module 'claude-code' {
  interface PluginState {
    'teslavita-kb': { waiting: Waiting | null; work: boolean }
  }
}
