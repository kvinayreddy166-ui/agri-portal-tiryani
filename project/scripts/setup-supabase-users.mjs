/**
 * Creates or updates portal login users via the Supabase Admin API.
 *
 * Usage (from project folder):
 *   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *   node scripts/setup-supabase-users.mjs
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://szxtfeiswxugxukztnst.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const USERS = [
  {
    email: 'k.vinayreddy166@gmail.com',
    password: 'Tiryani@2026',
    user_metadata: { full_name: 'Admin User' },
  },
  {
    email: 'test@gmail.com',
    password: 'Test@123',
    user_metadata: { full_name: 'Test User' },
  },
];

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function findUserByEmail(email) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to look up ${email}: ${body}`);
  }

  const payload = await response.json();
  return payload.users?.[0] ?? null;
}

async function upsertUser({ email, password, user_metadata }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to update ${email}: ${body}`);
    }

    console.log(`Updated ${email}`);
    return;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create ${email}: ${body}`);
  }

  console.log(`Created ${email}`);
}

for (const user of USERS) {
  await upsertUser(user);
}

console.log('Portal users are ready.');
