# CodeBase RAG

An AI-powered codebase assistant that uses **Retrieval-Augmented Generation (RAG)** to understand and answer questions about GitHub repositories.

The application ingests a repository, processes its source code, generates embeddings, stores them in a vector database, and uses semantic retrieval to provide relevant answers about the codebase.

## 🚀 Live Demo

[CodeBase RAG](https://main.d1j71r2hhqttrr.amplifyapp.com)

---

## ✨ Features

- 🔗 **GitHub Repository Ingestion** — Import repositories for analysis
- 📂 **Source Code Extraction** — Extract and process relevant project files
- ✂️ **Code Chunking** — Split source code into meaningful chunks for retrieval
- 🧠 **OpenAI Embeddings** — Convert code chunks into vector embeddings
- 🔎 **Semantic Search** — Retrieve the most relevant code using vector similarity
- 💬 **AI Codebase Q&A** — Ask natural-language questions about the repository
- ⚡ **Asynchronous Processing** — Use Amazon SQS for background repository processing
- 🪣 **S3 Storage** — Store uploaded repository data in Amazon S3
- 🔐 **Secure Secrets** — Store application secrets using AWS Systems Manager Parameter Store
- 📊 **CloudWatch Logging** — Monitor backend API and worker processes
- 🔒 **HTTPS** — Secure communication using Let's Encrypt
- 🛡️ **CORS Protection** — API requests restricted to the production frontend
- 👤 **Authentication** — Supabase authentication for application access

---

## 🏗️ Architecture

```text
                         GitHub Repository
                                │
                                ▼
                     ┌─────────────────────┐
                     │   AWS Amplify       │
                     │   React Frontend    │
                     └──────────┬──────────┘
                                │ HTTPS
                                ▼
                     ┌─────────────────────┐
                     │   EC2 Instance      │
                     │                     │
                     │      Nginx          │
                     │        │            │
                     │        ▼            │
                     │   Express API       │
                     │      :3000          │
                     └───────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         Amazon SQS       Amazon S3       SSM
              │              │              │
              ▼              │              │
       Background Worker     │              │
              │              │              │
              └──────┬───────┘              │
                     │                      │
                     ▼                      │
              ┌──────────────┐              │
              │   Supabase   │◄─────────────┘
              │ PostgreSQL   │
              │   + pgvector │
              └──────┬───────┘
                     │
                     ▼
              OpenAI API
```

### Infrastructure

- **Frontend:** AWS Amplify
- **Backend:** Amazon EC2
- **Reverse Proxy:** Nginx
- **Queue:** Amazon SQS
- **Object Storage:** Amazon S3
- **Secrets:** AWS Systems Manager Parameter Store
- **Database:** Supabase PostgreSQL
- **Vector Search:** pgvector
- **AI:** OpenAI
- **Monitoring:** Amazon CloudWatch
- **SSL:** Let's Encrypt

---

## 🧠 How It Works

### 1. Repository Ingestion

A user provides a GitHub repository to the application.

The backend downloads and processes the repository while filtering out irrelevant files such as dependencies and generated content.

### 2. Code Extraction and Chunking

Source files are extracted and divided into smaller chunks.

Each chunk retains useful context such as the file path and source code content.

### 3. Embedding Generation

Each code chunk is converted into a numerical vector using OpenAI's embedding model.

These vectors allow the system to perform semantic similarity searches instead of relying only on keyword matching.

### 4. Vector Storage

The generated embeddings and their associated code chunks are stored in **Supabase PostgreSQL using pgvector**.

### 5. Asynchronous Processing

Repository processing is handled asynchronously using **Amazon SQS**.

This prevents long-running processing tasks from blocking the main API request and allows the worker to process repositories independently.

### 6. RAG Query

When a user asks a question:

```text
User Question
      ↓
Generate Query Embedding
      ↓
Vector Similarity Search
      ↓
Retrieve Relevant Code
      ↓
Build Context
      ↓
Send Context + Question to LLM
      ↓
Generate Answer
```

The retrieved code is provided as context to the language model, allowing the model to answer questions using information from the actual repository.

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- REST APIs
- PM2

### AI / RAG

- OpenAI API
- OpenAI Embeddings
- Retrieval-Augmented Generation
- Vector Similarity Search

### Database

- Supabase
- PostgreSQL
- pgvector
- Supabase Authentication

### AWS

- Amazon EC2
- Amazon S3
- Amazon SQS
- AWS Systems Manager Parameter Store
- Amazon CloudWatch
- AWS Amplify
- AWS IAM

### Infrastructure

- Nginx
- Let's Encrypt
- HTTPS

---

## 📁 Project Structure

```text
RAG-Codebase-AWS/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── workers/
│   ├── temp/
│   ├── server.js
│   └── package.json
│
├── README.md
└── ...
```

---

## 💻 Local Development

### Prerequisites

- Node.js
- npm
- Git
- Supabase project
- OpenAI API key

### Clone the repository

```bash
git clone https://github.com/mhw3011/RAG-Codebase-AWS.git
cd RAG-Codebase-AWS
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs on:

```text
http://localhost:3000
```

> **Important:** Never commit API keys, Supabase service-role keys, `.env` files, private keys, or other credentials to GitHub.

---

## ☁️ Production Deployment

The production application uses AWS services for hosting, processing, storage, secrets, and monitoring.

### Frontend

The React application is built using Vite and deployed through **AWS Amplify**.

```text
GitHub
   ↓
AWS Amplify
   ↓
React Production Build
```

### Backend

The Node.js/Express backend runs on an **Amazon EC2 t3.micro instance**.

Nginx acts as the public-facing reverse proxy:

```text
Internet
   ↓
HTTPS :443
   ↓
Nginx
   ↓
Express :3000
```

Port `3000` is not publicly exposed.

### Background Processing

Long-running repository processing tasks are sent to Amazon SQS.

A worker consumes messages from the queue and performs repository processing independently of the API server.

---

## 🔐 Security

Several security measures are implemented in the production environment.

- HTTPS enabled using Let's Encrypt
- Automatic certificate renewal configured
- Backend port `3000` is not publicly exposed
- Frontend development port `5173` is not publicly exposed
- SSH access restricted to a specific IP address
- CORS restricted to the production Amplify frontend
- Secrets stored in AWS Systems Manager Parameter Store
- EC2 uses an IAM role instead of long-lived AWS credentials
- S3 buckets are private
- S3 Block Public Access is enabled
- S3 server-side encryption is enabled
- Supabase service-role credentials remain backend-only
- Sensitive files are excluded from Git tracking

---

## 🔑 Environment Variables

### Frontend

```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend

Backend secrets are loaded from **AWS Systems Manager Parameter Store** in production.

```text
OPENAI_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Production secrets are not stored directly inside the source code.

---

## 🧩 Key Design Decisions

### Why RAG?

Instead of sending an entire repository to an LLM, the application retrieves only the code relevant to the user's question.

This reduces unnecessary context and allows the system to work with larger codebases.

### Why Vector Search?

Traditional keyword search can miss semantically related code.

Vector embeddings allow the application to retrieve code based on meaning and context.

### Why SQS?

Repository processing can take significantly longer than a normal API request.

Using SQS separates the API from background processing and makes the system more resilient.

### Why S3?

S3 provides durable object storage for repository data without relying on the EC2 filesystem as the primary storage layer.

### Why SSM Parameter Store?

Secrets are kept outside the source code and can be loaded securely by the EC2 instance through its IAM role.

---

## 📈 Future Improvements

Potential future improvements include:

- Streaming AI responses
- Improved code-aware chunking
- Conversation history
- Improved retrieval and reranking
- Automated CI/CD deployment
- Infrastructure as Code using Terraform or AWS CDK
- Support for larger repositories

---

## 👨‍💻 Author

**Munauvar Warsi**

- GitHub: [mhw3011](https://github.com/mhw3011)

---

## 📄 License

This project is intended as a personal/portfolio project.
