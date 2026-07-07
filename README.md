<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&pause=1000&color=6366F1&background=00000000&center=true&vCenter=true&width=700&lines=CampusMind+AI;The+Global+Intelligent+Academic+Ecosystem;Empowering+Students+%26+Professionals" alt="Typing SVG" />
</div>

<div align="center">
  <h3>🎓 A unified, AI-driven academic and career acceleration platform 🎓</h3>
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="100">
</div>

---

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)

<h3 align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Structure</a>
</h3>

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 🚀 **About CampusMind AI**

CampusMind AI is a pioneering, fully integrated academic and career acceleration platform meticulously designed to redefine the traditional college journey. By leveraging cutting-edge advancements in **Agentic AI**, **Local Large Language Models (LLMs)**, and **Retrieval-Augmented Generation (RAG)**, the system acts as a personalized digital mentor for every student. It unifies disparate academic needs into a single, high-performance ecosystem.

### ✨ **Key Highlights**

- 📚 **Intelligent Learning** - RAG-based document chats to interact with study materials.
- 🤝 **Global Collaboration** - Skill-based peer matching and real-time WebRTC study rooms.
- 💼 **Career Catalyst** - AI-powered resume analyzer, job opportunity hunter, and mock interviews.
- 🎓 **Alumni Mentorship** - Continued ecosystem engagement via skill-graphs.
- 🔒 **Data Privacy** - Support for local AI inference (Ollama) ensures your data never leaves the system.

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

## 🎯 **Features**

<div align="center">

| Feature                   | Description                              |
| ------------------------- | ---------------------------------------- |
| 🧠 **AI Lecture Weaver**  | RAG module for smart document querying   |
| 🌐 **Global Peer Match**  | Connect with peers for group projects    |
| 💬 **Community Q&A**      | Gamified StackOverflow-style forum       |
| 📝 **Resume Analyser**    | AI-driven JD matching & ATS optimization |
| 🎯 **AI Mock Interviews** | Real-time AI interview simulations       |
| 🌙 **Dark Mode UI**       | Premium Framer Motion-enhanced interface |

</div>

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 🛠️ **Tech Stack**

<div align="center">

| Category            | Technologies                             |
| ------------------- | ---------------------------------------- |
| **Frontend**        | React, Vite, Tailwind CSS, Framer Motion |
| **Backend API**     | Node.js, Express.js                      |
| **AI Microservice** | Python, FastAPI, LangChain, LangGraph    |
| **Database**        | MongoDB (Mongoose), ChromaDB (Vector)    |
| **Realtime**        | Socket.io, WebRTC, Redis                 |
| **Media/Storage**   | Cloudinary                               |
| **AI Models**       | OpenAI, Gemini, Local Phi-3 via Ollama   |

</div>

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

## 📁 **Project Structure**

```text
CampusMind AI/
├── client/              # React + Vite frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server/              # Node.js/Express API (Auth, Uploads, WS)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── index.js
│   └── package.json
├── ai-service/          # Python/FastAPI Microservice (RAG, AI)
│   ├── app/
│   ├── requirements.txt
│   └── main.py
└── README.md
```

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## ⚙️ **Installation & Local Setup**

Follow these steps to run CampusMind AI locally.

### 1. Clone the repository

```bash
git clone https://github.com/Divyansh8843/CampusMind-AI.git
cd CampusMind-AI
```

### 2. Environment Variables

Copy the example environment files and fill in your details:

- `server/.env.example` -> `server/.env`
- `ai-service/.env.example` -> `ai-service/.env`
- `client/.env.example` -> `client/.env`

_For document uploads, configure Cloudinary in `server/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)._

### 3. Start Redis (Optional but recommended for caching)

Ensure Redis is running locally or use the provided `start_redis.bat` script.

### 4. Start the AI Microservice (`ai-service/`)

Choose your AI provider in `ai-service/.env` (`LLM_PROVIDER=openrouter`, `ollama`, `openai`, or `auto`). For local development with an OpenRouter free model:

- `LLM_PROVIDER=openrouter`
- `OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY`
- `OPENROUTER_MODEL=openai/gpt-oss-120b:free`
- `OPENROUTER_API_BASE=https://openrouter.ai/api/v1`

Free models have strict rate limits and are not suitable for a production launch. Use a paid model, configure provider fallbacks, and set deployment secrets in your hosting platform rather than committing them.

```bash
cd ai-service
pip install -r requirements.txt
python -m app.main
```

### 5. Start the Backend API (`server/`)

```bash
cd ../server
npm install
npm start
```

### 6. Start the Frontend (`client/`)

```bash
cd ../client
npm install
npm run dev
```

The platform should now be running. Navigate to the client URL (usually `http://localhost:5173`) in your browser.

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 🤝 **Contributing**

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <h3>🌟 Star this repository if you found it helpful! 🌟</h3>
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="Built with Love">
  <img src="https://forthebadge.com/images/badges/made-with-python.svg" alt="Made with Python">
  <br>
  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">
</div>
