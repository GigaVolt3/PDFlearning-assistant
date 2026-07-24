# Smart PDF Learning Assistant 🎓📄

An AI-powered, token-efficient document learning platform featuring integrated PDF.js canvas viewer, real-time pipeline status tracking, Groq 3-tier model failover manager, smart citations, and interactive study tools.

---

## ⚡ Quick Start (One-Click Launch)

Double-click [`run.bat`](file:///c:/discordbot/internship/ai%20pdf%20viewer/run.bat) in the project root folder.

This single batch script will automatically launch:
1. **Backend Server Engine**: Runs on `http://localhost:5000`
2. **React Vite Frontend**: Runs on `http://localhost:3000`

---

## 🛠️ Manual Launch Instructions

### 1. Backend Server Setup
```bash
cd server
npm install
npm run dev
```

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev
```

---

## 🔑 Environment Configuration
Add your free Groq API Key in [`server/.env`](file:///c:/discordbot/internship/ai%20pdf%20viewer/server/.env):
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

---

## 🌟 Key Architecture & Technical Interview Highlights

1. **Document Processing Engine**:
   - Converts PDFs to clean Markdown per page.
   - Live status pipeline streaming (`Uploading` → `Extracting text` → `Converting Markdown` → `Extracting images` → `Processing diagrams` → `Creating chunks` → `Ready`).

2. **Groq 3-Tier Model Resilient Fallback Manager**:
   - Fallback chain: `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` → `qwen/qwen3.6-27b`.
   - Automatically handles Rate Limit (HTTP 429) errors without dropping user context.

3. **Smart Citations & PDF Canvas Sync**:
   - Returns citation pills e.g. `✓ Page 18 (Confidence: High)`.
   - Clicking a citation pill updates the PDF viewer canvas to jump directly to that page.

4. **Study Tools**:
   - Chapter & document summaries, term definitions, categorized 2M/5M/10M exam questions, practice quiz with scoring, flashcards, and page notes.
