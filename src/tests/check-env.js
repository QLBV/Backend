// Quick script to check .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('📋 Checking .env file...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ File .env does not exist!');
  console.log('   Please create .env file in:', __dirname);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

console.log('✅ .env file found\n');
console.log('📝 Google OAuth variables:\n');

let foundCallback = false;
let foundClientId = false;
let foundClientSecret = false;

lines.forEach((line, index) => {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('GOOGLE_CALLBACK_URL=')) {
    foundCallback = true;
    const value = trimmed.split('=')[1] || '';
    console.log(`   Line ${index + 1}: GOOGLE_CALLBACK_URL=${value}`);
    
    if (value.includes(':3000')) {
      console.error('   ❌ ERROR: Using port 3000 (frontend)! Should be port 5000 (backend)');
    } else if (value.includes(':5000')) {
      console.log('   ✅ Correct: Using port 5000 (backend)');
    }
  }
  
  if (trimmed.startsWith('GOOGLE_CLIENT_ID=')) {
    foundClientId = true;
    const value = trimmed.split('=')[1] || '';
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`   Line ${index + 1}: GOOGLE_CLIENT_ID=${preview}`);
  }
  
  if (trimmed.startsWith('GOOGLE_CLIENT_SECRET=')) {
    foundClientSecret = true;
    const value = trimmed.split('=')[1] || '';
    const preview = value.length > 10 ? value.substring(0, 10) + '...' : value;
    console.log(`   Line ${index + 1}: GOOGLE_CLIENT_SECRET=${preview}`);
  }
});

console.log('\n📊 Summary:');
console.log(`   GOOGLE_CALLBACK_URL: ${foundCallback ? '✅ Found' : '❌ Missing'}`);
console.log(`   GOOGLE_CLIENT_ID: ${foundClientId ? '✅ Found' : '❌ Missing'}`);
console.log(`   GOOGLE_CLIENT_SECRET: ${foundClientSecret ? '✅ Found' : '❌ Missing'}`);

if (!foundCallback) {
  console.log('\n⚠️  GOOGLE_CALLBACK_URL not found in .env');
  console.log('   Add this line to .env:');
  console.log('   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/oauth/google/callback');
}

console.log('\n💡 Tips:');
console.log('   1. Make sure .env file is in the Backend folder');
console.log('   2. Restart backend server after changing .env');
console.log('   3. Check for typos in variable names (case-sensitive)');
console.log('   4. No spaces around = sign: GOOGLE_CALLBACK_URL=value');
