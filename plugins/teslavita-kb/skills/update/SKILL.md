---
name: update
description: Update the Tesla Vita knowledge base plugin (teslavita-kb) and repair the sign-in to the knowledge base. Use when the user types /teslavita-kb:update or says «обнови плагин Tesla Vita», when a knowledge base answer says the plugin is out of date or an update is available, or when the teslavita-kb tools are missing or keep asking to sign in again.
---

# Обновление плагина Tesla Vita и вход в базу знаний

## Обновить плагин

**Claude Code.** Выполните (меняет только установленный плагин):

```bash
claude plugin marketplace update teslavita && claude plugin update teslavita-kb@teslavita
```

Новая версия начинает работать в новой сессии. Скажите об этом пользователю.

Затем включите автообновление — так принято в команде Tesla Vita, чтобы следующие версии ставились сами. Проверьте `~/.claude/settings.json`: если в `extraKnownMarketplaces.teslavita` нет `"autoUpdate": true` — добавьте его, не затирая остальное; если блока `teslavita` нет — добавьте целиком:

```json
"extraKnownMarketplaces": {
  "teslavita": { "source": { "source": "github", "repo": "Teslavita/kb-plugin" }, "autoUpdate": true }
}
```

Скажите пользователю одной фразой, что автообновление плагина Tesla Vita включено. То же можно сделать руками: `/plugin` → Marketplaces → teslavita → Enable auto-update.

**Codex** обновляет плагины сам при каждом запуске. Если нужно сейчас: `codex plugin marketplace upgrade teslavita`, затем новая сессия.

## Если вход в базу слетел или инструменты недоступны

Вход держит программа tv-kb (`~/.config/tv-kb/bin/tv-kb`, плагин скачивает её сам): она хранит вход полгода и продлевает его, пока базой пользуются. При первом подключении в браузере открывается вход в кабинет — рабочий аккаунт Google, затем «Разрешить».

1. Кто вошёл: `~/.config/tv-kb/bin/tv-kb whoami`. Если просит войти — `~/.config/tv-kb/bin/tv-kb login` (откроется браузер).
2. После входа переподключите сервер: `/mcp` → teslavita-kb → Reconnect, или начните новую сессию.
3. Не помогло — переустановите плагин:
   ```bash
   claude plugin uninstall teslavita-kb@teslavita && claude plugin marketplace update teslavita && claude plugin install teslavita-kb@teslavita
   ```
   и начните новую сессию.

В Codex вход свой: `codex mcp login teslavita-kb`.

Если tv-kb отвечает, что доступ закрыт, — доступ к базе выдаёт администратор в кабинете https://admin.teslavita.space; обходить это не нужно.
