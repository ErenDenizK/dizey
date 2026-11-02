---
name: ledger-capture
description: Use in every turn that receives a message from Eren (directly or relayed) to itemise it into the prompt ledger, give every item an owner and a box, and route it before replying.
---

# Ledger capture

The ledger ("Dizey Prompt Defteri", Turkish) exists so no context is lost and every item turns into something concrete. It is Claude's working list, not a report for Eren. Do this for every prompt without being asked.

## Layout

- **Çalışma listesi** (top): open boxes and the standing rules. Every thread reads only this part before working.
- **P sections** (bottom, appended in order): one section per prompt, `### Pn · date time · topic`, with a table `Kimlik | Madde | Tür | Durum | Nereye dönüştü`. This is the history; search it by ID, never read it whole.

## Steps

1. **Split** the message into atomic items in Eren's words: `Pn.k`, next free n. Items said in another thread use the same numbering. Fix obvious dictation errors; mark a word you are unsure of.
2. **Type**: karar, ilke adayı, iş, soru, bilgi, geri bildirim. Eren's ideas are not specs: record them as ideas and let the owner weigh them.
3. **Link**: search the P sections for earlier items on the subject. If the new item replaces one, say so in "Nereye dönüştü"; on a real contradiction ask Eren which stands.
4. **Box**: every iş, soru and geri bildirim gets a box in the Çalışma listesi: `Pn.k · visible change · owner thread · output (PR, doc, version) · evidence`. Group items that share an owner and output. No box without an owner; when an owner thread ends, its boxes pass to the thread the coordinator names.
5. **Standing rules**: a lasting rule goes under the standing rules with where it is coded (principle, skill, memory). A rule that caps capability is not adopted (`principle-adoption`).
6. **Close**: tick a box only when the output is live and checked the way Eren will check it (phone, 375/390 px, dark, settled frames), with the evidence on the line.
7. **Reply**: lead with results he can try. Don't ask design questions; decide reversible things and show them (PR-13).

## Ownership

One ledger owner (named in project memory `dizey-operating-system`) edits the ledger; when it ends, the coordinator names the next. Other threads send their items to the owner or the coordinator, so the doc has one writer. The ledger once stopped for 22 prompts because its owner thread ended; never leave it ownerless.
