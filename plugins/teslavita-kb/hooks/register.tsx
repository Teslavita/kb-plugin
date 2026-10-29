// Colleagues' questions pop up in Claude Code (Sergey, 29.10.2026): once a minute, whether or not the person writes,
// the mod asks the knowledge base what waits (tv-kb inbox --peek: nothing is marked). Something new: a toast; while
// anything waits: a line above the prompt with «Показать», which opens the texts in place. Only inside Claude Code,
// no notifications of the computer (Sergey's choice). No tv-kb yet, no sign-in or an older tv-kb: nothing is shown.
// Reliably (Sergey, 29.10): another session of the person (a remote one, a project's) being shown something does not
// count. A question stays until answered; an answer of the last days until «Понятно» on this computer.
// «Предложить ответ» in any project (Sergey, 29.10): the base writes the draft with the person's access (tv-kb inbox
// --draft), not Claude of this session; «Отправить» sends it (tv-kb inbox --answer), «Изменить» puts it in the prompt box.
import { atom, read, update } from 'claude-code'
import type { Engine, Register } from 'claude-code'

import type { Waiting } from '../types'

const EVERY = 60_000
const waiting = atom({ plugin: 'teslavita-kb', key: 'waiting' } as const, null)
const drafts = atom({ plugin: 'teslavita-kb', key: 'drafts' } as const, {})
const WRITING = '…'
const opened = atom({ plugin: 'teslavita-kb', key: 'opened' } as const, false)

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + '…')

const tvKb = async ($: Engine) => `${await $.env.get('HOME')}/.config/tv-kb/bin/tv-kb`

// The base writes a draft of the answer (up to a few minutes: it searches and reads); shown in the line when ready.
async function proposeAnswer($: Engine, id: number) {
  const key = String(id)
  await update($, drafts, d => ({ ...d, [key]: WRITING }))
  let text = ''
  try {
    const { exitCode, stdout } = await $.process.run([await tvKb($), 'inbox', '--draft', key], { timeoutMs: 240_000 })
    if (exitCode === 0) text = ((JSON.parse(stdout) as { draft?: string }).draft ?? '').trim()
  } catch {}
  await update($, drafts, d => ({ ...d, [key]: text }))
  if (!text) $.ui.toast(`Черновик ответа на вопрос №${id} не получился, попробуйте ещё раз`, { timeoutMs: 10_000 })
}

// «Отправить»: the draft goes as the person's answer; the question leaves the line.
async function sendAnswer($: Engine, id: number, text: string) {
  try {
    const { exitCode } = await $.process.run([await tvKb($), 'inbox', '--answer', String(id)], { stdin: text, timeoutMs: 30_000 })
    if (exitCode !== 0) throw new Error()
  } catch {
    $.ui.toast(`Ответ на вопрос №${id} не ушёл, попробуйте ещё раз`, { timeoutMs: 10_000 })
    return
  }
  $.ui.toast(`Ответ на вопрос №${id} отправлен`, { timeoutMs: 8_000 })
  await update($, waiting, w => {
    if (w === null) return null
    const left = { ...w, questions: w.questions.filter(q => q.id !== id) }
    return left.questions.length || left.answers.length ? left : null
  })
}

// The answer is read on this computer: it is not shown again here.
async function readHere($: Engine, id: number) {
  const gone = ((await $.store.get('gone')) as number[] | undefined) ?? []
  await $.store.set('gone', [...gone.filter(g => g !== id), id].slice(-200))
  await update($, waiting, w => {
    if (w === null) return null
    const left = { ...w, answers: w.answers.filter(a => a.id !== id) }
    return left.questions.length || left.answers.length ? left : null
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Not e.isInteractive: the Claude app runs Claude Code through the SDK, where it is false (0.6.3 showed nothing there).
    const done = await next(e)
    const bin = await tvKb($)

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
      const gone = new Set(((await $.store.get('gone')) as number[] | undefined) ?? [])
      got = { ...got, answers: got.answers.filter(a => !gone.has(a.id)) }
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
      const kept = Object.fromEntries(got.questions.filter(q => q.draft).map(q => [String(q.id), q.draft as string]))
      await update($, drafts, d => ({ ...d, ...kept }))
      const any = got.questions.length > 0 || got.answers.length > 0
      await update($, waiting, () => (any ? got : null))
      if (!any) await update($, opened, () => false)
    }

    void look()
    $.clock.every(EVERY, () => look())
    return done
  })


  // «Показать» opens the texts right in the line: no Claude turn, so it works while one runs and in any project.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, waiting)
    if (e.props.hasSurvey || w === null) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    const ds = await read($, drafts)
    const question = (q: Waiting['questions'][number]) => {
      const d = ds[String(q.id)] ?? ''
      return (
        <Box key={`q-${q.id}`} flexDirection="column">
          <Box>
            <Text>
              📩 Вопрос №{q.id} от {q.from}{q.task ? ` (${q.task})` : ''}: «{q.question}»{' '}
            </Text>
            {d === '' ? <Button key={`draft-${q.id}`} label="Предложить ответ" onPress={() => void proposeAnswer($, q.id)} /> : null}
          </Box>
          {d === WRITING ? <Text>   ✍️ База готовит черновик ответа…</Text> : null}
          {d && d !== WRITING ? (
            <Box flexDirection="column">
              <Text>   ✍️ Черновик: {d}</Text>
              <Box>
                <Button key={`send-${q.id}`} label="Отправить" onPress={() => void sendAnswer($, q.id, d)} />
                <Button
                  key={`edit-${q.id}`}
                  label="Изменить"
                  onPress={() => void $.prompt.fill({ text: `Ответь на вопрос №${q.id} так: ${d}` })}
                />
              </Box>
            </Box>
          ) : null}
        </Box>
      )
    }
    if (await read($, opened)) {
      return (
        <Box flexDirection="column">
          {w.questions.map(question)}
          {w.answers.map(a => (
            <Box key={`a-${a.id}`}>
              <Text>✅ {a.from} ответил(а) на ваш вопрос №{a.id}: «{a.answer}» </Text>
              <Button key={`ok-${a.id}`} label="Понятно" onPress={() => void readHere($, a.id)} />
            </Box>
          ))}
          <Button key="hide" label="Скрыть" onPress={() => void update($, opened, () => false)} />
        </Box>
      )
    }
    const q = w.questions[0]
    const a = w.answers[0]
    const more = w.questions.length + w.answers.length - 1
    const say = (q
      ? `📩 Вопрос №${q.id} от ${q.from}: «${clip(q.question, 60)}»`
      : `✅ ${a.from} ответил(а) на ваш вопрос №${a.id}: «${clip(a.answer, 60)}»`) + (more > 0 ? ` и ещё ${more}` : '')
    return (
      <Box>
        <Text>{say} </Text>
        <Button key="show" label="Показать" onPress={() => void update($, opened, () => true)} />
        {!q && a ? <Button key={`ok-${a.id}`} label="Понятно" onPress={() => void readHere($, a.id)} /> : null}
      </Box>
    )
  })
}
