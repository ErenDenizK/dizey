---
name: ledger-capture
description: Use in every turn that receives a message from Eren (directly or relayed) to itemise it into the prompt ledger, link it to earlier items, and route each item before replying.
---

# Ledger capture

Eren dictates long, multi-topic messages. Nothing he says may be lost, and nothing may silently override an earlier instruction.

## Steps

1. **Split.** Break the message into atomic items, one idea each. ID: `P<prompt>.<item>` (next prompt number from the ledger's "Promptlar" table). Items said in another thread keep the same numbering; the ledger is global.
2. **Fix dictation.** Correct obvious speech-to-text errors when writing the item (e.g. "PVA" → PWA, "dize" → Dizey). If a word could mean two things, ask Eren; do not guess.
3. **Type.** One of: karar (decision), ilke adayı (principle candidate), iş (task), soru (question), bilgi (information), geri bildirim (feedback).
4. **Link.** Search the ledger for earlier items on the same subject. If the new item changes, narrows or contradicts one, fill "Yerine geçen" on the old row. On a contradiction, do not pick silently: ask Eren which one stands.
5. **Route.**
   - karar → board "Kararlar"
   - ilke adayı → `.claude/skills/principle-adoption` (never straight into `docs/principles.md`)
   - iş → the matching plan step on the board; if none fits, leave it in the inbox as "planda bekliyor"
   - soru → answer it, or add it to the board's open questions
   - bilgi → the relevant memory file or research note
   - geri bildirim → fix the output it refers to, and add a row to `docs/lessons.md` if it reveals a root cause
6. **Write.** Add the rows to the ledger's "Gelen kutusu" table in the same turn. Columns: Kimlik, Madde, Tür, Durum, Nereye dönüştü, Yerine geçen. Ledger text is Turkish.
7. **Reply.** Lead with results; ask only what Eren must decide, at most three questions, each with a recommendation.

## Unanswered questions

A question Eren did not answer stays open on the board and is asked again at the next natural moment (his next message or a plan step boundary). After three unanswered asks on a reversible matter, proceed with the recommended option and say so.

## Ownership

Only the system thread edits the ledger and the board. Other threads send it their items (message the thread or the coordinator); they do not edit those docs, to avoid write conflicts.
