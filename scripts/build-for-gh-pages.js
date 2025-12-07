const fs = require('fs');
const path = require('path');

// Check if public directory exists
if (fs.existsSync('public')) {
  console.log('Moving files from public/ to root...');

  // Get all files and directories in public
  const items = fs.readdirSync('public');

  // Copy each item to root
  items.forEach(item => {
    const sourcePath = path.join('public', item);
    const destPath = item;

    try {
      // Use cpSync for Node.js 16+ or fallback for older versions
      if (fs.cpSync) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
      } else {
        // Fallback for older Node.js versions
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          const subItems = fs.readdirSync(sourcePath);
          subItems.forEach(subItem => {
            fs.cpSync(path.join(sourcePath, subItem), path.join(destPath, subItem), {
              recursive: true,
            });
          });
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
      console.log(`Moved: ${item}`);
    } catch (error) {
      console.error(`Error moving ${item}:`, error.message);
    }
  });

  // Remove public directory
  try {
    fs.rmSync('public', { recursive: true, force: true });
    console.log('Removed public/ directory');
  } catch (error) {
    console.error('Error removing public directory:', error.message);
  }

  console.log('Build for GitHub Pages completed successfully!');
} else {
  console.log('No public directory found - build may have failed');
  process.exit(1);
}
