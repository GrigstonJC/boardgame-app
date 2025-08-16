# Boardgame App

A web application for playing boardgames remotely with friends.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + TypeScript + Vite
- **Authentication**: Google OAuth (coming soon)
- **Hosting**: Google Cloud Platform (planned)
- **Package Management**: uv (Python), npm (JavaScript)

## Project Structure

```
boardgame_app/
├── backend/                 # FastAPI application
│   ├── app/
│   │   └── main.py         # Main FastAPI app
│   ├── pyproject.toml      # Python dependencies
│   └── uv.lock            # Locked dependencies
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   └── App.css        # Styling
│   ├── package.json       # Node dependencies
│   └── tsconfig.json      # TypeScript config
└── README.md              # This file
```

## Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- uv (Python package manager)
- npm (comes with Node.js)

### Backend Setup
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:5173

## Current Features

- ✅ FastAPI backend with CORS enabled
- ✅ React TypeScript frontend
- ✅ API communication between frontend and backend
- ✅ Basic UI with connection testing
- ✅ Error handling and loading states
- 🚧 Google OAuth authentication (in progress)
- 🚧 Game logic (planned)
- 🚧 Real-time multiplayer (planned)

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/info` - Public app information
- `GET /api/protected` - Protected endpoint (auth required)
- `GET /health` - Health check

## Next Steps

1. Implement Google OAuth authentication
2. Add user session management
3. Design and implement game logic
4. Add real-time multiplayer functionality
5. Deploy to Google Cloud Platform

## Development Notes

This project is being built as a learning exercise to understand:
- FastAPI for Python web APIs
- React + TypeScript for modern frontend development
- OAuth2 authentication flows
- Full-stack application architecture
- Cloud deployment with Google Cloud Platform
