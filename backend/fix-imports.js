import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function getAllJsFiles(dir, fileList = []) {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = join(dir, file.name);
      
      if (file.isDirectory()) {
        await getAllJsFiles(filePath, fileList);
      } else if (file.name.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  
  return fileList;
}

async function fixImportsInFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf-8');
    let modified = false;
    const originalContent = content;

    // Fix relative imports: ./file or ../file or ../folder/file
    // This regex matches imports without .js extension
    content = content.replace(
      /from\s+(['"])(\.\.?\/[^'"]*?)(?<!\.js)\1/g,
      (match, quote, path) => {
        modified = true;
        return `from ${quote}${path}.js${quote}`;
      }
    );

    if (modified && content !== originalContent) {
      await writeFile(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Starting import fixes...\n');
  
  const distDir = './dist';
  const jsFiles = await getAllJsFiles(distDir);
  
  console.log(`Found ${jsFiles.length} JavaScript files\n`);
  
  let fixedCount = 0;
  for (const file of jsFiles) {
    const wasFixed = await fixImportsInFile(file);
    if (wasFixed) fixedCount++;
  }
  
  console.log(`\n✓ Complete! Fixed ${fixedCount} files`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});