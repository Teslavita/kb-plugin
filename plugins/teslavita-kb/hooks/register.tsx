// Colleagues' questions pop up in Claude Code (Sergey, 29.10.2026): once a minute, whether or not the person writes,
// the mod asks the knowledge base what waits (tv-kb inbox --peek: nothing is marked). Something new: a toast; while
// anything waits: a line above the prompt with «Показать», which opens the texts in place. Only inside Claude Code,
// no notifications of the computer (Sergey's choice). No tv-kb yet, no sign-in or an older tv-kb: nothing is shown.
// Reliably (Sergey, 29.10): another session of the person (a remote one, a project's) being shown something does not
// count. A question stays until answered; an answer of the last days until «Понятно» on this computer.
import { atom, read, update } from 'claude-code'
import type { Engine, Register } from 'claude-code'

import type { Waiting } from '../types'

const EVERY = 60_000
// The test of bin/kb-work, which the hooks run: a path naming TeslaVita or TvtApp, a .teslavita mark, a git
// repository of github.com/Teslavita.
const WORK = `case "$(printf %s "$1" | tr '[:upper:]' '[:lower:]')" in *teslavita* | *tvtapp*) exit 0 ;; esac
[ -e "$1/.teslavita" ] && exit 0
git -C "$1" remote -v 2>/dev/null | grep -qi 'github\\.com[:/]teslavita/'`
const waiting = atom({ plugin: 'teslavita-kb', key: 'waiting' } as const, null)
const atWork = atom({ plugin: 'teslavita-kb', key: 'work' } as const, false)
const opened = atom({ plugin: 'teslavita-kb', key: 'opened' } as const, false)

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + '…')

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
    // Work on Tesla Vita: «Предложить ответ» asks Claude to look for one. Elsewhere the pop-up alone, nothing searched
    // (Sergey, 29.10); the hooks there stay silent.
    let work = false
    try {
      work = (await $.process.run(['sh', '-c', WORK, 'kb-work', e.cwd], { timeoutMs: 5_000 })).exitCode === 0
    } catch {}
    await update($, atWork, () => work)
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
      const any = got.questions.length > 0 || got.answers.length > 0
      await update($, waiting, () => (any ? got : null))
      if (!any) await update($, opened, () => false)
    }

    void look()
    $.clock.every(EVERY, () => look())
    return done
  })


  // «Показать» opens the texts right in the line: no Claude turn, so it works while one runs and in any project.
  // In work on Tesla Vita «Предложить ответ» puts a request for a draft into the prompt box, for the person to send.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, waiting)
    if (e.props.hasSurvey || w === null) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    const work = await read($, atWork)
    const draft = (q: Waiting['questions'][number]) => (
      <Button
        key={`draft-${q.id}`}
        label="Предложить ответ"
        onPress={() =>
          void $.prompt.fill({
            text: `Покажи вопрос №${q.id} от ${q.from} и предложи черновик ответа: поищи в базе знаний и в Linear. Ничего не отправляй, пока я не скажу.`,
          })
        }
      />
    )
    if (await read($, opened)) {
      return (
        <Box flexDirection="column">
          {w.questions.map(q => (
            <Box key={`q-${q.id}`}>
              <Text>
                📩 Вопрос №{q.id} от {q.from}{q.task ? ` (${q.task})` : ''}: «{q.question}» — ответить: «ответь на вопрос №{q.id}: …»{' '}
              </Text>
              {work ? draft(q) : null}
            </Box>
          ))}
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
        {q && work ? draft(q) : null}
        {!q && a ? <Button key={`ok-${a.id}`} label="Понятно" onPress={() => void readHere($, a.id)} /> : null}
      </Box>
    )
  })
}
