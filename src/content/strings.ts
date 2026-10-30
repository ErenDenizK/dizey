/** App UI text. English keys, Turkish values; lesson content lives in its own files. */
export const strings = {
  appName: 'Dizey',
  version: 'Sürüm',
  preview: 'Önizleme',
  updateReady: 'Yeni sürüm hazır.',
  updateAction: 'Yenile',
  notFound: 'Bu sayfa yok.',
  goHome: 'Ana sayfaya dön',
  loading: 'Dersler yükleniyor…',

  tabs: { today: 'Bugün', map: 'Harita', me: 'Ben', label: 'Bölümler' },

  today: {
    title: 'Bugün',
    examLine: (days: number, date: string) =>
      days > 0 ? `Vize 1'e ${days} gün · ${date}` : `Vize 1 · ${date}`,
    continueLabel: 'Kaldığın yer',
    startLabel: 'Sıradaki ders',
    stepCount: (step: number, total: number) => `${step} / ${total} adım`,
    lessonSteps: (total: number) => `${total} adım`,
    next: 'Sonra',
    allDone: 'Hazır derslerin hepsini bitirdin. Yeni dersler geldikçe burada görünür.',
    continueAction: (name: string) => `Devam et: ${name}`,
    startAction: (name: string) => `Başla: ${name}`,
  },

  map: {
    title: 'Harita',
    subtitle: 'Vize 1 dersleri. Her birine istediğin zaman girebilirsin.',
    unitProgress: (done: number, total: number) => `${done} / ${total} tamam`,
    state: { new: 'başlanmadı', current: 'kaldığın yer', done: 'tamamlandı', soon: 'yakında' },
  },

  sheet: {
    status: 'Durum',
    length: 'Uzunluk',
    resumeAt: (step: number, total: number) => `kaldığın yer, ${step} / ${total} adım`,
    enter: (name: string) => `Derse gir: ${name}`,
    resume: (name: string) => `Devam et: ${name}`,
    review: (name: string) => `Tekrar et: ${name}`,
    close: 'Kapat',
  },

  me: {
    title: 'Ben',
    subtitle: 'İlerlemen, yedeğin ve ayarlar.',
    statDone: 'tamamlandı',
    statOpen: 'devam ediyor',
    statNew: 'başlanmadı',
    examTitle: 'Sınav provası',
    examSoonTitle: 'Yakında',
    examSoonBody:
      'Gerçek Vize 1 biçiminde süreli deneme: çoktan seçmeli, 5 seçenek. Soru bankası hazırlanıyor.',
    settings: 'Ayarlar',
    sound: 'Ses',
    soundHint: 'Ders, cevap ve mühür sesleri. Telefon sessizdeyken çalmaz.',
    appearance: 'Görünüm',
    appearanceHint: 'Açık ve koyu, iPhone ayarına göre',
    appearanceValue: 'Sistem',
    backup: 'Yedek al',
    backupHint: 'İlerlemen sadece bu telefonda. Yedek dosyası onu korur.',
    restore: 'Yedekten geri yükle',
    restoreHint: 'Yeni telefonda ya da veri silinince',
    restoreConfirm: (count: number, date: string) =>
      `${date} tarihli yedek (${count} kayıt) bu telefondaki ilerlemenin yerine geçecek.`,
    restoreAction: 'Geri yükle',
    cancel: 'Vazgeç',
    restoreInvalid: 'Bu dosya bir Dizey yedeği değil.',
    backupFileName: (date: string) => `dizey-yedek-${date}.json`,
  },

  onboarding: {
    title: "Dizey'i ana ekrana ekle",
    body: "İlerlemen ana ekrandaki Dizey'de tutulur. iPhone, Safari'deki ve ana ekrandaki uygulamanın verisini ayrı saklar; Safari'de başlarsan ilerlemen oraya taşınmaz. Bu yüzden en başta ekle.",
    step1: 'Alttaki Paylaş düğmesine dokun',
    step2: "Ana Ekrana Ekle'yi seç",
    step3: 'Ana ekrandaki Dizey simgesinden aç',
    skip: "Şimdilik Safari'de dene",
  },
} as const
