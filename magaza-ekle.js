const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const SHOP_DIR = __dirname;
const MODS_DIR = path.join(SHOP_DIR, 'mods');
const INDEX_PATH = path.join(SHOP_DIR, 'index.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

function cleanPath(input) {
  return input.replace(/^["']|["']$/g, '').trim();
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('\n========================================');
  console.log('   SKYNIX MAGZA - YENİ MOD EKLEME   ');
  console.log('========================================\n');

  try {
    // 1. Mod Dosyası
    let modPathRaw = await ask('1. Mod Dosyasının Yolu (.fantome veya .zip dosyasını buraya sürükleyin): ');
    let modPath = cleanPath(modPathRaw);
    if (!fs.existsSync(modPath)) {
      console.error('\n❌ HATA: Girdiğiniz mod dosyası bulunamadı!');
      process.exit(1);
    }
    const modFileName = path.basename(modPath);

    // 2. Resim Dosyası
    let imgPathRaw = await ask('2. Mod Görselinin Yolu (.png veya .jpg resmi sürükleyin): ');
    let imgPath = cleanPath(imgPathRaw);
    if (!fs.existsSync(imgPath)) {
      console.error('\n❌ HATA: Girdiğiniz resim dosyası bulunamadı!');
      process.exit(1);
    }
    const imgFileName = path.basename(imgPath);

    // 3. Mod Adı
    let modName = await ask('3. Modun Adı (Örn: Dark Star Zed): ');
    if (!modName) {
      console.error('\n❌ HATA: Mod adı boş olamaz!');
      process.exit(1);
    }

    // 4. Şampiyon Adı
    let champName = await ask('4. Şampiyon Adı (Örn: Zed): ');
    if (!champName) champName = 'Şampiyon';

    // 5. Yapımcı
    let authorName = await ask('5. Yapımcı (Varsayılan için Enter\'a basın -> Herobrine): ');
    if (!authorName) authorName = 'Herobrine';

    // Klasör Adı ve ID Hazırla
    const folderName = `${modName} By ${authorName} 1.0.0-shop`;
    const targetFolder = path.join(MODS_DIR, folderName);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Dosyaları kopyala
    const destModPath = path.join(targetFolder, modFileName);
    const destImgPath = path.join(targetFolder, imgFileName);

    fs.copyFileSync(modPath, destModPath);
    fs.copyFileSync(imgPath, destImgPath);

    console.log(`\n✅ Dosyalar "mods/${folderName}" klasörüne kopyalandı.`);

    // GitHub URL'leri oluştur
    const encFolder = encodeURIComponent(folderName);
    const encModFile = encodeURIComponent(modFileName);
    const encImgFile = encodeURIComponent(imgFileName);

    const previewUrl = `https://raw.githubusercontent.com/Herobrine-2/skynix-manager-shop/main/mods/${encFolder}/${encImgFile}`;
    const downloadUrl = `https://raw.githubusercontent.com/Herobrine-2/skynix-manager-shop/main/mods/${encFolder}/${encModFile}`;

    // index.json Güncelle
    let indexData = [];
    if (fs.existsSync(INDEX_PATH)) {
      indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    }

    const newId = slugify(`${modName}-${authorName}-shop`);

    const newMod = {
      id: newId,
      name: `${modName} By ${authorName}`,
      title: champName,
      author: authorName,
      previewUrl: previewUrl,
      downloadUrl: downloadUrl,
      category: "champion"
    };

    indexData.unshift(newMod); // En başa ekle
    fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log('✅ index.json veritabanı güncellendi.');

    // Git Commit & Push
    console.log('\n🚀 GitHub\'a Yükleniyor...');
    try {
      execSync('git add .', { cwd: SHOP_DIR, stdio: 'ignore' });
      execSync(`git commit -m "Yeni mod eklendi: ${modName}"`, { cwd: SHOP_DIR, stdio: 'ignore' });
      execSync('git push origin main', { cwd: SHOP_DIR, stdio: 'ignore' });
      console.log('🎉 BAŞARILI! Mod mağazaya başarıyla eklendi ve GitHub\'a yüklendi!');
    } catch (gitErr) {
      console.log('✅ Dosyalar ve index.json veritabanı başarıyla güncellendi!');
      console.log('💡 Not: GitHub Desktop uygulamasını açıp "Commit & Push" butonuna basarak canlıya alabilirsiniz.');
    }

  } catch (err) {
    console.error('\n❌ Bir hata oluştu:', err.message);
  } finally {
    rl.close();
  }
}

main();
