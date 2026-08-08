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

async function main() {
  console.log('\n========================================');
  console.log('    SKYNIX MAĞAZA - MOD SİLME   ');
  console.log('========================================\n');

  try {
    if (!fs.existsSync(INDEX_PATH)) {
      console.error('❌ HATA: index.json bulunamadı!');
      process.exit(1);
    }

    let indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

    if (indexData.length === 0) {
      console.log('⚠️ Mağazada hiç mod yok.');
      process.exit(0);
    }

    console.log('--- MAĞAZADAKİ MEVCUT MODLAR ---');
    indexData.forEach((item, index) => {
      console.log(`[${index + 1}] ${item.name || item.title} (${item.title || 'Mod'})`);
    });
    console.log('--------------------------------\n');

    let selection = await ask('Silmek istediğiniz modun NUMARASINI veya ADINI yazın: ');

    let targetIndex = -1;
    const numSel = parseInt(selection);

    if (!isNaN(numSel) && numSel >= 1 && numSel <= indexData.length) {
      targetIndex = numSel - 1;
    } else {
      targetIndex = indexData.findIndex(m => 
        (m.name && m.name.toLowerCase().includes(selection.toLowerCase())) ||
        (m.id && m.id.toLowerCase().includes(selection.toLowerCase()))
      );
    }

    if (targetIndex === -1) {
      console.error('\n❌ HATA: Belirtilen mod bulunamadı!');
      process.exit(1);
    }

    const selectedMod = indexData[targetIndex];
    console.log(`\n⚠️ SİLİNECEK MOD: "${selectedMod.name}" (${selectedMod.title})`);
    
    let confirm = await ask('Emin misiniz? (E/H): ');
    if (confirm.toLowerCase() !== 'e') {
      console.log('İşlem iptal edildi.');
      process.exit(0);
    }

    // Klasörü bul ve sil
    if (selectedMod.downloadUrl) {
      try {
        const decodedUrl = decodeURIComponent(selectedMod.downloadUrl);
        const parts = decodedUrl.split('/mods/');
        if (parts.length > 1) {
          const folderPart = parts[1].split('/')[0];
          const folderPath = path.join(MODS_DIR, folderPart);
          if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`✅ Klasör silindi: mods/${folderPart}`);
          }
        }
      } catch (err) {
        console.warn('⚠️ Klasör silinirken uyarı:', err.message);
      }
    }

    // index.json'dan çıkar
    indexData.splice(targetIndex, 1);
    fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log('✅ Mod index.json veritabanından kaldırıldı.');

    // Git Commit & Push
    console.log('\n🚀 GitHub Değişiklikleri Gönderiliyor...');
    try {
      execSync('git add .', { cwd: SHOP_DIR, stdio: 'ignore' });
      execSync(`git commit -m "Mod silindi: ${selectedMod.name}"`, { cwd: SHOP_DIR, stdio: 'ignore' });
      execSync('git push origin main', { cwd: SHOP_DIR, stdio: 'ignore' });
      console.log('🎉 SİLME BAŞARILI! Mod mağazadan ve GitHub\'dan tamamen silindi!');
    } catch (gitErr) {
      console.log('✅ Mod klasörü ve index.json veritabanı başarıyla güncellendi!');
      console.log('💡 Not: GitHub Desktop uygulamasını açıp "Commit & Push" butonuna basarak canlıya alabilirsiniz.');
    }

  } catch (err) {
    console.error('\n❌ Bir hata oluştu:', err.message);
  } finally {
    rl.close();
  }
}

main();
