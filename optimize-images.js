const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/images/90staycj';
const outputDir = './public/images/90staycj-optimized';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImages() {
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
  
  console.log(`🚀 Optimizing ${imageFiles.length} images...`);
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    
    try {
      // Get original size
      const originalStat = fs.statSync(inputPath);
      const originalSize = (originalStat.size / 1024 / 1024).toFixed(2);
      
      // Optimize image
      await sharp(inputPath)
        .resize(1920, 1080, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85, 
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);
      
      // Get optimized size
      const optimizedStat = fs.statSync(outputPath);
      const optimizedSize = (optimizedStat.size / 1024 / 1024).toFixed(2);
      const reduction = ((1 - optimizedStat.size / originalStat.size) * 100).toFixed(1);
      
      console.log(`✅ ${file}: ${originalSize}MB → ${optimizedSize}MB (${reduction}% reduction)`);
      
    } catch (error) {
      console.error(`❌ Error optimizing ${file}:`, error.message);
    }
  }
  
  console.log('🎉 Image optimization complete!');
}

optimizeImages().catch(console.error);