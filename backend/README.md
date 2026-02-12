# Backend Deployment Guide

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Required environment variables

- `PORT` (set by most hosting providers automatically)
- `MONGO_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `FRONTEND_URL` (comma-separated list allowed, for CORS)
- `APP_BASE_URL` (frontend base URL for reset-password links)
- `PUBLIC_SIGNUP_ENABLED` (`true` or `false`)

## Deploy checklist

1. Set all required environment variables in your hosting platform.
2. Use build command: `npm install`
3. Use start command: `npm start`
4. Confirm API responds at `/` after deploy.

## Notes

- Do not commit `.env` files.
- If credentials were ever committed or shared, rotate them before production use.
