# Плагин базы знаний Tesla Vita

Подключает Claude Code и Codex к базе знаний компании (https://kb.teslavita.space): MCP-сервер и навыки «спросить базу», «добавить в базу» и «мои файлы и доступ к ним» (показать свои файлы, открыть или закрыть файл коллеге). Вход — рабочим аккаунтом Google через кабинет https://admin.teslavita.space; без входа плагин ничего не открывает. Доступ выдаёт администратор.

## Вопросы коллегам

С 0.6.0 через базу можно спросить коллегу: «спроси Костю, считаем ли от даты оплаты, это по TES-301». Вопрос появляется у адресата в Claude Code при запуске сессии (хук `SessionStart` плагина вызывает `tv-kb inbox --hook`), а с 0.6.1 и посреди открытой сессии: на его следующем сообщении (хук `UserPromptSubmit`, не чаще раза в минуту, только новое) Claude сначала отвечает на сообщение, потом говорит, что пришло. Ещё вопрос виден строкой под ответами базы, а бот @teslavita_team_bot пишет ему в Telegram. Ответ возвращается так же. Чтобы получать сообщения в Telegram, один раз нажмите «Старт» у бота: кабинет → Оргструктура → своя карточка → «Подключить Telegram». В Codex вопросы видны строкой под ответами базы и по просьбе «покажи вопросы мне» (навык `kb-questions`).

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

После установки включите автообновление — так принято в команде: `/plugin` → Marketplaces → teslavita → Enable auto-update (навык `/teslavita-kb:update` включает его сам). Если плагин устарел, база знаний сама скажет об этом в ответе.

Если вход слетел: `~/.config/tv-kb/bin/tv-kb login`, затем Reconnect. Подробно — в навыке `/teslavita-kb:update`.

## Codex

```bash
codex plugin marketplace add Teslavita/kb-plugin
```

В Codex: `/plugins` → установить `teslavita-kb`, начать новую сессию. Если вход не предложен сам: `codex mcp login teslavita-kb`. Codex обновляет плагины сам при каждом запуске; вручную — `codex plugin marketplace upgrade teslavita`.

## Выпуск новой версии

Запустите `scripts/set-version.sh 0.5.3` (своё число): оно меняет версию во всех пяти местах — `version` в `plugins/teslavita-kb/.claude-plugin/plugin.json` и `.codex-plugin/plugin.json`, два заголовка `X-Teslavita-Plugin` в `.mcp.json` и `plugin=` в `bin/kb-headers` — и проверяет, что число везде одно. Без аргумента скрипт только проверяет. База знаний читает версию из `plugin.json` этого репозитория и сравнивает с заголовком, который шлёт установленный плагин: если в каком-то месте число осталось старым, база говорит «вышло обновление» тем, у кого плагин уже свежий.
