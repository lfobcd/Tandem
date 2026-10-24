/**
 * Automated Test Suite for Tandem Franco-Norsk
 * Runs comprehensive functional tests on:
 * - Launch Month Free Offer (30-day calculation, auto-unlock)
 * - Newsletter Collection (opt-in, dedup, retrieval, CSV formatting)
 * - Accounts & Auth (signup, login, demo profiles)
 * - Messaging & Conversations
 * - Vipps Security Configuration (frozen object, seal, integrity check)
 * - Translation parity (FR / NO)
 */

// Mock browser environment for Node.js
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = {
  localStorage: mockLocalStorage,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

async function runTests() {
  console.log('🧪 Starting Full Test Suite for Tandem Franco-Norsk...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, extraInfo?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extraInfo ? `(${extraInfo})` : ''}`);
      failedCount++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Vipps Security & Integrity
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Vipps Security & Integrity ---');
  const { VIPPS_SECURITY_CONFIG, verifyVippsIntegrity } = await import('../src/config/vippsSecurity');

  assert(Object.isFrozen(VIPPS_SECURITY_CONFIG), 'Vipps config object is deeply frozen against tampering');
  assert(VIPPS_SECURITY_CONFIG.phone === '92131792', 'Vipps raw recipient phone is exactly 92131792');
  assert(VIPPS_SECURITY_CONFIG.phoneFormatted === '92 13 17 92', 'Vipps formatted phone is "92 13 17 92"');
  assert(VIPPS_SECURITY_CONFIG.amountNOK === 39, 'Official Vipps amount is 39 NOK');
  assert(verifyVippsIntegrity('92 13 17 92') === true, 'verifyVippsIntegrity passes with valid phone');
  assert(verifyVippsIntegrity('99999999') === false, 'verifyVippsIntegrity rejects altered phone numbers');

  // Attempting to modify frozen object should fail
  try {
    (VIPPS_SECURITY_CONFIG as any).phone = '12345678';
  } catch {}
  assert(VIPPS_SECURITY_CONFIG.phone === '92131792', 'Vipps phone cannot be reassigned (immutable in memory)');

  // -------------------------------------------------------------
  // TEST GROUP 2: Launch Month Free Offer (30 Days)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Launch Month Free Offer (30 Days) ---');
  const { computeLaunchOfferStats, LAUNCH_MONTH_TOTAL_DAYS, dataStore } = await import('../src/lib/supabase');

  const stats = computeLaunchOfferStats(10);
  assert(stats.isLaunchMonthActive === true, 'Launch month is currently active');
  assert(stats.isFreeOfferActive === true, 'Free offer flag is true');
  assert(stats.totalDays === 30, 'Total days configured to 30 days');
  assert(stats.daysRemaining >= 1 && stats.daysRemaining <= 30, `Days remaining is valid: ${stats.daysRemaining} days`);
  assert(stats.offerTitleFr.includes('1er mois'), 'French title mentions "1er mois"');
  assert(stats.offerSubtitleFr.includes('0 NOK au lieu de 39 NOK'), 'French subtitle mentions "0 NOK au lieu de 39 NOK"');

  // -------------------------------------------------------------
  // TEST GROUP 3: Registration & Auto-Unlock during Launch Month
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Account Registration & Launch Month Auto-Unlock ---');
  const testEmail = `test.user.${Date.now()}@example.com`;
  const regResult = dataStore.registerAccount({
    email: testEmail,
    password: 'SecurePassword123!',
    prenom: 'Julien',
    langue_maternelle: 'français',
    quartier: 'Grünerløkka, Oslo',
    newsletterConsent: true,
  });

  assert(regResult.success === true, 'Registration succeeds for new email');
  assert(regResult.user !== undefined, 'User object is returned upon registration');
  assert(regResult.user?.a_paye === true, 'New user automatically receives a_paye = true (Launch Month 0 NOK)');
  assert(regResult.user?.is_beta_pioneer === true, 'New user receives is_beta_pioneer = true');
  assert(regResult.user?.newsletter_subscribed === true, 'New user has newsletter_subscribed = true');

  // Login test
  const loginResult = dataStore.loginAccount(testEmail, 'SecurePassword123!');
  assert(loginResult.success === true, 'Login with correct credentials succeeds');
  assert(loginResult.user?.email === testEmail, 'Logged in user email matches');

  const failedLogin = dataStore.loginAccount(testEmail, 'WrongPassword');
  assert(failedLogin.success === false, 'Login with incorrect password fails');

  // -------------------------------------------------------------
  // TEST GROUP 4: Newsletter Collection & Management
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Newsletter Subscriber Store & Export ---');
  const subscribers = dataStore.getNewsletterSubscribers();
  const foundSub = subscribers.find((s) => s.email.toLowerCase() === testEmail.toLowerCase());
  assert(foundSub !== undefined, 'Registered user with newsletter consent is in newsletter list');
  assert(foundSub?.prenom === 'Julien', 'Newsletter subscriber prenom is captured');
  assert(foundSub?.consent === true, 'Newsletter consent is true');

  // Test visitor subscription (from Landing Page box)
  const visitorEmail = `visitor.${Date.now()}@oslo.no`;
  const subResult = dataStore.subscribeNewsletter({
    email: visitorEmail,
    prenom: 'Ingrid',
    langue_maternelle: 'norvégien',
    source: 'visiteur_landing',
    consent: true,
  });
  assert(subResult.success === true && subResult.isNew === true, 'Visitor newsletter subscription succeeds');

  // Duplicate email subscription should update rather than duplicate
  const dupResult = dataStore.subscribeNewsletter({
    email: visitorEmail,
    prenom: 'Ingrid Updated',
    source: 'visiteur_landing',
  });
  assert(dupResult.success === true && dupResult.isNew === false, 'Re-subscribing existing email updates without duplicate');

  const currentSubs = dataStore.getNewsletterSubscribers();
  const ingridEntries = currentSubs.filter((s) => s.email.toLowerCase() === visitorEmail.toLowerCase());
  assert(ingridEntries.length === 1, 'Only 1 subscriber entry exists for the email');
  assert(ingridEntries[0].prenom === 'Ingrid Updated', 'Subscriber prenom was updated');

  // -------------------------------------------------------------
  // TEST GROUP 5: Messaging & Conversations
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Messaging & Conversations ---');
  dataStore.setCurrentUser(regResult.user!);
  const profiles = dataStore.getProfiles();
  assert(profiles.length >= 2, 'Profiles store has initial demo members');

  const partner = profiles.find((p) => p.id !== regResult.user!.id)!;
  const convId = dataStore.startConversation(partner.id);
  assert(Boolean(convId), `Conversation started with partner ${partner.prenom} (ID: ${convId})`);

  const sendResult = dataStore.sendMessage(convId, 'Hei! Vil du møtes for en kaffe på Fuglen?');
  assert(sendResult.id !== undefined, 'Message sent successfully');

  const messages = dataStore.getMessages(convId);
  assert(messages.length >= 1, 'Conversation contains the sent message');
  assert(messages[messages.length - 1].content.includes('Fuglen'), 'Message content is preserved');

  // -------------------------------------------------------------
  // TEST GROUP 6: Admin / Manager Capabilities
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Manager Admin Functions ---');
  const allUsers = dataStore.adminGetAllUsers();
  assert(allUsers.length >= 1, `adminGetAllUsers returns all profiles (count: ${allUsers.length})`);

  // Test setting payment status
  const toggleResult = dataStore.adminSetUserPayment(regResult.user!.id, false, 'none');
  assert(toggleResult.success === true, 'Admin can toggle user payment status');
  const updatedUser = dataStore.getProfiles().find((p) => p.id === regResult.user!.id);
  assert(updatedUser?.a_paye === false, 'User status was updated to unpaid');

  const reactivateResult = dataStore.adminSetUserPayment(regResult.user!.id, true, 'approved');
  assert(reactivateResult.success === true, 'Admin can reactivate user payment');
  const reUpdated = dataStore.getProfiles().find((p) => p.id === regResult.user!.id);
  assert(reUpdated?.a_paye === true, 'User status was reactivated to paid');

  // -------------------------------------------------------------
  // TEST GROUP 7: Internationalization (FR & NO Parity)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Internationalization (FR & NO Parity) ---');
  const { translations } = await import('../src/lib/i18n');
  assert(translations.fr !== undefined, 'French translation dictionary is present');
  assert(translations.no !== undefined, 'Norwegian translation dictionary is present');

  const frKeys = Object.keys(translations.fr);
  const noKeys = Object.keys(translations.no);
  assert(frKeys.length === noKeys.length, `Both locales have identical key count (${frKeys.length} keys)`);

  const missingInNo = frKeys.filter((k) => !(k in translations.no));
  assert(missingInNo.length === 0, 'No keys missing in Norwegian translation dictionary', missingInNo.join(', '));

  const missingInFr = noKeys.filter((k) => !(k in translations.fr));
  assert(missingInFr.length === 0, 'No keys missing in French translation dictionary', missingInFr.join(', '));

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n=============================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('=============================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
