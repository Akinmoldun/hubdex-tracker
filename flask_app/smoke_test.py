"""
Smoke test for Hubdex: exercises every route through Flask's test client.

Run from inside flask_app with the venv active:
    python smoke_test.py
Prints PASS/FAIL per step and exits nonzero on any failure.
"""

import os
import sys
import tempfile

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

# --- Register -------------------------------------------------------------
r = client.post(
    "/register",
    data={"email": "ada@example.com", "name": "Ada", "password": "hunter2hunter2", "confirm": "hunter2hunter2"},
    follow_redirects=True,
)
check("register succeeds", r.status_code == 200 and b"dashboard" in r.request.path.encode())

# Dashboard now reachable
r = client.get("/dashboard")
check("dashboard 200 when signed in", r.status_code == 200)
check("dashboard empty state", b"No applications" in r.data or b"empty" in r.data.lower())

# Validation: missing full name
r = client.post(
    "/register",
    data={"email": "x@example.com", "name": "", "password": "hunter2hunter2", "confirm": "hunter2hunter2"},
)
check("missing name rejected", b"Full name is required" in r.data)

# Validation: bad email format
r = client.post(
    "/register",
    data={"email": "not-an-email", "name": "X", "password": "hunter2hunter2", "confirm": "hunter2hunter2"},
)
check("bad email format rejected", b"valid email address" in r.data)

# Validation: short password
r = client.post(
    "/register",
    data={"email": "x@example.com", "name": "X", "password": "short", "confirm": "short"},
)
check("short password rejected", b"at least 8" in r.data)

# Validation: mismatched confirm
r = client.post(
    "/register",
    data={"email": "x@example.com", "name": "X", "password": "hunter2hunter2", "confirm": "different123"},
)
check("password mismatch rejected", b"Passwords do not match" in r.data)

# Duplicate email
r = client.post(
    "/register",
    data={"email": "ada@example.com", "name": "Ada2", "password": "hunter2hunter2", "confirm": "hunter2hunter2"},
)
check("duplicate email rejected", b"already registered" in r.data)

# --- Create application ---------------------------------------------------
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

# Bad URL rejected
r = client.post(
    "/applications/new",
    data={"company": "Bad", "role": "Role", "url": "notaurl"},
)
check("bad URL rejected", b"http" in r.data)

# Stage not in list rejected
r = client.post(
    "/applications/new",
    data={"company": "Bad", "role": "Role", "stage": "Hired"},
)
check("invalid stage rejected", b"Invalid stage" in r.data)

# --- Dashboard stats & search --------------------------------------------
r = client.get("/dashboard")
check("stats show total 2", b"02" in r.data)

r = client.get("/dashboard?q=globex")
check("search finds Globex", b"Globex" in r.data)
check("search hides Acme", b"Acme Corp" not in r.data)

r = client.get("/dashboard?stage=Applied")
check("stage filter shows Acme", b"Acme Corp" in r.data)

r = client.get("/dashboard?stage=Offer")
check("stage filter empty for Offer", b"Acme Corp" not in r.data)

# --- Edit, stage switch, delete -------------------------------------------
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

db = hubdex.sqlite3.connect(hubdex.DATABASE)
row = db.execute("SELECT stage FROM applications WHERE id = 1").fetchone()
db.close()
check("stage persisted as Offer", row and row[0] == "Offer", f"got {row}")

# Another user cannot touch Ada's rows
client2 = hubdex.app.test_client()
client2.post(
    "/register",
    data={"email": "grace@example.com", "name": "Grace", "password": "hunter2hunter2", "confirm": "hunter2hunter2"},
)
r = client2.post("/applications/1/stage", data={"stage": "Rejected"})
check("cross user stage blocked", r.status_code == 404)

r = client2.get("/applications/1/edit")
check("cross user edit blocked", r.status_code == 404)

r = client2.post("/applications/1/delete")
check("cross user delete blocked", r.status_code == 404)

# --- Logout / login --------------------------------------------------------
r = client.post("/logout", follow_redirects=True)
check("logout redirects to login", r.status_code == 200 and b"Sign in" in r.data and b"login" in r.request.path.encode())

r = client.post(
    "/login",
    data={"email": "ada@example.com", "password": "wrongpassword"},
)
check("wrong password rejected", b"Incorrect" in r.data)

r = client.post(
    "/login?next=/dashboard",
    data={"email": "ada@example.com", "password": "hunter2hunter2"},
    follow_redirects=True,
)
check("login with next", r.status_code == 200 and b"Acme Corp" in r.data)

r = client.post("/applications/2/delete", follow_redirects=True)
check("delete application", r.status_code == 200 and b"Globex" not in r.data)

# --- No em dashes anywhere -------------------------------------------------
for page in ["/", "/login", "/register"]:
    r = client.get(page)
    check(f"no em dash on {page}", b"\xe2\x80\x94" not in r.data)

# Static assets exist
r = client.get("/static/css/theme.css")
check("theme.css served", r.status_code == 200)
r = client.get("/static/js/main.js")
check("main.js served", r.status_code == 200)
r = client.get("/static/logo.svg")
check("logo.svg served", r.status_code == 200)

db = hubdex.sqlite3.connect(hubdex.DATABASE)
row = db.execute(
    "SELECT email_verified FROM users WHERE email = 'ada@example.com'"
).fetchone()
db.close()
check("email_verified column present", row is not None and row[0] == 0, f"got {row}")

print()
if failures:
    print(f"FAILED ({len(failures)}): {', '.join(failures)}")
    sys.exit(1)
print("ALL CHECKS PASSED")
