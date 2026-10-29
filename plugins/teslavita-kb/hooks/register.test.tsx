import { expect, mock, test } from 'claude-code/testing'

const ABOVE = { plugin: 'teslavita-kb', component: 'AbovePrompt', props: { hasSurvey: false } } as const

test('a question pops up, the base drafts the answer, «Отправить» sends it; an answer stays until «Понятно»', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME: '/home/p' })
  let inbox = { questions: [{ id: 7, from: 'Сергей Немеш', question: 'Где макет?', task: '' }], answers: [] as unknown[] }
  const ran: string[][] = []
  const stdin: string[] = []
  on('process.run', (_, e) => {
    ran.push([...e.argv])
    if (e.init?.stdin) stdin.push(e.init.stdin)
    const out = e.argv.includes('--draft') ? { draft: 'В артефакте.' } : e.argv.includes('--answer') ? { id: 7 } : inbox
    return { value: { exitCode: 0, stdout: JSON.stringify(out), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const prompts: string[] = []
  on('prompt.fill', (_, e) => {
    prompts.push(e.text)
    return { isFilled: true, text: e.text, cursor: e.text.length }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  // The Claude app starts Claude Code as the SDK does: not interactive, no surface yet.
  await $.session.start({ cwd: '/home/p/own', surface: null, isInteractive: false })
  await clock.settle()
  expect(ran[0]).toEqual(['/home/p/.config/tv-kb/bin/tv-kb', 'inbox', '--peek'])
  expect(toasts).toEqual(['📩 Вопрос №7 от Сергей Немеш: «Где макет?»'])

  let ui = await $.ui.mount({ ...ABOVE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Вопрос №7/ }))?.text).toContain('Где макет?')
  await ui.press({ key: 'show' }) // opens in place: nothing asked of Claude
  await ui.press({ key: 'draft-7' })
  await clock.settle()
  expect(ran.at(-1)).toEqual(['/home/p/.config/tv-kb/bin/tv-kb', 'inbox', '--draft', '7'])
  expect((await ui.find({ type: 'Text', text: /Черновик/ }))?.text).toContain('В артефакте.')
  await ui.press({ key: 'edit-7' })
  expect(prompts).toEqual(['Ответь на вопрос №7 так: В артефакте.'])
  await ui.press({ key: 'send-7' })
  await clock.settle()
  expect(ran.at(-1)).toEqual(['/home/p/.config/tv-kb/bin/tv-kb', 'inbox', '--answer', '7'])
  expect(stdin).toEqual(['В артефакте.'])
  expect(toasts.at(-1)).toBe('Ответ на вопрос №7 отправлен')
  await ui.unmount()

  inbox = { questions: [], answers: [] } // answered: the line goes
  await clock.advance(60_000)
  ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()

  // An answer, though another session of the person was shown it: a toast, the line until «Понятно», then never here.
  inbox = { questions: [], answers: [{ id: 4, from: 'Павел', answer: 'У меня 0.6.3' }] }
  await clock.advance(60_000)
  expect(toasts.at(-1)).toBe('✅ Павел ответил(а) на ваш вопрос №4')
  ui = await $.ui.mount({ ...ABOVE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /№4/ }))?.text).toContain('У меня 0.6.3')
  await ui.press({ key: 'ok-4' })
  await ui.unmount()
  await clock.advance(60_000)
  ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
  expect(toasts.filter(t => t.includes('№4')).length).toBe(1)
})

test('in a cloud session (no tv-kb) the pop-up asks the base through its connector', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME: '/root' })
  on('process.run', () => ({ value: { exitCode: 127, stdout: '', stderr: 'no tv-kb', isStdoutTruncated: false, isStderrTruncated: false } }))
  const calls: string[] = []
  on('mcp.call', (_, e) => {
    calls.push(`${e.server} ${e.tool}`)
    if (e.server !== 'teslavita-kb') throw new Error('no such server')
    const text =
      e.tool === 'pending_for_popup'
        ? JSON.stringify({ questions: [{ id: 9, from: 'Константин Горбов', question: 'Что с бинаром?', task: '' }], answers: [] }) + '\n\nnote'
        : e.tool === 'draft_answer'
          ? 'Готово ядро, в работе стенд.'
          : 'Ответ на вопрос №9 записан'
    return { value: { content: [{ type: 'text', text }], isError: false } }
  })
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  await $.session.start({ cwd: '/home/user/tvt', surface: null, isInteractive: false })
  await clock.settle()
  expect(toasts).toEqual(['📩 Вопрос №9 от Константин Горбов: «Что с бинаром?»'])
  const ui = await $.ui.mount({ ...ABOVE, surface: 'desktop' })
  await ui.press({ key: 'show' })
  await ui.press({ key: 'draft-9' })
  await clock.settle()
  expect((await ui.find({ type: 'Text', text: /Черновик/ }))?.text).toContain('Готово ядро')
  await ui.press({ key: 'send-9' })
  await clock.settle()
  await ui.unmount()
  expect(calls).toEqual(['teslavita-kb pending_for_popup', 'teslavita-kb draft_answer', 'teslavita-kb answer_question'])
  expect(toasts.at(-1)).toBe('Ответ на вопрос №9 отправлен')
})
