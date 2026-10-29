import { expect, mock, test } from 'claude-code/testing'

const ABOVE = { plugin: 'teslavita-kb', component: 'AbovePrompt', props: { hasSurvey: false } } as const

test('a new question pops up once and stays above the prompt until answered', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME: '/home/p' })
  let inbox = { questions: [{ id: 7, from: 'Сергей Немеш', question: 'Где макет?', task: '' }], answers: [] as unknown[] }
  const ran: string[][] = []
  on('process.run', (_, e) => {
    if (e.argv[0] === 'sh') {
      // kb-work: only the folder of work on Tesla Vita
      return { value: { exitCode: e.argv[4] === '/w/TeslaVita' ? 0 : 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    ran.push([...e.argv])
    return { value: { exitCode: 0, stdout: JSON.stringify(inbox), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const prompts: string[] = []
  on('prompt.submit', (_, e) => {
    prompts.push(e.text)
    return { text: e.text }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/w/TeslaVita', surface: null, isInteractive: false })
  await clock.settle()
  expect(ran[0]).toEqual(['/home/p/.config/tv-kb/bin/tv-kb', 'inbox', '--peek'])
  expect(toasts).toEqual(['📩 Вопрос №7 от Сергей Немеш: «Где макет?»'])

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...ABOVE, surface })
    expect((await ui.find({ type: 'Text', text: /Вопрос №7/ }))?.text).toContain('Где макет?')
    await ui.press({ key: 'show' })
    await ui.unmount()
  }
  expect(prompts[0]).toContain('предложи черновик ответа') // work on Tesla Vita: Claude looks for an answer

  await clock.advance(60_000) // the same question a minute later: no second toast
  expect(ran.length).toBe(2)
  expect(toasts.length).toBe(1)

  inbox = { questions: [], answers: [] } // answered: the line goes
  await clock.advance(60_000)
  let ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()

  // An answer, though another session of the person was shown it: a toast, the line until «Понятно», then never here.
  inbox = { questions: [], answers: [{ id: 4, from: 'Павел', answer: 'У меня 0.6.3' }] }
  await clock.advance(60_000)
  expect(toasts[1]).toBe('✅ Павел ответил(а) на ваш вопрос №4')
  ui = await $.ui.mount({ ...ABOVE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /№4/ }))?.text).toContain('У меня 0.6.3')
  await ui.press({ key: 'ok' })
  await ui.unmount()
  ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
  await clock.advance(60_000)
  ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
  expect(toasts.length).toBe(2)
})

test('in a person own project the pop-up alone: «Показать», nothing searched', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME: '/home/p' })
  on('process.run', (_, e) => {
    const stdout = e.argv[0] === 'sh' ? '' : JSON.stringify({ questions: [{ id: 7, from: 'Ира', question: '?', task: '' }], answers: [] })
    return { value: { exitCode: e.argv[0] === 'sh' ? 1 : 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.toast', () => ({ value: undefined }))
  const prompts: string[] = []
  on('prompt.submit', (_, e) => {
    prompts.push(e.text)
    return { text: e.text }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  await $.session.start({ cwd: '/home/p/own', surface: null, isInteractive: false })
  await clock.settle()
  const ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /Вопрос №7/ }))?.text).toContain('Ира')
  await ui.press({ key: 'show' })
  await ui.unmount()
  expect(prompts).toEqual(['Покажи вопросы мне'])
})
