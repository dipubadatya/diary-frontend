
# Diary

*A place to write, share, and connect.*

---

Diary is a social writing platform where people share thoughts, tell stories, discover books, save quotes, and have real conversations. This repository contains the frontend — built to feel fast, clean, and human on every screen.

---

## What it does

You open Diary and you can write. Share something personal, find a story that moves you, message someone whose words resonated. Everything happens in one place, in real time.

- Write and publish stories or personal thoughts
- Like, comment, and engage with the community
- Share favourite books and save memorable quotes
- Message other users with real-time delivery
- Upload images for your profile and stories
- Edit your profile and manage everything you've posted
- Works well on phone, tablet, and desktop

---

## Built with

| Layer | Tools |
|---|---|
| UI | React, TypeScript, Tailwind CSS |
| Bundler | Vite |
| Routing & State | React Router, Context API |
| API & Real-Time | Axios, Socket.IO Client |
| Forms & Validation | React Hook Form, Zod |

---

## Backend

The API lives in a separate repository.

**[diary-backend →](https://github.com/dipubadatya/diary-backend)**

Node.js · Express · TypeScript · MongoDB · Socket.IO

Handles authentication, story management, messaging, image uploads, and all REST endpoints the frontend depends on.

---

## Running it locally

You will need Node.js installed and the backend running separately.

**1. Clone and install**

```bash
git clone https://github.com/dipubadatya/diary-frontend.git
cd diary-frontend
npm install
```

**2. Set your environment**

Create a `.env` file at the project root.

```env
VITE_SERVER_URL=http://localhost:3000
```

Point this at wherever your backend is running.

**3. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Codebase at a glance

```
src/
├── assets/          static files, images, icons
├── components/      reusable UI pieces
├── contexts/        global state via Context API
├── pages/           one folder per route
├── services/        API calls, axios config
├── App.tsx
└── main.tsx
```

The structure follows a straightforward pattern. If you know where a feature lives in the UI, you can find its code in `pages/`. Anything shared across features lives in `components/`. Data fetching stays in `services/`.

---

## Status

Actively maintained. Features, fixes, and improvements go in regularly.

---

*Frontend for Diary — the backend is [here](https://github.com/dipubadatya/diary-backend).*