/**
 * Generate bcrypt password hash
 * Usage: node docs/generate-password.js
 */

const bcrypt = require('bcrypt');

const password = 'password123';
const saltRounds = 10;

console.log('Generating password hash for: ' + password);
console.log('Salt rounds: ' + saltRounds);
console.log('');

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }

  console.log('✅ Generated hash:');
  console.log(hash);
  console.log('');
  console.log('Copy this hash and replace all "$2b$10$YourHashedPasswordHere" in sample-data.sql');
  console.log('');
  console.log('Example SQL update:');
  console.log(`UPDATE users SET password = '${hash}' WHERE id IN (1,2,3,4,5,6,7,8,9,10,11,12,13);`);
});
