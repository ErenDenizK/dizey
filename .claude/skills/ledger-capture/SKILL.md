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
7. **Track.** Always, without being asked (Eren 11-01 12:47: "the system is for you, not for me"): every iş, soru and geri bildirim item becomes an unchecked box in the ledger's "Çalışma listesi" section: `P.n · visible change · owner thread · output (PR, doc, version) · evidence`. No box without an owner; when an owner thread ends, its boxes pass to the thread the coordinator names. A box is ticked only when the output is live and checked the way Eren will check it, with the evidence written on the line. Lasting rules go to the "Sürekli kurallar" table with where they are coded. Threads read this list before working. For a large multi-topic message, a separate sentence-level tracker (a Claude Doc in Turkish) may extend it: one row per item with Eren's own words, the visible change he will see, one owner, status and evidence. Read his words literally; if a thread's specialty suggests another reading (e.g. "font" as consistency when he said things look small), the visible complaint wins. An item closes only when it is live and checked the way he will check it (PR-06).
8. **Reply.** Lead with results he can try. Do not ask design questions; decide reversible choices and show them (PR-13). Ask only for facts, accounts, spend or irreversible steps, at most three, each with a recommendation.

## Unanswered questions

A question Eren did not answer stays open on the board and is asked again at the next natural moment (his next message or a plan step boundary). After three unanswered asks on a reversible matter, proceed with the recommended option and say so.

## Ownership

Only the ledger owner (the thread named in project memory `dizey-operating-system`) edits the ledger and the board; when the owner thread ends, ownership passes to the next thread the coordinator names, so the ledger never stops. The ledger stopped at P11 on 10-31 because its owner thread had finished; 22 prompts were backfilled on 11-01. Other threads send it their items (message the thread or the coordinator); they do not edit those docs, to avoid write conflicts.
