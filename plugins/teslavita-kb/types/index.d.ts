export type Waiting = {
  questions: { id: number; from: string; question: string; task: string; draft?: string }[]
  answers: { id: number; from: string; answer: string }[]
}

declare module 'claude-code' {
  interface PluginState {
    'teslavita-kb': { waiting: Waiting | null; opened: boolean; drafts: Record<string, string> }
  }
}
