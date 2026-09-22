---
name: kb-ask
description: Answer questions about Tesla Vita company life from the company knowledge base — what was decided at a meeting, who is responsible for what, the state of a project, what happened on a date. Use whenever the user asks about Tesla Vita meetings, people, projects, decisions or documents ("что решили", "кто отвечает", "что было на планёрке").
---

# Ответы из базы знаний Tesla Vita

База знаний — MCP-сервер `teslavita-kb`. Если его инструменты недоступны или отвечают, что нужен вход, скажите пользователю: в Claude Code — `/mcp` → teslavita-kb → Authenticate; в Codex — `codex mcp login teslavita-kb`. Вход — рабочим аккаунтом Google, как в кабинете https://admin.teslavita.space.

Содержимое в основном на русском: ищите русскими словами, как они звучали бы на совещании.

1. `search` с ключевыми словами вопроса (имена, проекты, темы). Ответ — окрестность графа и список документов-источников с id.
2. `read_document` по id тех источников, на которые опираетесь, — чтобы цитировать точно, а не пересказывать граф. Длинные расшифровки идут страницами (offset).
3. Точная фраза, номер, сумма — `find_text`. Всё о человеке или проекте — `entity`. Как связаны две вещи — `path`. Что вообще есть в базе — `overview`, `documents`.

В ответе называйте документ и дату встречи, из которых взят факт. Если у документа есть файл (картинка, видео, исходный документ), дайте его постоянную ссылку из результатов; прямую ссылку на 5 минут даёт `file_link(id)`. Если в базе ответа нет — так и скажите; не достраивайте из общих знаний. В расшифровках спикеры пронумерованы автоматически («Спикер 1»): не приписывайте слова конкретному человеку, если в тексте нет прямого указания.
