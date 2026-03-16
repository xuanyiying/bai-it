const sharp = require('sharp');
const fs = require('fs');

const sourceIcon = '/Users/yiying/dev-app/bai-it/icons/icon128.png';
const assetsDir = '/Users/yiying/dev-app/bai-it/BaiitMobile/assets';
const sourceBuffer = fs.readFileSync(sourceIcon);

const icons = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 1024 },
  { name: 'favicon.png', size: 48 }
];

Promise.all(icons.map(icon => {
  return sharp(sourceBuffer)
    .resize(icon.size, icon.size, {
      fit: 'contain',
      background: { r: 244, g: 67, b: 54, alpha: 1 }
    })
    .png()
    .toFile(assetsDir + '/' + icon.name)
    .then(() => console.log('Generated: ' + icon.name));
})).then(() => {
  return sharp(sourceBuffer)
    .resize(259, 259, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 86, bottom: 87, left: 86, right: 87, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(assetsDir + '/android-icon-foreground.png');
}).then(() => {
  console.log('Generated: android-icon-foreground.png');
  return sharp({ create: { width: 108, height: 108, channels: 4, background: { r: 244, g: 67, b: 54, alpha: 1 } } })
    .png()
    .toFile(assetsDir + '/android-icon-background.png');
}).then(() => {
  console.log('Generated: android-icon-background.png');
  return sharp(sourceBuffer)
    .resize(96, 96, { fit: 'contain' })
    .threshold(128)
    .png()
    .toFile(assetsDir + '/android-icon-monochrome.png');
}).then(() => {
  console.log('Generated: android-icon-monochrome.png');
  console.log('Done!');
}).catch(err => console.error('Error:', err));
