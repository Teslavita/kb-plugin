import { expect, mock, test } from 'claude-code/testing'

const ABOVE = { plugin: 'teslavita-kb', component: 'AbovePrompt', props: { hasSurvey: false } } as const

test('a new question pops up once and stays above the prompt until answered', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME: '/home/p' })
  let inbox = { questions: [{ id: 7, from: 'Сергей Немеш', question: 'Где макет?', task: '' }], answers: [] as unknown[] }
  const ran: string[][] = []
  on('process.run', (_, e) => {
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

  await $.session.start({ cwd: '/', surface: null, isInteractive: false })
  await clock.settle()
  expect(ran[0]).toEqual(['/home/p/.config/tv-kb/bin/tv-kb', 'inbox', '--peek'])
  expect(toasts).toEqual(['📩 Вопрос №7 от Сергей Немеш: «Где макет?»'])

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...ABOVE, surface })
    expect((await ui.find({ type: 'Text', text: /Вопрос №7/ }))?.text).toContain('Где макет?')
    await ui.press({ key: 'show' })
    await ui.unmount()
  }
  expect(prompts[0]).toBe('Покажи вопросы мне')

  await clock.advance(60_000) // the same question a minute later: no second toast
  expect(ran.length).toBe(2)
  expect(toasts.length).toBe(1)

  inbox = { questions: [], answers: [] } // answered: the line goes
  await clock.advance(60_000)
  const ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})
