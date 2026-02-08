// Create Admin User Script
// Run with: npx tsx worker/scripts/create-admin.ts <email> <password>

const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    KEY_LENGTH * 8
  );

  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(SALT_LENGTH + KEY_LENGTH);
  combined.set(salt, 0);
  combined.set(hashArray, SALT_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npx tsx create-admin.ts <email> <password>');
    process.exit(1);
  }

  const [email, password] = args;
  const hash = await hashPassword(password);
  
  console.log('\n=== Admin User Creation ===\n');
  console.log('Email:', email);
  console.log('Password Hash:', hash);
  console.log('\nRun this SQL command:');
  console.log('---');
  console.log(`npx wrangler d1 execute mibox-houston --command "INSERT INTO users (email, password_hash, created_at, updated_at) VALUES ('${email}', '${hash}', strftime('%s','now'), strftime('%s','now'))"`);
  console.log('---\n');
}

main().catch(console.error);
