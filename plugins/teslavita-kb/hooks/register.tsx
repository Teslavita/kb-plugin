// Colleagues' questions pop up in Claude Code (Sergey, 29.10.2026): once a minute, whether or not the person writes,
// the mod asks the knowledge base what waits (tv-kb inbox --peek: nothing is marked). Something new: a toast; while
// anything waits: a line above the prompt with «Показать», which asks Claude to show it. Only inside Claude Code,
// no notifications of the computer (Sergey's choice). No tv-kb yet, no sign-in or an older tv-kb: nothing is shown.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Waiting } from '../types'

const EVERY = 60_000
const waiting = atom({ plugin: 'teslavita-kb', key: 'waiting' } as const, null)

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + '…')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const done = await next(e)
    if (!e.isInteractive) {
      return done
    }
    const home = await $.env.get('HOME')
    const bin = `${home}/.config/tv-kb/bin/tv-kb`

    const look = async () => {
      let got: Waiting
      try {
        const { exitCode, stdout } = await $.process.run([bin, 'inbox', '--peek'], { timeoutMs: 10_000 })
        if (exitCode !== 0) {
          return
        }
        got = JSON.parse(stdout) as Waiting
      } catch {
        return
      }
      const told = new Set(((await $.store.get('told')) as string[] | undefined) ?? [])
      const fresh = [
        ...got.questions.filter(q => !told.has(`q${q.id}`)).map(q => `📩 Вопрос №${q.id} от ${q.from}: «${clip(q.question, 80)}»`),
        ...got.answers.filter(a => !told.has(`a${a.id}`)).map(a => `✅ ${a.from} ответил(а) на ваш вопрос №${a.id}`),
      ]
      if (fresh.length) {
        $.ui.toast(fresh.length === 1 ? fresh[0] : `${fresh[0]} и ещё ${fresh.length - 1}`, { timeoutMs: 15_000 })
        const keep = [...got.questions.map(q => `q${q.id}`), ...got.answers.map(a => `a${a.id}`)]
        await $.store.set('told', [...new Set([...told].filter(k => keep.includes(k)).concat(keep))])
      }
      await update($, waiting, () => (got.questions.length || got.answers.length ? got : null))
    }

    void look()
    $.clock.every(EVERY, () => look())
    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, waiting)
    if (e.props.hasSurvey || w === null) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    const q = w.questions[0]
    const say = q
      ? `📩 Вопрос №${q.id} от ${q.from}: «${clip(q.question, 60)}»` +
        (w.questions.length > 1 ? ` и ещё ${w.questions.length - 1}` : '')
      : `✅ Пришли ответы на ваши вопросы: ${w.answers.length}`
    return (
      <Box>
        <Text>{say} </Text>
        <Button
          key="show"
          label="Показать"
          onPress={() => {
            void $.prompt.submit({ text: 'Покажи вопросы мне' })
          }}
        />
      </Box>
    )
  })
}
