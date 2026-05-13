# 🇯🇵 JLPT Mock Test Platform - Setup Guide
*Teacher side*
<img width="313" height="447" alt="image" src="https://github.com/user-attachments/assets/1a5ca3e9-ce7e-46c1-92f6-ecad2782d756" />
<img width="1865" height="929" alt="image" src="https://github.com/user-attachments/assets/c0640d7f-ee1b-4cd0-bc2e-13c5c879787e" />
<img width="1377" height="873" alt="image" src="https://github.com/user-attachments/assets/565384ad-2cec-477e-955a-5c0110079f14" />
<img width="1227" height="712" alt="image" src="https://github.com/user-attachments/assets/9ec42631-0669-4a37-9bfe-733dc60b55aa" />

*Student Side*
<img width="295" height="439" alt="image" src="https://github.com/user-attachments/assets/774892f0-bc23-4b26-b396-8ac71bae4e9b" />
<img width="1450" height="929" alt="image" src="https://github.com/user-attachments/assets/9949bc43-f288-491f-9368-9e54a8715277" />
<img width="673" height="473" alt="image" src="https://github.com/user-attachments/assets/c6581612-36e3-4c32-976d-44b7f8db8d54" />
<img width="629" height="613" alt="image" src="https://github.com/user-attachments/assets/711baab3-d834-462f-9d85-ad36e4a8ef19" />
<img width="226" height="291" alt="image" src="https://github.com/user-attachments/assets/f3699499-06d2-410c-8946-0fff42bf65a3" />





This project is a professional-grade JLPT Mock Test platform featuring a **FastAPI** backend and a **React (Vite)** frontend. It is designed for high-performance testing environments with a focus on realism and detailed student feedback.

---

## 🌟 What's New (V2.0 Update)
*   **🤖 AI-Powered Listening**: Integrated Google Text-to-Speech (gTTS) for dynamic audio generation. Teachers can now generate high-quality Japanese audio directly from text scripts for listening sections.
*   **📊 Advanced Performance Analytics**: Detailed section-by-section breakdown (Vocabulary, Grammar, Reading, Listening) to help students identify their weak points.
*   **☁️ Production-Ready Deployment**: Configured with robust CORS policies and environment-aware database pooling for seamless deployment on **Render** (Backend) and **Vercel** (Frontend).
*   **🛠️ Hardened Backend**: Implemented global exception handling, database retry logic, and automated seeding for improved development workflow and production stability.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
*   **Python 3.10+**
*   **Node.js (v18+) & npm**
*   **PostgreSQL** (Running locally with a database named `jlpt_n4_db` or as configured in `.env`)

---

## 📂 Project Structure
```text
jlpt-platform/
├── backend/          # FastAPI Server (Python)
├── frontend/         # React + Vite Frontend (JS/JSX)
└── audio/            # Source Audio Files
```

---

## 🚀 Backend Setup

1.  **Navigate to backend directory**:
    ```bash
    cd backend
    ```

2.  **Create and Activate Virtual Environment**:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment**:
    Open `.env` and update your PostgreSQL credentials:
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/jlpt_n4_db
    ```

5.  **Initialize & Seed Database**:
    ```bash
    python init_db.py           # Creates tables
    python seed_final_test.py    # Seeds the final mock paper
    ```

6.  **Run the Server**:
    ```bash
    python -m uvicorn app.main:app --reload
    ```
    *The API will be available at `http://localhost:8000`*

---

## 🎨 Frontend Setup

1.  **Navigate to frontend directory**:
    ```bash
    cd ../frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    *The App will be available at `http://localhost:5173`*

---

## 🎧 Audio Assets
If you add new audio files, place them in the `audio/` folder or use the integrated **AI Audio Generator** in the teacher panel. For manual files:
```bash
cp ../audio/*.mp4 ./public/audio/
```

---

## ✅ Features Implemented
*   **📚 Complete Exam Coverage**: Mondai 1-3 covering Kanji, Grammar, Reading, and Listening.
*   **🔊 AI Listening Sections**: Realistic listening comprehension powered by AI speech synthesis.
*   **⚡ Instant Result**: Real-time scoring upon submission with session persistence.
*   **📉 In-Depth Analysis**: Interactive graphs and section-wise performance breakdowns.
*   **💎 Premium UI**: Modern "Navy/Indigo" corporate aesthetic tailored for professional Japanese training.
*   **🔒 Secure Auth**: JWT-based authentication for both learners and teachers.

