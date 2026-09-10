# Hubdex

Hubdex is a job application tracker built with **Flask, Python, HTML/CSS, JavaScript, and SQL** (SQLite). It uses an IBM Carbon inspired visual theme: IBM Plex typography, Carbon blue, hairline grids, and sharp geometry.

## Features

- Register and sign in with hashed passwords (Werkzeug)
- Track applications across five stages: Wishlist, Applied, Interview, Offer, Rejected
- Priority levels, salary, location, job URL, applied date, and private notes
- Live stats: total, active, interviews, offers
- Clickable pipeline filter and full text search across company, role, location, and salary
- Inline stage switching directly in the table
- Per user data isolation: every query is scoped to the signed in user

## Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Backend   | Python 3, Flask               |
| Database  | SQLite via Python `sqlite3`   |
| Templates | Jinja2                        |
| Frontend  | HTML, CSS, vanilla JavaScript |
| Styling   | IBM Carbon inspired theme     |

## Run it

```bash
cd flask_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

The SQLite database (`hubdex.db`) is created automatically on first run.

## Project layout

```
flask_app/
├── app.py                  # Flask app, routes, SQLite schema
├── requirements.txt
├── templates/
│   ├── base.html           # Layout, header, footer, flashes
│   ├── landing.html        # Marketing page
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html      # Protected pipeline view
│   ├── application_form.html
│   └── 404.html
└── static/
    ├── css/theme.css       # Carbon inspired theme
    ├── js/main.js          # Flash dismissal, confirm dialogs
    └── logo.svg
```

## Security notes

- Passwords are stored as Werkzeug PBKDF2 hashes
- All queries use parameterized statements
- Jinja2 autoescaping is on for all templates
- Session cookies are signed with `HUBDEX_SECRET_KEY` (set it in production)
