# Плагин базы знаний Tesla Vita

Подключает Claude Code и Codex к базе знаний компании (https://kb.teslavita.space): MCP-сервер и два навыка — «спросить базу» и «добавить в базу». Вход — рабочим аккаунтом Google через кабинет https://admin.teslavita.space; без входа плагин ничего не открывает. Доступ выдаёт администратор.

## Claude Code

```bash
claude plugin marketplace add Teslavita/kb-plugin
claude plugin install teslavita-kb@teslavita
```

Затем в Claude Code: `/mcp` → `teslavita-kb` → Authenticate — откроется браузер.

## Codex

```bash
codex plugin marketplace add Teslavita/kb-plugin
```

В Codex: `/plugins` → установить `teslavita-kb`, начать новую сессию. Если вход не предложен сам: `codex mcp login teslavita-kb`.
