# Turkish UI writing

Voice: a good teaching assistant at the board. Short, exact, calm, faithful to the lecturer's notation.
Apple's writing guidance applies: match tone to the moment, be action oriented, keep one term per concept
through a flow, give empty screens a next step, make errors say what happened and how to fix it.

## Rules (provisional where noted)

1. Address: "sen" (Eren, 2026-10-30).
2. Buttons say what happens: "Devam et: Satır indirgeme", "Tekrarı başlat". No bare "Tamam", "Başla",
   "Gönder". The same action uses the same word everywhere.
3. Terms are fixed and the lecturer's: |A|, Ek(A), r_A / r_B, rang, aşikar çözüm (lecturer's spelling). English
   term in a small note at first use. "Matris" never becomes "tablo".
4. Feedback is about the task: "Pivot sıfır olamaz; R₂ ile R₃'ü değiştirmeyi dene." No praise of the person, no
   blame.
5. No exclamation marks or emoji; celebration lives in visuals and sound.
6. No AI patterns: "X değil, Y", reflexive triplets, "yolculuk", "derinlemesine", chatbot tone.

## Technical pitfalls

- **Suffix harmony:** suffixes after variables and numbers follow pronunciation (A'nın, B'nin, R₂'ye, 3'ün).
  Never build sentences as variable + fixed suffix. Write each case in full, or use one tested helper that picks
  the suffix from the pronunciation.
- **Apostrophe** before suffixes on variables, numbers and proper names.
- **Case mapping:** set `lang="tr"`; without it "i" uppercases to "I" instead of "İ". Avoid all-caps text.
- **Length:** Turkish labels run longer than English; test tabs and buttons with the longest string.
- **Sorting and search:** `localeCompare(a, b, "tr")`; ı/i and ş/s matter.
- **Where strings live:** `src/content/` (English keys, Turkish values), never inline in components.
