
# Vox Mundi  
**A Cultural Tracking Hub connecting global traditions, languages, and timelines**  

[Live Demo](https://vox-mundi.vercel.app) • [Backend API](https://vox-mundi-backend.up.railway.app) • [Frontend Repo](https://github.com/yourusername/vox-mundi-frontend) • [Backend Repo](https://github.com/yourusername/vox-mundi-backend)

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![Neon](https://img.shields.io/badge/Neon-3366CC?style=for-the-badge&logo=neon&logoColor=white)](https://neon.tech)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

---

## Overview

**Vox Mundi** is an **interactive, full-stack cultural knowledge platform** that bridges ancient civilizations with modern digital architecture. Users explore, document, and visualize global traditions — from mythologies and calendars to art, literature, and shared human timelines.

This project showcases **end-to-end software engineering**:
- Modern **Next.js 14 (App Router)** with SSR/ISR
- Scalable **Django REST API** with complex relational models
- **Serverless PostgreSQL** on Neon
- **Zero-downtime CI/CD** via Vercel + Railway
- Thoughtful **UX, design systems, and cross-cultural data modeling**

---

## Live Demo

| Service       | URL |
|---------------|-----|
| **Frontend**  | [https://vox-mundi.vercel.app](https://vox-mundi.vercel.app) |
| **Backend API** | [https://vox-mundi-backend.up.railway.app](https://vox-mundi-backend.up.railway.app) |
| **Database**  | Neon Serverless PostgreSQL |

---

## Tech Stack

| Layer       | Technology | Purpose |
|------------|-----------|--------|
| **Frontend** | **Next.js 14 (App Router)** | SSR, ISR, optimized routing |
|            | **Tailwind CSS + shadcn/ui** | Responsive, animated UI |
|            | **Framer Motion** | Smooth transitions & micro-interactions |
| **Backend**  | **Django REST Framework** | Secure, scalable REST API |
|            | **Custom JWT Auth** | User sessions & permissions |
| **Database** | **PostgreSQL (Neon)** | Serverless, auto-scaling |
| **Hosting**  | **Vercel** | Frontend CI/CD & edge delivery |
|            | **Railway** | Django auto-deploy with gunicorn |
| **Extras**   | `whitenoise`, `CORS`, `dj-database-url` | Production middleware |

---

## System Architecture

```mermaid
graph TD
    A[User Browser] -->|HTTPS| B(Vercel - Next.js)
    B -->|fetch| C(Railway - Django API)
    C -->|SQL| D(Neon PostgreSQL)
    style A fill:#f9f,stroke:#333
    style B fill:#000,color:#fff
    style C fill:#131415,color:#fff
    style D fill:#3366CC,color:#fff
```

- **All traffic over HTTPS**
- **CORS configured for production**
- **Environment-aware `.env` switching**
- **Zero-downtime deploys**

---

## Key Features

| Feature | Description |
|-------|------------|
| **Culture Management** | CRUD for civilizations, languages, artifacts |
| **Interactive Mapping** | Visual pins with date ranges and media |
| **Multi-Calendar Timelines** | Gregorian, Lunar, BCE/CE support |
| **Media Integration** | OpenLibrary, art, literature models |
| **Smart Date Logic** | Dynamic era estimation via relationships |
| **Responsive Design** | Mobile-first, animated modals & cards |

---

## Technical Highlights

- **Dynamic Date Models** — Handles BCE/CE, uncertain eras, and calendar conversion
- **Complex DRF View, Serializers & Models** — Deep relationships between cultures, people, and events
- **React Hook Patterns** — API caching, modular fetching, optimistic UI
- **Production Ready** — Gunicorn, Whitenoise, CORS, JWT, health checks

---

## Local Development Setup

### 1. Clone Repos

```bash
git clone https://github.com/yourusername/vox-mundi-frontend.git
git clone https://github.com/yourusername/vox-mundi-backend.git
```

### 2. Backend (Django)

```bash
cd vox-mundi-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend (Next.js)

```bash
cd vox-mundi-frontend
npm install
npm run dev
```

**Visit:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Environment Variables

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Backend `.env`
```env
DEBUG=True
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=postgres://user:pass@ep-cool-name.neon.tech/dbname?sslmode=require
ALLOWED_HOSTS=localhost,127.0.0.1
```
_NOTE: you will need to be have TMDB Keys/Tokens, OpenLibrary Keys, and Google Search API Keys for the importing features to work properly as well_

---

## Deployment Summary

| Component | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [vox-mundi.vercel.app](https://vox-mundi.vercel.app) |
| Backend | Railway | [vox-mundi-backend.up.railway.app](https://vox-mundi-backend.up.railway.app) |
| Database | Neon | Serverless PostgreSQL |

---

## Testing

```bash
# Django
python manage.py test

# Frontend (if using Jest/React Testing Library)
npm run test
```

---

## Roadmap

- [ ] Multilingual content & UI
- [ ] Multiple calendar conversion
- [ ] Public API for researchers

---

## Preview

![Vox Mundi Preview](https://via.placeholder.com/800x450.png?text=Vox+Mundi+Timeline+Explorer)  
*Interactive timeline, animated modals, and culture cards*

---

## Author

**Matthew Rayner**  
[Portfolio](https://matthewjrayner.github.io) • raynerjmatthew@gmail.com • [LinkedIn](https://linkedin.com/in/matthew_rayner)

> *"Vox Mundi reflects my passion for bridging design, history, and technology — building systems that make human knowledge more accessible and meaningful."*

---

## Repository Structure

```
/vox-mundi-frontend
 ├─ app/              ← Next.js 14 App Router
 ├─ components/       ← Reusable UI
 ├─ lib/              ← API hooks, utils
 ├─ public/           ← Static assets
 └─ README.md

/vox-mundi-backend
 ├─ core/             ← Main app (models, serializers)
 ├─ voxmundi/         ← Project settings
 ├─ manage.py
 ├─ requirements.txt
 └─ README.md
```

---

## Employer Takeaway

**This project proves production-grade skills in:**

| Skill | Demonstrated By |
|------|-----------------|
| **Full-Stack Architecture** | Next.js + Django + PostgreSQL |
| **API Design** | Nested serializers, JWT, CORS |
| **Database Mastery** | Complex migrations, `RunSQL`, Neon |
| **Cloud Deployment** | Vercel, Railway, CI/CD |
| **UX & Design Systems** | Tailwind, shadcn, Framer Motion |
| **Scalability & Reliability** | Serverless DB, health checks, timeouts |

---

**Ready to build the next cultural archive? Let’s talk.**

---

*Built with passion, precision, and a love for human stories.*