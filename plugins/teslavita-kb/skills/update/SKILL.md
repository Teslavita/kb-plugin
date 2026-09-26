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

Чтобы следующие обновления приходили сами, предложите включить автообновление: `/plugin` → Marketplaces → teslavita → Enable auto-update. Это настройка пользователя — меняйте её только с его согласия. Если он согласен и просит сделать за него, добавьте в `~/.claude/settings.json` (не затирая остальное):

```json
"extraKnownMarketplaces": {
  "teslavita": { "source": { "source": "github", "repo": "Teslavita/kb-plugin" }, "autoUpdate": true }
}
```

**Codex** обновляет плагины сам при каждом запуске. Если нужно сейчас: `codex plugin marketplace upgrade teslavita`, затем новая сессия.

## Если вход в базу слетел или инструменты недоступны

С версии 0.3.0 вход держит программа tv-kb (`~/.config/tv-kb/bin/tv-kb`, плагин скачивает её сам): она хранит вход полгода и продлевает его, пока базой пользуются. При первом подключении в браузере открывается вход в кабинет — рабочий аккаунт Google, затем «Разрешить».

1. Проверьте версию: `claude plugin list` — нужен `teslavita-kb` 0.3.0 или новее; если старее — обновите (выше).
2. Кто вошёл: `~/.config/tv-kb/bin/tv-kb whoami`. Если просит войти — `~/.config/tv-kb/bin/tv-kb login` (откроется браузер).
3. После входа переподключите сервер: `/mcp` → teslavita-kb → Reconnect, или начните новую сессию.
4. Не помогло — переустановите плагин:
   ```bash
   claude plugin uninstall teslavita-kb@teslavita && claude plugin marketplace update teslavita && claude plugin install teslavita-kb@teslavita
   ```
   и начните новую сессию.

В Codex вход свой: `codex mcp login teslavita-kb`.

Если tv-kb отвечает, что доступ закрыт, — доступ к базе выдаёт администратор в кабинете https://admin.teslavita.space; обходить это не нужно.
