---
name: kb-fix
description: Fix a mistake in the Tesla Vita company knowledge base — a wrong fact or wording in a document (also in a meeting transcript or PDF), a wrong title or date, a wrong file or text sent, or a document to delete — and put back what was deleted or replaced (30-day trash). Use when the user says they made a mistake in something sent to the base ("исправь в базе", "я ошибся", "не тот файл", "удали из базы", "верни из корзины").
---

# Исправить ошибку в базе знаний Tesla Vita

Исправлять может тот, кто добавил документ, или суперадмин. Документы из Linear, документации кода и Support Center исправляют в их источнике: база обновится сама.

Сначала найдите документ (`search`, `documents` или `find_text`) и прочитайте нужное место (`read_document`). Покажите пользователю, что именно поменяется, и меняйте только после его «да».

Что выбрать:
- **Неверный факт или формулировка в тексте** (в том числе в расшифровке встречи или PDF) → `fix_text(id, old, new)`. `old` — точные слова из документа, скопированные из `read_document`, такой длины, чтобы они встречались один раз. Файл-оригинал остаётся, а исправленный текст попадает в поиск и граф. Отменить последнюю правку: `undo_text_edit(id)`, список правок: `text_edits(id)`.
- **Неверное название, дата встречи или пояснение** → `edit_document(id, title, meeting_date, note)`.
- **Отправили не тот текст целиком** → `replace_document(id, text)`.
- **Отправили не тот файл** → `upload_link(filename, size_bytes, replace=id)` и выполните команду. Документ сохранит id и доступы, старая версия уйдёт в корзину.
- **Документ не нужен совсем** → `delete_document(id)`. Он сразу пропадёт из поиска и графа, а 30 дней пролежит в корзине.

Корзина: `trash_list()` показывает удалённое и заменённое за 30 дней, `restore_document(n)` возвращает документ по номеру. Если документ с тем же id уже заменён новой версией, при возврате новая версия сама уйдёт в корзину, так что ничего не теряется. Через 30 дней корзина очищается навсегда.

После правки поиск и граф обновляются за несколько минут, `document_status(id)` показывает, когда документ снова в базе.
