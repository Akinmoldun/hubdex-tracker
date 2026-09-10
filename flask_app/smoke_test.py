"""
Smoke test for Hubdex: exercises every route through Flask's test client.

Run from inside flask_app with the venv active:
    python smoke_test.py
Prints PASS/FAIL per step and exits nonzero on any failure.

Covers the auth validation contract:
  1. A new email with a 9-character password.
  2. The same email with different capitalization.
  3. The same email with spaces before or after it.
  4. Registering an email that already exists.
  5. Signing in with the correct password.
  6. Signing in with an incorrect password.
plus the full manual sequence for testuser@gmail.com.
"""

import os
import sys
import tempfile
import time

# Use a throwaway directory so the smoke test never touches real data.
_tmpdir = tempfile.mkdtemp()

import app as hubdex  # noqa: E402


def check(step, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {step}" + (f" ({detail})" if detail and not condition else ""))
    if not condition:
        failures.append(step)


failures = []

# Point the app at the temp database and (re)initialize the schema.
hubdex.DATABASE = os.path.join(_tmpdir, "test.db")
with hubdex.app.app_context():
    hubdex.sqlite3.connect(hubdex.DATABASE).close()
hubdex.init_db()

client = hubdex.app.test_client()
ts = str(int(time.time()))

DUPLICATE_MSG = b"An account with this email already exists. Please sign in instead."
INVALID_MSG = b"Invalid email or password."
PW_LONG = "S3cureP4ssw0rd"  # 14 chars, comfortably longer than 8
PW_9 = "9charPass"  # exactly 9 characters

# --- Public pages ---------------------------------------------------------
r = client.get("/")
check("landing 200", r.status_code == 200)
check("landing has wordmark", b"Hubdex" in r.data)
check("landing no em dash", b"\xe2\x80\x94" not in r.data, "em dash found in landing HTML")

r = client.get("/login")
check("login page 200", r.status_code == 200)

r = client.get("/register")
check("register page 200", r.status_code == 200)

r = client.get("/dashboard")
check("dashboard redirects when signed out", r.status_code == 302)

r = client.get("/definitely-not-a-page")
check("404 handler", r.status_code == 404 and b"404" in r.data)

# ===========================================================================
# The six required auth cases
# ===========================================================================

# --- Case 1: a new email with a 9-character password -----------------------
base_email = f"authcase{ts}@example.com"
r = client.post(
    "/register",
    data={"email": base_email, "name": "Auth Case", "password": PW_9, "confirm": PW_9},
    follow_redirects=True,
)
check(
    "case 1: new email + 9-char password accepted",
    r.status_code == 200
    and r.request.path.endswith("/login")
    and b"Your account has been created" in r.data,
    f"path={r.request.path}",
)

# --- Case 2: the same email with different capitalization ------------------
r = client.post(
    "/register",
    data={"email": base_email.upper(), "name": "Upper", "password": PW_9, "confirm": PW_9},
    follow_redirects=True,
)
check("case 2: uppercase duplicate rejected", DUPLICATE_MSG in r.data)

# --- Case 3: the same email with spaces before or after it -----------------
r = client.post(
    "/register",
    data={"email": f"  {base_email}  ", "name": "Spaced", "password": PW_9, "confirm": PW_9},
    follow_redirects=True,
)
check("case 3: spaced duplicate rejected", DUPLICATE_MSG in r.data)

# --- Case 4: registering an email that already exists ----------------------
r = client.post(
    "/register",
    data={"email": base_email, "name": "Again", "password": PW_9, "confirm": PW_9},
    follow_redirects=True,
)
check("case 4: exact duplicate rejected", DUPLICATE_MSG in r.data)

_db = hubdex.sqlite3.connect(hubdex.DATABASE)
_n = _db.execute("SELECT COUNT(*) FROM users WHERE email = ?", (base_email,)).fetchone()[0]
_db.close()
check("case 4: no second account created", _n == 1, f"rows={_n}")

# --- Case 5: signing in with the correct password --------------------------
r = client.post(
    "/login",
    data={"email": base_email, "password": PW_9},
    follow_redirects=True,
)
check("case 5: correct credentials sign in", r.status_code == 200 and r.request.path.endswith("/dashboard"))

# --- Case 6: signing in with an incorrect password -------------------------
client.post("/logout")
r = client.post(
    "/login",
    data={"email": base_email, "password": "wrong-password-1"},
    follow_redirects=True,
)
check("case 6: wrong password rejected", INVALID_MSG in r.data)

# Normalized sign-in variants for the same account.
r = client.post("/login", data={"email": base_email.upper(), "password": PW_9}, follow_redirects=True)
check("case 5b: uppercase email signs in", r.request.path.endswith("/dashboard"))
client.post("/logout")
r = client.post("/login", data={"email": f"  {base_email}  ", "password": PW_9}, follow_redirects=True)
check("case 5c: spaced email signs in", r.request.path.endswith("/dashboard"))
client.post("/logout")

# ===========================================================================
# The exact manual sequence for testuser@gmail.com
# ===========================================================================

# 1 + 2. Register testuser@gmail.com with a password longer than 8 chars.
r = client.post(
    "/register",
    data={"email": "testuser@gmail.com", "name": "Test User", "password": PW_LONG, "confirm": PW_LONG},
    follow_redirects=True,
)
check(
    "seq 1-2: testuser registered, sent to sign-in page",
    r.request.path.endswith("/login") and b"Your account has been created" in r.data,
    f"path={r.request.path}",
)

# 3. Sign out (no session after registration; must be harmless).
r = client.post("/logout", follow_redirects=True)
check("seq 3: sign out lands on sign-in page", r.request.path.endswith("/login"))

# 4. Sign in with testuser@gmail.com.
r = client.post("/login", data={"email": "testuser@gmail.com", "password": PW_LONG}, follow_redirects=True)
check("seq 4: testuser signs in", r.request.path.endswith("/dashboard"))
client.post("/logout")

# 5. Sign in with TESTUSER@gmail.com.
r = client.post("/login", data={"email": "TESTUSER@gmail.com", "password": PW_LONG}, follow_redirects=True)
check("seq 5: TESTUSER@gmail.com signs in", r.request.path.endswith("/dashboard"))
client.post("/logout")

# 6. Sign in with the email plus a surrounding space.
r = client.post("/login", data={"email": " testuser@gmail.com ", "password": PW_LONG}, follow_redirects=True)
check("seq 6: spaced email signs in", r.request.path.endswith("/dashboard"))
client.post("/logout")

# 7. Register testuser@gmail.com again.
r = client.post(
    "/register",
    data={"email": "testuser@gmail.com", "name": "Test User", "password": PW_LONG, "confirm": PW_LONG},
    follow_redirects=True,
)
check("seq 7: duplicate registration rejected", DUPLICATE_MSG in r.data)

# ===========================================================================
# Registration validation rejections
# ===========================================================================

r = client.post(
    "/register",
    data={"email": "x@example.com", "name": "", "password": PW_LONG, "confirm": PW_LONG},
)
check("missing name rejected", b"Full name is required" in r.data)

r = client.post(
    "/register",
    data={"email": "not-an-email", "name": "X", "password": PW_LONG, "confirm": PW_LONG},
)
check("bad email format rejected", b"valid email address" in r.data)

r = client.post(
    "/register",
    data={"email": "x@example.com", "name": "X", "password": "short", "confirm": "short"},
)
check("short password rejected", b"at least 8" in r.data)

r = client.post(
    "/register",
    data={"email": "x@example.com", "name": "X", "password": PW_LONG, "confirm": "different123"},
)
check("password mismatch rejected", b"Passwords do not match" in r.data)

# --- Session persistence: user stays signed in across requests -------------
r = client.post("/login", data={"email": base_email, "password": PW_9}, follow_redirects=True)
check("login for persistence check", r.request.path.endswith("/dashboard"))
r = client.get("/dashboard")
check("session persists across requests", r.status_code == 200)
client.post("/logout")

# ===========================================================================
# Application CRUD (logged-in user)
# ===========================================================================

crud_email = f"crud{ts}@example.com"
client.post(
    "/register",
    data={"email": crud_email, "name": "Crud User", "password": PW_LONG, "confirm": PW_LONG},
)
r = client.post("/login", data={"email": crud_email, "password": PW_LONG}, follow_redirects=True)
check("crud user logged in", r.request.path.endswith("/dashboard"))

r = client.get("/dashboard")
check("dashboard 200 when signed in", r.status_code == 200)
check("dashboard empty state", b"No applications" in r.data or b"empty" in r.data.lower())

r = client.post(
    "/applications/new",
    data={
        "company": "Acme Corp", "role": "Backend Engineer", "location": "Remote",
        "salary": "$150k", "url": "https://acme.example/jobs/1",
        "stage": "Applied", "priority": "High",
        "applied_date": "2026-09-01", "notes": "Referred by a friend.",
    },
    follow_redirects=True,
)
check("create application", r.status_code == 200 and b"Acme Corp" in r.data)

r = client.post(
    "/applications/new",
    data={"company": "Globex", "role": "Frontend Engineer", "stage": "Wishlist", "priority": "Medium"},
    follow_redirects=True,
)
check("create second application", r.status_code == 200 and b"Globex" in r.data)

r = client.post("/applications/new", data={"company": "Bad", "role": "Role", "url": "notaurl"})
check("bad URL rejected", b"http" in r.data)

r = client.post("/applications/new", data={"company": "Bad", "role": "Role", "stage": "Hired"})
check("invalid stage rejected", b"Invalid stage" in r.data)

r = client.get("/dashboard")
check("stats show total 2", b"02" in r.data)

r = client.get("/dashboard?q=globex")
check("search finds Globex", b"Globex" in r.data)
check("search hides Acme", b"Acme Corp" not in r.data)

r = client.get("/dashboard?stage=Applied")
check("stage filter shows Acme", b"Acme Corp" in r.data)

r = client.get("/dashboard?stage=Offer")
check("stage filter empty for Offer", b"Acme Corp" not in r.data)

r = client.get("/applications/1/edit")
check("edit page 200", r.status_code == 200 and b"Acme Corp" in r.data)

r = client.post(
    "/applications/1/edit",
    data={
        "company": "Acme Corp", "role": "Senior Backend Engineer", "location": "Remote",
        "salary": "$160k", "url": "https://acme.example/jobs/1",
        "stage": "Interview", "priority": "High",
        "applied_date": "2026-09-01", "notes": "Referred by a friend.",
    },
    follow_redirects=True,
)
check("edit application", r.status_code == 200 and b"Senior Backend Engineer" in r.data)

r = client.post("/applications/1/stage", data={"stage": "Offer"}, follow_redirects=True)
check("inline stage switch", r.status_code == 200)

_db = hubdex.sqlite3.connect(hubdex.DATABASE)
_row = _db.execute("SELECT stage FROM applications WHERE id = 1").fetchone()
_db.close()
check("stage persisted as Offer", _row and _row[0] == "Offer", f"got {_row}")

# Another user cannot touch Crud User's rows.
client2 = hubdex.app.test_client()
client2.post(
    "/register",
    data={"email": f"grace{ts}@example.com", "name": "Grace", "password": PW_LONG, "confirm": PW_LONG},
)
client2.post("/login", data={"email": f"grace{ts}@example.com", "password": PW_LONG})
r = client2.post("/applications/1/stage", data={"stage": "Rejected"})
check("cross user stage blocked", r.status_code == 404)

r = client2.get("/applications/1/edit")
check("cross user edit blocked", r.status_code == 404)

r = client2.post("/applications/1/delete")
check("cross user delete blocked", r.status_code == 404)

# --- Logout / login --------------------------------------------------------
r = client.post("/logout", follow_redirects=True)
check("logout redirects to login", r.status_code == 200 and r.request.path.endswith("/login"))

r = client.post("/applications/2/delete", follow_redirects=True)
check("delete requires login again", r.request.path.endswith("/login"))

r = client.post(
    "/login?next=/dashboard",
    data={"email": crud_email, "password": PW_LONG},
    follow_redirects=True,
)
check("login with next", r.status_code == 200 and b"Acme Corp" in r.data)

r = client.post("/applications/2/delete", follow_redirects=True)
check("delete application", r.status_code == 200 and b"Globex" not in r.data)

# --- Database contract ------------------------------------------------------
_db = hubdex.sqlite3.connect(hubdex.DATABASE)
_row = _db.execute(
    "SELECT email_verified FROM users WHERE email = 'testuser@gmail.com'"
).fetchone()
_hash = _db.execute(
    "SELECT password_hash FROM users WHERE email = 'testuser@gmail.com'"
).fetchone()[0]
_db.close()
check("email_verified column present", _row is not None and _row[0] == 0, f"got {_row}")
check("password stored hashed, not plain text", _hash != PW_LONG and _hash.startswith("scrypt:"))

# --- Page hygiene + static assets ------------------------------------------
for page in ["/", "/login", "/register"]:
    r = client.get(page)
    check(f"no em dash on {page}", b"\xe2\x80\x94" not in r.data)

r = client.get("/static/css/theme.css")
check("theme.css served", r.status_code == 200)
r = client.get("/static/js/main.js")
check("main.js served", r.status_code == 200)
r = client.get("/static/logo.svg")
check("logo.svg served", r.status_code == 200)

print()
if failures:
    print(f"FAILED ({len(failures)}): {', '.join(failures)}")
    sys.exit(1)
print("ALL CHECKS PASSED")
