# Плагин базы знаний Tesla Vita

Подключает Claude Code и Codex к базе знаний компании (https://kb.teslavita.space): MCP-сервер и два навыка — «спросить базу» и «добавить в базу». Вход — рабочим аккаунтом Google через кабинет https://admin.teslavita.space; без входа плагин ничего не открывает. Доступ выдаёт администратор.

## Claude Code

```bash
claude plugin marketplace add Teslavita/kb-plugin
claude plugin install teslavita-kb@teslavita
```

При первой сессии плагин сам скачает программу `tv-kb` и откроет в браузере вход в кабинет — рабочий аккаунт Google, затем «Разрешить». После этого переподключите сервер (`/mcp` → `teslavita-kb` → Reconnect) или начните новую сессию. Вход держит `tv-kb`: он живёт полгода и продлевается, пока базой пользуются, — входить каждый день не нужно.

Обновление: `/teslavita-kb:update` или

```bash
claude plugin marketplace update teslavita && claude plugin update teslavita-kb@teslavita
```

Чтобы обновления приходили сами: `/plugin` → Marketplaces → teslavita → Enable auto-update. Если плагин устарел, база знаний сама скажет об этом в ответе.

Если вход слетел: `~/.config/tv-kb/bin/tv-kb login`, затем Reconnect. Подробно — в навыке `/teslavita-kb:update`.

## Codex

```bash
codex plugin marketplace add Teslavita/kb-plugin
```

В Codex: `/plugins` → установить `teslavita-kb`, начать новую сессию. Если вход не предложен сам: `codex mcp login teslavita-kb`. Codex обновляет плагины сам при каждом запуске; вручную — `codex plugin marketplace upgrade teslavita`.

## Выпуск новой версии

Поднимите `version` в `plugins/teslavita-kb/.claude-plugin/plugin.json` и `.codex-plugin/plugin.json`, в заголовках `X-Teslavita-Plugin` в `.mcp.json` и в `plugin=` в `bin/kb-headers` — везде одно число. База знаний читает версию из этого репозитория и предлагает обновиться всем, у кого она старее.
