// add-extensions.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'public/uploads/profiles');

console.log('Looking for images in:', uploadDir);

// Your existing files
const files = [
    'profile-1762253903071-5459e148-8525-4c34-834b-dd80fbea4112',
    'profile-1762254258735-accabc93-98ec-41c1-a094-b47fcfa57b8d',
    'profile-1762254984263-5a7c0973-d666-4feb-8e56-f6a8225386bf',
    'profile-1762256584558-cc59e2f3-8079-4284-bc10-8ab3424bbcdb',
    'profile-1762258084683-428bc8f0-442d-4d0a-9c0a-dcbf44896cc6',
    'profile-1762259561114-b9059db7-865d-4ff2-9525-f2a07ccb2ba8'
];

files.forEach(filename => {
    const oldPath = path.join(uploadDir, filename);
    const newPath = path.join(uploadDir, filename + '.jpg');
    
    try {
        if (fs.existsSync(oldPath)) {
            // Check if already has extension
            if (!fs.existsSync(newPath)) {
                fs.renameSync(oldPath, newPath);
                console.log(`✅ Renamed: ${filename} → ${filename}.jpg`);
            } else {
                console.log(`⚠️  Already has extension: ${filename}.jpg`);
            }
        } else {
            // Check if file already has extension
            if (fs.existsSync(newPath)) {
                console.log(`✅ File exists with extension: ${filename}.jpg`);
            } else {
                console.log(`❌ Not found: ${filename}`);
            }
        }
    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
    }
});

// List all files in directory
console.log('\n📁 All files in uploads/profiles:');
try {
    const allFiles = fs.readdirSync(uploadDir);
    allFiles.forEach(file => console.log(`   - ${file}`));
} catch (error) {
    console.error('Error reading directory:', error.message);
}

console.log('\n✅ Done!');