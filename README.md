# BlogAPI

Full-stack blog project:

- **Backend:** Django + Django REST Framework (DRF)
- **Auth:** SimpleJWT + dj-rest-auth / django-allauth
- **Frontend:** React (Create React App) consuming the API via Axios

## Features

- Posts CRUD (author-only edit/delete)
- Categories + tags (many-to-many on posts)
- Likes (toggle)
- Comments (top-level + replies via `parent`)
- User profiles auto-created via Django signals
- Optional cover image upload via **Cloudinary from the frontend** (backend stores the resulting URL)

## Project Structure

- `blog_project/` – Django project (settings/urls/asgi/wsgi)
- `posts/` – Main API app (models, serializers, viewsets)
- `frontend/` – React app
- `db.sqlite3` – Default SQLite database for local dev
- `.env.example` – Example backend environment variables

## Requirements

- Python 3.11+ (works with Django 5.2)
- Node.js 18+ (for CRA tooling)

## Backend: Setup & Run (Django)

From the repo root:

1) Create and activate a virtual environment

Windows (PowerShell):

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2) Install dependencies

```bash
pip install -r requirements.txt
```

3) Configure environment (optional but recommended)

Copy `.env.example` to `.env` and set at least `SECRET_KEY`.

4) Run migrations and create an admin user

```bash
python manage.py migrate
python manage.py createsuperuser
```

5) Start the server

```bash
python manage.py runserver
```

Backend will be available at `http://127.0.0.1:8000/`.

### Backend environment variables

The backend loads `.env` from the repo root (via `python-dotenv`). See `.env.example`.

Common variables:

- `SECRET_KEY` – required for production
- `DEBUG` – `True`/`False`
- `ALLOWED_HOSTS` – comma-separated
- `CORS_ALLOW_ALL_ORIGINS` – defaults to `True` for development
- `ACCESS_TOKEN_MINUTES`, `REFRESH_TOKEN_DAYS` – JWT lifetime tuning

Database:

- Defaults to SQLite (`db.sqlite3`).
- For Postgres, set `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.

## Frontend: Setup & Run (React)

From the repo root:

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000/`.

### Frontend environment variables

The React app supports these variables (create `frontend/.env` if you want):

- `REACT_APP_API_URL` – API base URL (default: `http://127.0.0.1:8000`)
- `REACT_APP_CLOUDINARY_CLOUD_NAME` – optional; required only for image upload
- `REACT_APP_CLOUDINARY_UPLOAD_PRESET` – optional; required only for image upload

Example `frontend/.env`:

```dotenv
REACT_APP_API_URL=http://127.0.0.1:8000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

## API Overview

Base URL: `http://127.0.0.1:8000/api/v1/`

### Auth (JWT)

- `POST /api/v1/token/` – obtain `{access, refresh}`
- `POST /api/v1/token/refresh/` – refresh access token

Use the access token as:

- `Authorization: Bearer <access>`

### Auth (dj-rest-auth)

- `POST /api/v1/rest-auth/login/`
- `POST /api/v1/rest-auth/logout/`
- `GET /api/v1/rest-auth/user/`
- `POST /api/v1/rest-auth/registration/`

> The frontend tries SimpleJWT first, then falls back to `rest-auth/login`.

### Blog resources (DRF routers)

All endpoints below are under `/api/v1/`:

- `GET /posts/` – list posts
- `POST /posts/` – create a post (**auth required**)
- `GET /posts/{id}/` – retrieve
- `PUT/PATCH/DELETE /posts/{id}/` – update/delete (**author only**)

Custom post actions:

- `POST /posts/{id}/like/` – toggle like (**auth required**)
- `GET /posts/{id}/comments/` – list top-level comments
- `POST /posts/{id}/comments/` – create a comment (**auth required**)

Other resources:

- `/comments/` – comment CRUD (write restricted by author permission)
- `/categories/` – category CRUD
- `/tags/` – tag CRUD
- `/profiles/` – profile CRUD

### Post create payload

The backend expects `content` to be a string (HTML from the editor). Example:

```json
{
  "title": "Hello",
  "content": "<p>Rich text</p>",
  "excerpt": "Short summary",
  "cover_image": "https://.../image.jpg",
  "category_ids": [1, 2],
  "tag_ids": [3]
}
```

## Admin

- Django admin: `http://127.0.0.1:8000/admin/`

## Notes / Known Gaps

- `posts/tests.py` appears out of date versus the current `Post` model fields (it references `body`, while the model uses `content`). If you want, I can update the tests to match the current models.
- The React production build exists in `frontend/build/`, but Django is not currently configured to serve it automatically. Typical deployment is to host the React build separately (or add Django static serving for the build).
