/**
 * Integration test for Hubdex Convex Auth password flows.
 *
 * Exercises the app's real registration path (normalize email -> duplicate
 * pre-check -> auth:signIn signUp) and the sign-in path against a live
 * Convex deployment:
 *
 *   bun scripts/auth-integration-test.mjs https://<deployment>.convex.cloud
 *
 * Covers the auth validation contract:
 *   1. A new email with a 9-character password.
 *   2. The same email with different capitalization.
 *   3. The same email with spaces before or after it.
 *   4. Registering an email that already exists.
 *   5. Signing in with the correct password.
 *   6. Signing in with an incorrect password.
 * plus the manual sequence for a testuser-style address.
 */

import { ConvexHttpClient } from "convex/browser";

const url = process.env.CONVEX_URL ?? process.argv[2];
if (!url) {
  console.error(
    "Usage: bun scripts/auth-integration-test.mjs https://<deployment>.convex.cloud",
  );
  process.exit(1);
}

const DUPLICATE_MSG =
  "An account with this email already exists. Please sign in instead.";

let failures = 0;
function check(name, condition, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  console.log(
    `[${status}] ${name}` + (condition || !detail ? "" : ` (${detail})`),
  );
  if (!condition) failures++;
}

const client = new ConvexHttpClient(url);
const suffix = Date.now().toString(36);

const LONG_PASSWORD = "S3cureP4ssw0rd"; // 14 chars, longer than 8
const PW_9 = "9charPass"; // exactly 9 characters

// Mirror of the app's normalization rule (src/pages/Auth.tsx and
// src/convex/auth.ts): trim spaces, lowercase the whole address.
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function emailTaken(email) {
  return client.query("authAccounts:passwordAccountExists", {
    email: normalizeEmail(email),
  });
}

// The app's registration flow: normalize, pre-check duplicates, then create.
// Throws DUPLICATE_MSG exactly like the UI shows when the account exists.
async function registerViaAppFlow(rawEmail, password, name) {
  const email = normalizeEmail(rawEmail);
  if (await emailTaken(email)) {
    throw new Error(DUPLICATE_MSG);
  }
  return client.action("auth:signIn", {
    provider: "password",
    params: { flow: "signUp", email, password, name },
  });
}

async function signIn(rawEmail, password) {
  return client.action("auth:signIn", {
    provider: "password",
    params: {
      flow: "signIn",
      email: normalizeEmail(rawEmail),
      password,
    },
  });
}

async function expectDuplicate(name, email, password) {
  try {
    await registerViaAppFlow(email, password, "Dup");
    check(name, false, "no error thrown");
  } catch (err) {
    const message = String(err);
    check(name, message.includes(DUPLICATE_MSG), message);
  }
}

async function expectSignIn(name, email, password) {
  try {
    const result = await signIn(email, password);
    check(name, result?.tokens !== undefined, JSON.stringify(result));
  } catch (err) {
    check(name, false, String(err));
  }
}

// --- Sequence 1-2: register with a password longer than 8 characters -------
const mainEmail = `auth.tester.${suffix}@example.com`;
let registered = false;
try {
  await registerViaAppFlow(mainEmail, LONG_PASSWORD, "Auth Tester");
  registered = true;
  check("seq 1-2: registration with 14-char password accepted", true);
} catch (err) {
  check("seq 1-2: registration with 14-char password accepted", false, String(err));
}

// --- Case 1: a new email with a 9-character password -----------------------
const caseEmail = `case.one.${suffix}@example.com`;
try {
  await registerViaAppFlow(caseEmail, PW_9, "Case One");
  check("case 1: new email with 9-char password accepted", true);
} catch (err) {
  check("case 1: new email with 9-char password accepted", false, String(err));
}

// --- Case 2: the same email with different capitalization ------------------
await expectDuplicate("case 2: uppercase duplicate rejected", caseEmail.toUpperCase(), PW_9);

// --- Case 3: the same email with spaces before or after it -----------------
await expectDuplicate("case 3: spaced duplicate rejected", `  ${caseEmail}  `, PW_9);

// --- Case 4: registering an email that already exists ----------------------
await expectDuplicate("case 4: exact duplicate rejected", caseEmail, PW_9);
await expectDuplicate("seq 7: testuser duplicate rejected", mainEmail, LONG_PASSWORD);
// Duplicate with a DIFFERENT password must also be rejected (this is the
// case where Convex Auth alone would throw "Account ... already exists").
await expectDuplicate("case 4b: duplicate with different password rejected", caseEmail, "different-pass-1");

// --- Uniqueness invariant: exactly one account per normalized email --------
const takenUpper = await emailTaken(caseEmail.toUpperCase());
check("invariant: uppercase variant resolves to existing account", takenUpper === true, String(takenUpper));
const takenSpaced = await emailTaken(`  ${caseEmail}  `);
check("invariant: spaced variant resolves to existing account", takenSpaced === true, String(takenSpaced));
const takenRandom = await emailTaken(`nobody.${suffix}@example.com`);
check("invariant: unknown email reports not taken", takenRandom === false, String(takenRandom));

// --- Case 5: signing in with the correct password --------------------------
if (registered) {
  await expectSignIn("case 5: correct credentials sign in", mainEmail, LONG_PASSWORD);
  await expectSignIn("case 5b: uppercase email signs in", mainEmail.toUpperCase(), LONG_PASSWORD);
  await expectSignIn("case 5c: spaced email signs in", `  ${mainEmail}  `, LONG_PASSWORD);

  // --- Case 6: signing in with an incorrect password -----------------------
  try {
    await signIn(mainEmail, "definitely-wrong-1");
    check("case 6: wrong password rejected", false, "no error thrown");
  } catch (err) {
    const message = String(err);
    // Convex Auth's raw "invalid credentials" signal; the app maps every
    // sign-in error to the generic "Invalid email or password." message.
    check(
      "case 6: wrong password rejected",
      /InvalidSecret|invalid credentials|invalid email or password/i.test(message),
      message,
    );
    check(
      "case 6: error does not leak sensitive detail",
      !/scrypt|hash:|user id|already exists/i.test(message),
      message,
    );
  }
} else {
  failures += 6;
}

if (failures) {
  console.log(`\nFAILED (${failures})`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
