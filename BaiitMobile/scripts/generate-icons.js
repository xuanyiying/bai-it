const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '../../icons/icon128.png');
const ASSETS_DIR = path.join(__dirname, '../assets');

// 移动应用图标尺寸配置
const ICONS = [
  { name: 'icon.png', size: 1024 },                    // iOS App Store + Android
  { name: 'adaptive-icon.png', size: 1024 },           // Android Adaptive Icon
  { name: 'splash-icon.png', size: 1024 },             // Splash screen icon
  { name: 'favicon.png', size: 48 },                   // Web favicon (保留)
];

// Android 自适应图标前景/背景
const ANDROID_FOREGROUND_SIZE = 432;  // 前景图标尺寸
const ANDROID_BACKGROUND_SIZE = 108;  // 背景色块尺寸

async function generateIcons() {
  console.log('🎨 生成移动应用图标...\n');

  // 读取源图标
  const sourceBuffer = fs.readFileSync(SOURCE_ICON);

  for (const icon of ICONS) {
    const outputPath = path.join(ASSETS_DIR, icon.name);

    await sharp(sourceBuffer)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 244, g: 67, b: 54, alpha: 1 } // #F44336 红色背景
      })
      .png()
      .toFile(outputPath);

    console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
  }

  // 生成 Android 自适应图标前景
  const fgOutputPath = path.join(ASSETS_DIR, 'android-icon-foreground.png');
  await sharp(sourceBuffer)
    .resize(ANDROID_FOREGROUND_SIZE * 0.6, ANDROID_FOREGROUND_SIZE * 0.6, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: Math.floor(ANDROID_FOREGROUND_SIZE * 0.2),
      bottom: Math.floor(ANDROID_FOREGROUND_SIZE * 0.2),
      left: Math.floor(ANDROID_FOREGROUND_SIZE * 0.2),
      right: Math.floor(ANDROID_FOREGROUND_SIZE * 0.2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(fgOutputPath);
  console.log(`✅ android-icon-foreground.png (${ANDROID_FOREGROUND_SIZE}x${ANDROID_FOREGROUND_SIZE})`);

  // 生成 Android 自适应图标背景（纯色）
  const bgOutputPath = path.join(ASSETS_DIR, 'android-icon-background.png');
  await sharp({
    create: {
      width: ANDROID_BACKGROUND_SIZE,
      height: ANDROID_BACKGROUND_SIZE,
      channels: 4,
      background: { r: 244, g: 67, b: 54, alpha: 1 }
    }
  })
    .png()
    .toFile(bgOutputPath);
  console.log(`✅ android-icon-background.png (${ANDROID_BACKGROUND_SIZE}x${ANDROID_BACKGROUND_SIZE})`);

  // 生成单色图标（用于 Android themed icons）
  const monoOutputPath = path.join(ASSETS_DIR, 'android-icon-monochrome.png');
  await sharp(sourceBuffer)
    .resize(96, 96, { fit: 'contain' })
    .threshold(128)
    .png()
    .toFile(monoOutputPath);
  console.log(`✅ android-icon-monochrome.png (96x96)`);

  console.log('\n🎉 所有图标生成完成！');
  console.log(`📁 输出目录: ${ASSETS_DIR}`);
}

generateIcons().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
