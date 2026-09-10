"""
Hubdex: Job Application Tracker.

Flask + Python + HTML/CSS + JS with a SQLite (SQL) database.
IBM Carbon inspired visual language: IBM Plex typography, Carbon blue,
hairline grids, sharp geometry.
"""

import os
import re
import sqlite3
from datetime import date, timedelta
from functools import wraps

from flask import (
    Flask,
    abort,
    flash,
    g,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "hubdex.db")

STAGES = ["Wishlist", "Applied", "Interview", "Offer", "Rejected"]
PRIORITIES = ["High", "Medium", "Low"]

# Pragmatic email format check: something@something.tld with no spaces.
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

app = Flask(__name__)
app.secret_key = os.environ.get("HUBDEX_SECRET_KEY", "dev-key-change-me")

# Keep users signed in across browser restarts (30 days).
app.permanent_session_lifetime = timedelta(days=30)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL DEFAULT '',
    password_hash  TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company      TEXT NOT NULL,
    role         TEXT NOT NULL,
    location     TEXT NOT NULL DEFAULT '',
    salary       TEXT NOT NULL DEFAULT '',
    url          TEXT NOT NULL DEFAULT '',
    stage        TEXT NOT NULL DEFAULT 'Wishlist',
    priority     TEXT NOT NULL DEFAULT 'Medium',
    applied_date TEXT NOT NULL DEFAULT '',
    notes        TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_applications_user   ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage  ON applications(user_id, stage);
"""


def init_db():
    db = sqlite3.connect(DATABASE)
    db.executescript(SCHEMA)
    # Idempotent migration: add email_verified to databases created by
    # earlier versions of the app (CREATE TABLE IF NOT EXISTS will not).
    cols = [row[1] for row in db.execute("PRAGMA table_info(users)").fetchall()]
    if "email_verified" not in cols:
        db.execute(
            "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0"
        )
        db.commit()
    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def current_user():
    uid = session.get("user_id")
    if uid is None:
        return None
    return get_db().execute(
        "SELECT id, email, name FROM users WHERE id = ?", (uid,)
    ).fetchone()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            flash("Please sign in to open your hub.", "error")
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

LIMITS = {
    "company": 120,
    "role": 120,
    "location": 200,
    "salary": 100,
    "url": 500,
    "notes": 2000,
}


def clean_application(form):
    data = {}
    for field, limit in LIMITS.items():
        value = (form.get(field) or "").strip()
        if len(value) > limit:
            raise ValueError(f"{field.title()} is limited to {limit} characters.")
        data[field] = value

    data["applied_date"] = (form.get("applied_date") or "").strip()

    if not data["company"]:
        raise ValueError("Company is required.")
    if not data["role"]:
        raise ValueError("Role is required.")
    if data["url"] and not re.match(r"^https?://\S+$", data["url"]):
        raise ValueError("Job URL must start with http:// or https://.")
    if data["applied_date"]:
        try:
            date.fromisoformat(data["applied_date"])
        except ValueError:
            raise ValueError("Invalid applied date.")

    data["stage"] = form.get("stage") or "Wishlist"
    if data["stage"] not in STAGES:
        raise ValueError("Invalid stage.")
    data["priority"] = form.get("priority") or "Medium"
    if data["priority"] not in PRIORITIES:
        raise ValueError("Invalid priority.")
    return data


# ---------------------------------------------------------------------------
# Public pages
# ---------------------------------------------------------------------------

@app.route("/")
def landing():
    user = current_user()
    # The public marketing page is for signed-out visitors only; signed-in
    # users go straight to their dashboard.
    if user is not None:
        return redirect(url_for("dashboard"))
    demo_counts = [("Wishlist", 12), ("Applied", 34), ("Interview", 9),
                   ("Offer", 3), ("Rejected", 18)]
    features = [
        ("01", "Pipeline at a glance",
         "Track every opportunity across five stages, from wishlist to offer, "
         "with live counts and a searchable, sortable register of every application."),
        ("02", "Move rows, not tabs",
         "Promote a role the moment the recruiter calls. Inline stage switching "
         "updates your pipeline instantly, everywhere it's counted."),
        ("03", "Context that wins interviews",
         "Salary bands, locations, links to the posting, and private notes live "
         "next to each application, so you walk into every call prepared."),
        ("04", "Built for the long search",
         "Prioritize what matters, archive the noise, and keep months of job "
         "hunting organized in one fast, focused workspace."),
    ]
    steps = [
        ("Step 01", "Create your hub",
         "Register in seconds. Your workspace is ready instantly."),
        ("Step 02", "Log the role",
         "Company, title, salary, link, priority: thirty seconds, one form."),
        ("Step 03", "Work the pipeline",
         "Move stages inline as you hear back. Filters keep the register focused."),
        ("Step 04", "Read the signals",
         "Live stats show where effort converts, and where it doesn't."),
    ]
    return render_template(
        "landing.html", user=user, demo_counts=demo_counts,
        features=features, steps=steps, stages=STAGES,
    )


@app.route("/register", methods=["GET", "POST"])
def register():
    # Signed-in users are sent to their dashboard instead of the public
    # registration page.
    if request.method == "GET" and current_user() is not None:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        name = (request.form.get("name") or "").strip()[:100]
        password = request.form.get("password") or ""
        confirm = request.form.get("confirm") or ""

        if not name:
            flash("Full name is required.", "error")
        elif not email:
            flash("Email is required.", "error")
        elif not EMAIL_RE.match(email):
            flash("Enter a valid email address, like name@example.com.", "error")
        elif not password:
            flash("Password is required.", "error")
        elif not confirm:
            flash("Please confirm your password.", "error")
        elif len(password) < 8:
            flash("Password must be at least 8 characters.", "error")
        elif password != confirm:
            flash("Passwords do not match.", "error")
        else:
            db = get_db()
            # Duplicate check on the normalized email: never create a second
            # account for an email that already exists.
            existing = db.execute(
                "SELECT id FROM users WHERE email = ?", (email,)
            ).fetchone()
            if existing is not None:
                flash(
                    "An account with this email already exists. "
                    "Please sign in instead.",
                    "error",
                )
            else:
                try:
                    db.execute(
                        "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
                        (email, name, generate_password_hash(password)),
                    )
                    db.commit()
                except sqlite3.IntegrityError:
                    # Race fallback: another request created the same email.
                    flash(
                        "An account with this email already exists. "
                        "Please sign in instead.",
                        "error",
                    )
                else:
                    # Registration succeeds: show success and send the user
                    # to the sign-in page (no auto-login).
                    flash("Your account has been created. Please sign in.", "success")
                    return redirect(url_for("login"))
    return render_template("register.html", user=current_user())


@app.route("/login", methods=["GET", "POST"])
def login():
    # Signed-in users have no business on the sign-in page.
    if request.method == "GET" and current_user() is not None:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        row = get_db().execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()
        if row and check_password_hash(row["password_hash"], password):
            # Keep the user signed in across browser restarts.
            session.permanent = True
            session["user_id"] = row["id"]
            nxt = request.args.get("next") or request.form.get("next")
            if nxt and nxt.startswith("/") and not nxt.startswith("//"):
                return redirect(nxt)
            return redirect(url_for("dashboard"))
        flash("Invalid email or password.", "error")
    return render_template("login.html", user=current_user(),
                           next=request.args.get("next") or "")


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("Signed out. Good luck out there.", "success")
    return redirect(url_for("landing"))


# ---------------------------------------------------------------------------
# Dashboard (protected)
# ---------------------------------------------------------------------------

@app.route("/dashboard")
@login_required
def dashboard():
    user = current_user()
    db = get_db()
    search = (request.args.get("q") or "").strip()
    stage = request.args.get("stage") or "All"

    sql = "SELECT * FROM applications WHERE user_id = ?"
    params = [user["id"]]
    if stage in STAGES:
        sql += " AND stage = ?"
        params.append(stage)
    if search:
        sql += " AND (company LIKE ? OR role LIKE ? OR location LIKE ? OR salary LIKE ?)"
        like = f"%{search}%"
        params += [like, like, like, like]
    sql += " ORDER BY datetime(created_at) DESC"

    applications = db.execute(sql, params).fetchall()

    counts = {s: 0 for s in STAGES}
    total = db.execute(
        "SELECT COUNT(*) AS n FROM applications WHERE user_id = ?",
        (user["id"],),
    ).fetchone()["n"]
    for row in db.execute(
        "SELECT stage, COUNT(*) AS n FROM applications WHERE user_id = ? GROUP BY stage",
        (user["id"],),
    ):
        counts[row["stage"]] = row["n"]

    stats = {
        "total": total,
        "active": counts["Applied"] + counts["Interview"],
        "interviews": counts["Interview"],
        "offers": counts["Offer"],
        "by_stage": counts,
    }
    filters = {"q": search, "stage": stage}
    return render_template(
        "dashboard.html", user=user, applications=applications,
        stats=stats, counts=counts, filters=filters,
        stages=STAGES, priorities=PRIORITIES,
        editing=None,
    )


@app.route("/applications/new", methods=["GET", "POST"])
@login_required
def application_new():
    user = current_user()
    if request.method == "POST":
        try:
            data = clean_application(request.form)
        except ValueError as exc:
            flash(str(exc), "error")
        else:
            db = get_db()
            db.execute(
                """INSERT INTO applications
                   (user_id, company, role, location, salary, url,
                    stage, priority, applied_date, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (user["id"], data["company"], data["role"], data["location"],
                 data["salary"], data["url"], data["stage"],
                 data["priority"], data["applied_date"], data["notes"]),
            )
            db.commit()
            flash("Application added to your hub.", "success")
            return redirect(url_for("dashboard"))
    return render_template(
        "application_form.html", user=user, app_row=None,
        stages=STAGES, priorities=PRIORITIES,
    )


@app.route("/applications/<int:app_id>/edit", methods=["GET", "POST"])
@login_required
def application_edit(app_id):
    user = current_user()
    db = get_db()
    row = db.execute(
        "SELECT * FROM applications WHERE id = ? AND user_id = ?",
        (app_id, user["id"]),
    ).fetchone()
    if row is None:
        abort(404)
    if request.method == "POST":
        try:
            data = clean_application(request.form)
        except ValueError as exc:
            flash(str(exc), "error")
        else:
            db.execute(
                """UPDATE applications
                   SET company = ?, role = ?, location = ?, salary = ?,
                       url = ?, stage = ?, priority = ?, applied_date = ?,
                       notes = ?, updated_at = datetime('now')
                   WHERE id = ? AND user_id = ?""",
                (data["company"], data["role"], data["location"],
                 data["salary"], data["url"], data["stage"],
                 data["priority"], data["applied_date"], data["notes"],
                 app_id, user["id"]),
            )
            db.commit()
            flash("Application updated.", "success")
            return redirect(url_for("dashboard"))
    return render_template(
        "application_form.html", user=user, app_row=row,
        stages=STAGES, priorities=PRIORITIES,
    )


@app.route("/applications/<int:app_id>/stage", methods=["POST"])
@login_required
def application_stage(app_id):
    user = current_user()
    stage = request.form.get("stage") or ""
    if stage not in STAGES:
        abort(400)
    db = get_db()
    cur = db.execute(
        """UPDATE applications
           SET stage = ?, updated_at = datetime('now')
           WHERE id = ? AND user_id = ?""",
        (stage, app_id, user["id"]),
    )
    db.commit()
    if cur.rowcount == 0:
        abort(404)
    return redirect(request.referrer or url_for("dashboard"))


@app.route("/applications/<int:app_id>/delete", methods=["POST"])
@login_required
def application_delete(app_id):
    user = current_user()
    db = get_db()
    cur = db.execute(
        "DELETE FROM applications WHERE id = ? AND user_id = ?",
        (app_id, user["id"]),
    )
    db.commit()
    if cur.rowcount == 0:
        abort(404)
    flash("Application removed.", "success")
    return redirect(url_for("dashboard"))


@app.errorhandler(404)
def not_found(_exc):
    return render_template("404.html", user=current_user()), 404


init_db()

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
