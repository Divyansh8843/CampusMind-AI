<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&pause=1000&color=6366F1&background=00000000&center=true&vCenter=true&width=700&lines=CampusMind+AI;The+Global+Intelligent+Academic+Ecosystem;Empowering+Students+%26+Professionals;Deployed+on+AWS+EKS+at+Planet+Scale" alt="Typing SVG" />
</div>

<div align="center">
  <h3>🎓 A unified, AI-driven academic and career acceleration platform deployed on enterprise-grade cloud infrastructure 🎓</h3>
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="100">
</div>

---

<div align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="28"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="28"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" width="28"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="28"/> <img src="https://cdn.iconscout.com/icon/free/png-256/free-langchain-icon-svg-download-png-14426785.png?f=webp&w=128" width="28"/> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/500px-Google-gemini-icon.svg.png" width="28"/>  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Docker-svgrepo-com.svg/3840px-Docker-svgrepo-com.svg.png" width="28"/> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/960px-Kubernetes_logo_without_workmark.svg.png" width="28"/> <img src="https://www.svgrepo.com/show/331300/aws.svg" width="28"/>
</div>


<h3 align="center">
  <a href="#-about-campusmind-ai">About</a> •
  <a href="#-features">Features</a> •
  <a href="#-cloud-architecture">Architecture</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-installation--local-setup">Installation</a>
</h3>

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 🚀 **About CampusMind AI**

CampusMind AI is a pioneering, fully integrated academic and career acceleration platform meticulously designed to redefine the traditional college journey. By leveraging cutting-edge advancements in **Agentic AI**, **Local Large Language Models (LLMs)**, and **Retrieval-Augmented Generation (RAG)**, the system acts as a personalized digital mentor for every student. It unifies disparate academic needs into a single, high-performance ecosystem.

**The platform is deployed on production-grade cloud infrastructure using AWS EKS, with auto-scaling capable of handling 100,000+ concurrent users**, mirroring the same architecture used by industry leaders like Amazon and Flipkart.

### ✨ **Key Highlights**

- 📚 **Intelligent Learning** - RAG-based document chats to interact with study materials via a dedicated ChromaDB vector database.
- 🤝 **Global Collaboration** - Skill-based peer matching and real-time WebRTC study rooms.
- 💼 **Career Catalyst** - AI-powered resume analyzer, job opportunity hunter, and mock interviews.
- 🎓 **Alumni Mentorship** - Continued ecosystem engagement with verified alumni directory.
- 🔒 **Data Privacy** - Support for local AI inference (Ollama) ensures your data never leaves the system.
- ☁️ **Planet-Scale Infrastructure** - Auto-scaling Kubernetes cluster on AWS EKS, provisioned entirely via Terraform IaC.

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

## 🎯 **Features**

<div align="center">

| Feature                      | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| 🧠 **AI Lecture Weaver**     | RAG module for smart document querying (ChromaDB)    |
| 🌐 **Global Peer Match**     | Connect with peers for group projects via WebRTC     |
| 💬 **Community Q&A**         | Gamified StackOverflow-style forum with moderation   |
| 📝 **Resume Analyser**       | AI-driven JD matching & ATS optimization             |
| 🎯 **AI Mock Interviews**    | Real-time AI interview simulations with scoring      |
| 🛡️ **Enterprise Admin**      | 6-tab control center: Students, Alumni, Revenue, HPA |
| 💳 **Stripe Billing**        | Subscription management with webhook automation     |
| 📦 **AWS S3 File Storage**   | Encrypted document storage on Amazon S3             |
| 🌙 **Dark Mode UI**          | Premium Framer Motion-enhanced interface             |
| 📈 **Autoscaling (HPA)**     | Kubernetes scales 2→20 pods on CPU spike             |

</div>

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## ☁️ **Cloud Architecture**

CampusMind AI is deployed using a **production-grade, cloud-native microservice architecture** on AWS. Every component is provisioned and managed via Terraform Infrastructure-as-Code.

```
                           ┌─────────────────────┐
         Users ──────────▶ │   Amazon CloudFront  │  (Global Edge CDN + HTTPS API Gateway)
                           └──────────┬──────────┘
                                      │ /api/* forwarded
                    ┌─────────────────▼──────────────────┐
                    │    AWS Application Load Balancer    │
                    └─────────────────┬──────────────────┘
                                      │
          ┌───────────────────────────▼────────────────────────────┐
          │               AWS EKS Kubernetes Cluster                │
          │  ┌─────────────────────────────────────────────────┐   │
          │  │         server-deployment  (Node.js API)         │   │
          │  │  ┌──────────────┐  ┌──────────────┐             │   │
          │  │  │   Pod  1     │  │   Pod  2     │  ← HPA      │   │
          │  │  │  (always on) │  │  (always on) │  scales to  │   │
          │  │  └──────────────┘  └──────────────┘  20 pods    │   │
          │  └─────────────────────────────────────────────────┘   │
          │  ┌─────────────────────────────────────────────────┐   │
          │  │      ai-service-deployment  (Python FastAPI)     │   │
          │  │  ┌──────────────┐  ┌──────────────┐             │   │
          │  │  │   Pod  1     │  │   Pod  2     │  ← HPA      │   │
          │  │  │  (always on) │  │  (always on) │  scales to  │   │
          │  │  └──────────────┘  └──────────────┘  10 pods    │   │
          │  └─────────────────────────────────────────────────┘   │
          │  ┌─────────────────────────────────────────────────┐   │
          │  │         chromadb-0  (StatefulSet + EBS PVC)      │   │
          │  │         Persistent 10GB Vector Database          │   │
          │  └─────────────────────────────────────────────────┘   │
          └────────────────────────────────────────────────────────┘
                    │                                │
          ┌─────────▼──────────┐        ┌───────────▼───────────┐
          │ Amazon DocumentDB  │        │  Amazon S3 Bucket     │
          │ (MongoDB-compat.)  │        │  (File Storage)       │
          └────────────────────┘        └───────────────────────┘
```

### 🔑 **Architecture Decisions**

| Decision | Why |
|---|---|
| **CloudFront as API Gateway** | Solves Mixed Content (HTTP/HTTPS) errors; provides global Edge caching with zero cost |
| **EKS over plain EC2** | Self-healing pods, rolling deployments, zero-downtime updates |
| **ChromaDB as StatefulSet** | Guarantees vector data persistence across pod restarts via EBS PVC |
| **Kubernetes Secrets (`envFrom`)** | Decouples secrets from code; zero credentials in source control |
| **HPA (Horizontal Pod Autoscaler)** | Automatically scales Node.js 2→20 pods on 70% CPU; AI service 2→10 pods on 75% CPU |
| **Terraform IaC** | Entire infrastructure reproduced in minutes; no manual AWS console clicks |

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

## 🛠️ **Tech Stack**

<div align="center">

| Category                | Technologies                                              |
| ----------------------- | --------------------------------------------------------- |
| **Frontend**            | React 18, Vite, Tailwind CSS, Framer Motion               |
| **Backend API**         | Node.js, Express.js, JWT, Stripe, Nodemailer              |
| **AI Microservice**     | Python, FastAPI, LangChain, LangGraph, OpenRouter         |
| **Databases**           | MongoDB (DocumentDB), ChromaDB (Vector DB), Redis         |
| **File Storage**        | Amazon S3 (`@aws-sdk/client-s3`)                          |
| **Realtime**            | Socket.io, WebRTC                                         |
| **Containerization**    | Docker, Amazon ECR (Elastic Container Registry)           |
| **Orchestration**       | Kubernetes (AWS EKS), Helm, HPA, StatefulSet              |
| **Infrastructure**      | Terraform, AWS VPC, EKS, ALB, CloudFront, EBS CSI Driver  |
| **CI/CD**               | GitHub Actions (Build → Push ECR → Deploy EKS)            |
| **Monitoring**          | Kubernetes Metrics Server, `kubectl top pods`, Lens IDE   |
| **Payments**            | Stripe Subscriptions + Webhook Automation                 |

</div>

---

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 📁 **Project Structure**

```text
CampusMind AI/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # AdminDashboard, Chat, Interview, etc.
│   │   ├── components/       # Reusable UI components
│   │   └── services/         # API layer
│   └── vite.config.ts
│
├── server/                   # Node.js/Express API
│   ├── routes/               # auth, admin, upload, payment, chat...
│   ├── models/               # Mongoose schemas (User, Document, Job...)
│   ├── config/               # storage.js (S3), redis.js, db.js
│   └── server.js
│
├── ai-service/               # Python/FastAPI AI Microservice
│   ├── app/
│   │   ├── routes/           # /upload, /chat, /interview, /resume
│   │   └── services/         # LangChain RAG, LangGraph Agents
│   └── requirements.txt
│
├── infrastructure/           # Terraform Infrastructure as Code
│   ├── eks.tf                # EKS Cluster + Worker Node Groups
│   ├── vpc.tf                # VPC, Subnets, Security Groups
│   ├── frontend.tf           # S3 + CloudFront Distribution
│   ├── storage.tf            # S3 Backend Bucket
│   └── providers.tf          # AWS Provider Configuration
│
├── k8s/                      # Kubernetes Manifests
│   ├── server-deployment.yaml       # Node.js (2 replicas, HPA→20)
│   ├── ai-service-deployment.yaml   # Python FastAPI (2 replicas, HPA→10)
│   ├── chromadb.yaml                # StatefulSet + EBS StorageClass + PVC
│   ├── server-hpa.yaml              # HPA: CPU 70% threshold
│   └── ai-service-hpa.yaml         # HPA: CPU 75% threshold
│
└── .github/
    └── workflows/
        └── deploy.yml        # CI/CD: Build → ECR → EKS Rolling Update
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

Key variables for `server/.env`:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret_min_32_chars
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=your_s3_bucket_region
STRIPE_SECRET_KEY=your_stripe_key
```

### 3. Start Redis (Optional but recommended for caching)

Ensure Redis is running locally or use the provided `start_redis.bat` script.

### 4. Start the AI Microservice (`ai-service/`)

Choose your AI provider in `ai-service/.env` (`LLM_PROVIDER=openrouter`, `ollama`, `openai`, or `auto`).

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

## 🚢 **Production Deployment (AWS EKS)**

The entire infrastructure is managed via Terraform and deployed via GitHub Actions CI/CD.

### Prerequisites
- AWS CLI configured (`aws configure`)
- Terraform >= 1.3.0
- kubectl
- Docker

### Deploy Infrastructure

```bash
cd infrastructure
terraform init
terraform apply
```

### Sync Kubernetes Secrets (Run once after infrastructure is created)

```bash
kubectl create secret generic server-secrets --from-env-file=server/.env
kubectl create secret generic ai-secrets --from-env-file=ai-service/.env
```

### Deploy Application

```bash
# Push to main branch — GitHub Actions handles the rest automatically
git push origin main
```

### Daily Operations Runbook

```bash
# Check all pods are healthy
kubectl get pods

# Monitor CPU & RAM usage live
kubectl top pods

# Stream live application logs
kubectl logs -f deployment/server-deployment

# Check autoscaling status
kubectl get hpa

# Trace infrastructure events
kubectl get events --sort-by='.metadata.creationTimestamp' | tail -n 20
```

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
