# 🌿 Velora — AI-Powered Mental Wellness Companion for Gen Z

![Velora Banner](https://img.shields.io/badge/AI%20Mental%20Wellness-Gen%20Z%20Focused-purple?style=for-the-badge)

Velora is a modern AI-powered mental wellness platform designed specifically for Gen Z. It combines emotional support, AI conversations, journaling, mood tracking, meditation tools, wellness insights, and an anonymous community space into a single, beautiful experience.

Built with a focus on accessibility, privacy, and emotional well-being, Velora helps users better understand their emotions, build healthy habits, and develop long-term mental wellness practices.

---

## ✨ Features

### 🤖 AI Wellness Companion

* Real-time AI-powered conversations
* Empathetic and supportive responses
* Personalized emotional guidance
* Wellness recommendations based on user activity

### 📔 Smart Journaling

* Daily journal entries
* AI sentiment analysis
* Emotional trend tracking
* Personalized wellness insights

### 😊 Mood Tracking

* Track daily emotional states
* Visual mood history
* Progress analytics
* Wellness streak system

### 🧘 Meditation & Mindfulness

* Guided breathing exercises
* Meditation timer
* Relaxation sessions
* Focus enhancement activities

### 👥 Anonymous Community

* Safe anonymous discussions
* Mental wellness support groups
* Topic-based communities
* AI-assisted content moderation

### 🎯 Personalized Dashboard

* Mood analytics
* Wellness statistics
* Habit tracking
* Personalized recommendations

### 🎤 Voice Features

* Speech-to-Text support
* Text-to-Speech responses
* Voice-assisted wellness interactions

### 🔒 Secure Authentication

* JWT-based authentication
* Protected user data
* Secure session management
* Guest mode support

---

## 🛠️ Tech Stack

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![CRACO](https://img.shields.io/badge/CRACO-000000?style=for-the-badge)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge)

### Backend

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_AI-D97757?style=for-the-badge)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

### Database

![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-00ED64?style=for-the-badge&logo=mongodb&logoColor=white)

### Deployment

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-430098?style=for-the-badge&logo=render&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-00ED64?style=for-the-badge&logo=mongodb&logoColor=white)

---

## 📸 Application Modules

### Authentication

* User Registration
* Login System
* Guest Access

### Dashboard

* Mood Overview
* Wellness Score
* Activity Tracking

### AI Chat

* Mental wellness conversations
* Emotional support
* Personalized suggestions

### Journal

* Daily journaling
* Sentiment analysis
* Emotional insights

### Community

* Anonymous posting
* Reactions and engagement
* Community support rooms

### Resources

* Wellness articles
* Mental health resources
* Self-help guides

### Meditation

* Breathing exercises
* Guided mindfulness
* Focus sessions

---

## 🚀 Getting Started

### Prerequisites

* Node.js 20+
* Python 3.10+
* MongoDB Atlas Account
* Anthropic API Key
* OpenAI API Key

---

### Clone Repository

```bash
git clone https://github.com/Rajpatel2924/Velora.git

cd Velora
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm start
```

Runs on:

```bash
http://localhost:3000
```

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt
```

Create `.env`

```env
MONGO_URL=your_mongodb_connection_string
DB_NAME=velora

JWT_SECRET_KEY=your_secret_key

ANTHROPIC_API_KEY=your_anthropic_api_key

OPENAI_API_KEY=your_openai_api_key
```

Start backend:

```bash
uvicorn server:app --reload
```

Runs on:

```bash
http://localhost:8001
```

---

## 🌐 Environment Variables

### Backend

```env
MONGO_URL=
DB_NAME=

JWT_SECRET_KEY=

ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Frontend

```env
REACT_APP_BACKEND_URL=
```

---

## 📊 Project Architecture

```text
Velora
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── hooks
│   └── services
│
├── backend
│   ├── server.py
│   ├── ai_service.py
│   ├── community_service.py
│   ├── auth_utils.py
│   └── models.py
│
└── MongoDB Atlas
```

---

## 🎯 Vision

Mental health support should be accessible, affordable, and stigma-free.

Velora aims to become a trusted digital wellness companion that empowers Gen Z to:

* Understand emotions better
* Build healthier habits
* Practice mindfulness
* Connect with supportive communities
* Improve overall well-being

---

## 🔮 Future Roadmap

* AI Mood Forecasting
* Habit Recommendation Engine
* AI Wellness Coach
* Mobile Applications
* Therapist Discovery Integration
* Voice Journaling
* Community Reputation System
* Personalized Wellness Plans

---

## 🤝 Contributing

Contributions, ideas, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push changes
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Raj Patel**

Software Engineer | Full Stack Developer | AI Enthusiast

GitHub: https://github.com/Rajpatel2924
Live : https://velora-one-kappa.vercel.app/

---

⭐ If you found this project helpful, consider giving it a star and sharing it with others.
