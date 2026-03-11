const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgContent = fs.readFileSync('./public/icon.svg', 'utf8')
const outputDir = './public/icons'

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const sizes = [48, 72, 96, 144, 192, 512]

async function generate() {
  console.log('Generating PNG icons from SVG...')

  for (const size of sizes) {
    // Regular icon
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`))
    console.log(`✅ icon-${size}.png`)

    // Maskable versions (192 and 512 only)
    if (size === 192 || size === 512) {
      // Maskable: add extra padding (20%) so content stays in safe zone
      const padded = Math.round(size * 0.8)
      const pad = Math.round(size * 0.1)

      await sharp(Buffer.from(svgContent))
        .resize(padded, padded)
        .extend({
          top: pad,
          bottom: pad,
          left: pad,
          right: pad,
          background: { r: 236, g: 72, b: 153, alpha: 1 } // #EC4899 pink
        })
        .png()
        .toFile(path.join(outputDir, `icon-maskable-${size}.png`))
      console.log(`✅ icon-maskable-${size}.png`)
    }
  }

  console.log('\n🎉 All icons generated in public/icons/')
}

generate().catch(console.error)
