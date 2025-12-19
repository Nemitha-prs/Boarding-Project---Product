import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distIndexPath = path.join(__dirname, 'dist', 'index.js');
let content = fs.readFileSync(distIndexPath, 'utf8');

// Fix imports to add .js extension
content = content.replace(/from ['"]\.\/(env)['"]/g, "from './$1.js'");
content = content.replace(/from ['"]\.\/(routes\/[^'"]+)['"]/g, "from './$1.js'");

fs.writeFileSync(distIndexPath, content);
console.log('Fixed imports in dist/index.js');



