export const tr = {
  tabs: {
    general: "Genel",
    appearance: "Görünüm",
    playback: "Oynatma",
    integrations: "Entegrasyonlar",
    shortcuts: "Kısayollar",
    about: "Hakkında"
  },
  restart: {
    bannerMessage: "Değişikliklerin uygulanması için uygulamayı yeniden başlatın",
    button: "Yeniden Başlat",
    restartForUpdate: "Güncellemek için Yeniden Başlat"
  },
  general: {
    language: "Uygulama Dili (Language)",
    languageDesc: "Uygulama arayüzünde kullanılacak dili belirler",
    hideToTrayOnClose: "Kapatıldığında sistem tepsisine küçült",
    hideToTrayOnCloseDesc: "Pencere kapatıldığında uygulamayı sonlandırmak yerine sağ alt sistem tepsisine (Tray) simge durumunda küçültür",
    showNotificationOnSongChange: "Şarkı değiştiğinde bildirim göster",
    showNotificationOnSongChangeDesc: "Yeni bir şarkıya geçildiğinde ekranın sağ alt köşesinde şarkı adı ve albüm görselini içeren bildirim gösterir",
    startOnBoot: "Uygulamayı bilgisayar açılışında başlat",
    startOnBootDesc: "Bilgisayarınız her açıldığında Enix Music'in otomatik olarak arka planda başlamasını sağlar",
    adblockerEnabled: "Reklam Engelleyici (Adblocker)",
    adblockerEnabledDesc: "YouTube Music üzerindeki görsel ve sesli reklamları otomatik olarak engeller",
    disableHardwareAcceleration: "Donanım hızlandırmasını devre dışı bırak",
    disableHardwareAccelerationDesc: "Ekran kartı kullanımı yerine işlemci üzerinden grafik işleme yapar. Eski sistemlerdeki donma/siyah ekran sorunlarını çözer"
  },
  appearance: {
    alwaysShowVolumeSlider: "Ses çubuğunu her zaman göster",
    alwaysShowVolumeSliderDesc: "Sağ alt kısımdaki ses kontrol çubuğunun fareyle üzerine gelmeden de sürekli görünür kalmasını sağlar",
    customCSSEnabled: "Özel CSS kullan",
    customCSSEnabledDesc: "Kendi hazırladığınız veya indirdiğiniz özel CSS teması ile uygulamanın görünümünü özelleştirmenizi sağlar",
    customCSSPath: "Özel CSS dosya yolu",
    customCSSPathDesc: "Uygulanmasını istediğiniz .css uzantılı tema dosyasını bilgisayarınızdan seçin",
    zoom: "Yakınlaştırma (Zoom)",
    zoomDesc: "Uygulama arayüz metinlerinin ve boyutlarının ekrandaki yakınlaştırma oranını belirler",
    trayIconStyle: "Tepsi ikonu stili",
    trayIconStyleDesc: "Sistem tepsisinde gösterilen Enix Music simgesinin renk temasını belirler",
    trayStyles: {
      auto: "Otomatik",
      white: "Beyaz",
      black: "Siyah"
    }
  },
  playback: {
    continueWhereYouLeftOff: "Kaldığın yerden devam et",
    continueWhereYouLeftOffDesc: "Uygulama yeniden açıldığında en son dinlediğiniz şarkıyı ve kalınan saniyeyi otomatik geri yükler",
    continueWhereYouLeftOffPaused: "Uygulama açılışında duraklat",
    continueWhereYouLeftOffPausedDesc: "Son kalınan şarkıyı geri yüklerken uygulamanın açılışta otomatik çalması yerine duraklatılmış olarak başlamasını sağlar",
    progressInTaskbar: "Görev çubuğunda oynatma ilerlemesini göster",
    progressInTaskbarDesc: "Windows Görev Çubuğundaki simgenin arka planında şarkının çalma ilerleme çubuğunu canlı gösterir",
    enableSpeakerFill: "Çok Kanallı Ses (5.1 / 7.1 Hoparlör Doldurma)",
    enableSpeakerFillDesc: "Stereo müzikleri 5.1 veya 7.1 gibi çok kanallı ses sistemlerindeki tüm hoparlörlere yayarak çevreleyen (Surround) ses sağlar",
    ratioVolume: "Hassas Desibel Ses Kontrolü (Logaritmik Ses)",
    ratioVolumeDesc: "Ses seviye çubuğunun insan kulağının duyumuna (Desibel ölçeğine) göre daha orantılı ve pürüzsüz artmasını sağlar",
    autoConfirmKeepPlaying: "Oynatmaya devam et uyarısını otomatik geç",
    autoConfirmKeepPlayingDesc: "YouTube'un uzun süreli dinlemelerde 'Oynatmaya devam edilsin mi?' uyarısı çıkarıp müziği durdurmasını engeller"
  },
  integrations: {
    companionServer: "Eşlik eden sunucu (Companion server / Mobil Uzaktan Kumanda)",
    companionServerDesc: "Mobil cihazlardan (telefon/tablet) müziği uzaktan duraklatıp değiştirebilmeniz için yerel ağ sunucusunu başlatır",
    safeStorageDisabledMessage: "safeStorage kullanılamadığından bu entegrasyon etkinleştirilemiyor",
    corsWildcard: "Tarayıcı iletişimine izin ver",
    corsWildcardDesc: "Bu ayar, ziyaret ettiğiniz herhangi bir web sitesinin sunucuyla iletişim kurmasına izin verdiği için tehlikeli olabilir",
    authWindow: "Eşlik eden yetkilendirmeyi etkinleştir",
    authWindowDesc: "İlk başarılı yetkilendirmeden sonra veya 5 dakika geçtiğinde otomatik olarak devre dışı kalır",
    authorizedCompanions: "Yetkili sunucular",
    authorizedCompanionsDesc: "Şu anda eşlik eden sunucuya erişimi olanların listesi",
    tableHeaderName: "İsim",
    tableHeaderVersion: "Versiyon",
    noAuthorizedCompanions: "Yetkili sunucu yok",
    discordPresence: "Discord oyun etkinliği (Rich Presence)",
    discordPresenceDesc: "Oynatılan şarkı adı, sanatçı ve kapak görselini Discord profilinizde canlı olarak sergiler",
    discordFailure: "Discord uygulaması açık değil veya erişilemiyor",
    reconnect: "Yeniden Bağlan"
  },
  shortcuts: {
    registerErrorTitle: "Kısayol kaydedilemedi. Başka bir uygulama bu kısayolu kullanıyor olabilir.",
    playPause: "Oynat/Duraklat",
    next: "Sonraki",
    previous: "Önceki",
    thumbsUp: "Beğen (Thumbs Up)",
    thumbsDown: "Beğenme (Thumbs Down)",
    volumeUp: "Sesi Arttır",
    volumeDown: "Sesi Azalt"
  },
  about: {
    developedBy: "Enix Yazılım Tarafından Geliştirildi",
    checkForUpdates: "Güncellemeleri Kontrol Et",
    checkingForUpdates: "Güncellemeler kontrol ediliyor...",
    downloadingUpdate: "Güncelleme indiriliyor...",
    noUpdateFound: "Güncelleme bulunamadı",
    autoUpdatesDisabled: "Bu kurulumda otomatik güncellemeler devre dışı"
  },
  tray: {
    showHide: "Pencereyi Göster/Gizle",
    playPause: "Oynat/Duraklat",
    previous: "Önceki",
    next: "Sonraki",
    settings: "Ayarlar",
    quit: "Çıkış"
  },
  authWindow: {
    title: "Cihaz Yetkilendirme İsteği",
    subtitle: "{appName}, Enix Music uygulamasını kontrol etmek istiyor",
    codeConfirm: "Lütfen aşağıdaki kodun {appName} üzerinde gösterilenle eşleştiğinden emin olun",
    deny: "Reddet",
    allow: "İzin Ver"
  },
  loading: {
    checkingForUpdates: "Güncellemeler kontrol ediliyor...",
    downloadingUpdate: "Güncelleme indiriliyor...",
    starting: "Başlatılıyor...",
    loadingApp: "Enix Music Yükleniyor...",
    loaded: "Enix Music Yüklendi",
    loadFailed: "Enix Music Yüklenemedi",
    started: "Başlatıldı",
    timeout: "Enix Music normalden uzun sürede yükleniyor..."
  }
};
