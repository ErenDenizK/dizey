/** Text for the motion and visual system lab (/lab). English keys, Turkish values. */
export const lab = {
  tabsLabel: 'Bölümler',
  tabs: { today: 'Bugün', map: 'Harita', exam: 'Sınav', me: 'Ben' },
  back: 'Geri',
  close: 'Kapat',
  today: {
    continueLabel: 'Kaldığın yerden',
    continueTitle: 'Determinantın özellikleri',
    continueMeta: '3. adım / 8 · yaklaşık 6 dakika',
    continueAction: 'Devam et',
    nextLabel: 'Sıradaki',
    items: [
      { title: 'Satır işlemleri ve determinant', meta: 'D3 · 7 dakika' },
      { title: 'Ek matris ve ters matris', meta: 'D4 · 9 dakika' },
    ],
    stageTitle: 'Determinantın özellikleri',
    stageBody:
      'İki satırı yer değiştirirsen determinantın işareti değişir. Bir satırı k ile çarparsan determinant da k ile çarpılır.',
    stageAction: 'İleri',
    detailBody:
      'Bu ekran sağdan gelir; alttaki ekran biraz sola kayar ve kararır. Sol kenardan sağa kaydırarak geri dönebilirsin.',
  },
  map: {
    groups: [
      { title: 'Matrisler', items: ['Matris işlemleri', 'Özel matrisler', 'Transpoz ve simetri'] },
      { title: 'Determinant', items: ['Determinant tanımı', 'Laplace açılımı', 'Determinantın özellikleri'] },
    ],
    sheetTitle: 'Determinantın özellikleri',
    sheetBody:
      'Sınavda en çok soru çıkan konu. Satır işlemlerinin determinantı nasıl değiştirdiğini bilmen gerekiyor.',
    sheetAction: 'Derse başla',
    sheetHint: 'Tutamacı yukarı çek: sayfa büyür, arkadaki ekran geri çekilir. Aşağı fırlat: kapanır.',
  },
  exam: {
    title: 'Vize 1 provası',
    meta: '18 soru · 5 seçenek · süre isteğe bağlı',
    start: 'Provayı başlat',
    past: 'Geçmiş sınavlar',
    pastItems: ['2024 Yaz okulu', '2023 Güz', '2023 Bahar'],
  },
  me: {
    settings: 'Ayarlar',
    sound: 'Ses',
    dark: 'Koyu görünüm',
    reduce: 'Hareketi azalt',
    springs: 'Yay laboratuvarı',
    type: 'Yazı ve renk',
  },
  springs: {
    title: 'Yaylar',
    intro:
      'Her hareket bu yaylardan birini kullanır. Süre, hareketin bitmiş göründüğü an; sekme, hedefi ne kadar aştığı.',
    play: 'Oynat',
    settle: 'oturma',
    overshoot: 'aşma',
  },
  type: {
    title: 'Yazı ve renk',
    large: 'Büyük başlık',
    title1: 'Başlık 1',
    title2: 'Başlık 2',
    title3: 'Başlık 3',
    body: 'Gövde metni: bir satırı k ile çarparsan determinant da k ile çarpılır.',
    subhead: 'Alt başlık ve ikincil bilgi',
    footnote: 'Dipnot: Il1 0O ayrımı, matris indislerinde karışmasın diye.',
    roles: 'Anlam renkleri',
    ok: 'Doğru',
    bad: 'Hata',
    row: 'Satır',
    col: 'Sütun',
  },
} as const
