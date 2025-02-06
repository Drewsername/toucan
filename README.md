---
title: FastAPI
description: A FastAPI server
tags:
  - fastapi
  - hypercorn
  - python
---

# FastAPI with Supabase Auth

A FastAPI backend with Supabase authentication integration.

## Features

- FastAPI
- Supabase Authentication
- Poetry for dependency management
- Uvicorn ASGI server
- Google OAuth integration

## Setup

1. Install Poetry if you haven't already:
```bash
pip install poetry
```

2. Install dependencies:
```bash
poetry install
```

3. Create a `.env` file with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:5173
```

## Development

1. Start the backend server:
```bash
poetry run uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

## Deployment

The project is configured for deployment on Railway. The `railway.json` file contains the necessary configuration.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/-NvLj4?referralCode=CRJ8FE)

## ✨ Features

- FastAPI
- [Hypercorn](https://hypercorn.readthedocs.io/)
- Python 3

## 💁‍♀️ How to use

- Clone locally and install packages with pip using `pip install -r requirements.txt`
- Run locally using `hypercorn main:app --reload`

## 📝 Notes

- To learn about how to use FastAPI with most of its features, you can visit the [FastAPI Documentation](https://fastapi.tiangolo.com/tutorial/)
- To learn about Hypercorn and how to configure it, read their [Documentation](https://hypercorn.readthedocs.io/)
