const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

exports.default = async function(context) {
  // Yalnızca Windows platformu için çalıştır
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const appOutDir = context.appOutDir;
  const packager = context.packager;
  const appName = packager.appInfo.productName;
  const exePath = path.join(appOutDir, `${appName}.exe`);

  if (!fs.existsSync(exePath)) {
    console.warn(`[afterSign] Executable not found at: ${exePath}`);
    return;
  }

  console.log(`[afterSign] Modifying PE resources of ${appName}.exe to change metadata language to Turkish (1055)...`);

  try {
    const data = fs.readFileSync(exePath);
    const exe = ResEdit.NtExecutable.from(data, { ignoreCert: true });
    const res = ResEdit.NtExecutableResource.from(exe);

    const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
    if (viList.length === 0) {
      console.warn('[afterSign] No VersionInfo resource found in executable.');
      return;
    }

    const vi = viList[0];

    // Kaynak dilini Türkçe yap
    vi.lang = 1055;

    // Electron-builder tarafından yazılmış olan stringleri çekelim
    const availableLangs = vi.getAllLanguagesForStringValues();
    let correctStrings = {};

    console.log('[afterSign] Available languages in VersionInfo before modification:', availableLangs);

    for (const langInfo of availableLangs) {
      const strings = vi.getStringValues(langInfo);
      console.log(`[afterSign] Found strings for lang ${langInfo.lang}:`, strings);
      correctStrings = { ...correctStrings, ...strings };
      // Eski dildeki stringleri silelim
      vi.removeAllStringValues(langInfo, true);
    }

    // Eğer hiçbir string okunmadıysa varsayılanları koyalım
    if (Object.keys(correctStrings).length === 0) {
      correctStrings = {
        FileDescription: appName,
        ProductName: appName,
        FileVersion: packager.appInfo.version,
        ProductVersion: packager.appInfo.version,
        OriginalFilename: `${appName}.exe`,
        CompanyName: packager.appInfo.companyName || 'Enix',
        LegalCopyright: `Copyright © 2026 ${packager.appInfo.companyName || 'Enix Yazılım 2026'}`
      };
    } else {
      // Eğer değerler hala varsayılan Electron değerleriyse bunları güncelleyelim
      if (correctStrings.FileDescription === 'Electron') {
        correctStrings.FileDescription = appName;
      }
      if (correctStrings.ProductName === 'Electron') {
        correctStrings.ProductName = appName;
      }
      if (correctStrings.CompanyName === 'GitHub, Inc.') {
        correctStrings.CompanyName = packager.appInfo.companyName || 'Enix Yazılım 2026';
      }
      if (correctStrings.LegalCopyright && correctStrings.LegalCopyright.includes('GitHub, Inc.')) {
        correctStrings.LegalCopyright = `Copyright © 2026 ${packager.appInfo.companyName || 'Enix Yazılım 2026'}`;
      }
      if (correctStrings.InternalName === 'electron.exe') {
        correctStrings.InternalName = `${appName}.exe`;
      }
      if (correctStrings.OriginalFilename === 'electron.exe') {
        correctStrings.OriginalFilename = `${appName}.exe`;
      }
    }

    const turkishLang = { lang: 1055, codepage: 1200 };

    // Stringleri Türkçe dili (1055) altında set edelim
    vi.setStringValues(turkishLang, correctStrings);

    // VarFileInfo altındaki desteklenen dilleri Türkçe olarak güncelleyelim
    vi.replaceAvailableLanguages([turkishLang]);

    // Resource entry listesini güncelle
    vi.outputToResourceEntries(res.entries);
    res.outputResource(exe);

    // Yeni binary verisini oluştur ve dosyaya yaz (EBUSY / kilit hatalarına karşı retry mekanizması ile)
    const newBinary = exe.generate();
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const writeWithRetry = async (filePath, content, retries = 10, delay = 500) => {
      for (let i = 0; i < retries; i++) {
        try {
          fs.writeFileSync(filePath, content);
          return;
        } catch (e) {
          if ((e.code === 'EBUSY' || e.code === 'EACCES') && i < retries - 1) {
            console.log(`[afterSign] Dosya meşgul, ${delay}ms sonra tekrar deneniyor... (${i + 1}/${retries})`);
            await sleep(delay);
          } else {
            throw e;
          }
        }
      }
    };

    await writeWithRetry(exePath, Buffer.from(newBinary));

    console.log(`[afterSign] Successfully updated ${appName}.exe PE language to Turkish (1055).`);
  } catch (err) {
    console.error('[afterSign] Error modifying PE resources:', err);
  }
};
