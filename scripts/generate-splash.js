const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
    splash: 1242,
    icon: 1024,
    adaptive: 512,
};

async function generateImages() {
    const svgBuffer = fs.readFileSync(path.join(__dirname, '../src/assets/splash.svg'));

    // Generate splash screen
    await sharp(svgBuffer)
        .resize(sizes.splash, sizes.splash)
        .png()
        .toFile(path.join(__dirname, '../src/assets/splash.png'));

    // Generate app icon
    await sharp(svgBuffer)
        .resize(sizes.icon, sizes.icon)
        .png()
        .toFile(path.join(__dirname, '../src/assets/icon.png'));

    // Generate adaptive icon
    await sharp(svgBuffer)
        .resize(sizes.adaptive, sizes.adaptive)
        .png()
        .toFile(path.join(__dirname, '../src/assets/adaptive-icon.png'));
}

generateImages().catch(console.error);
