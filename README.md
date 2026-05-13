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






This project is a high-fidelity JLPT Mock Test platform featuring a **FastAPI** backend and a **React (Vite)** frontend. It includes automated scoring, section-wise analysis, and audio integration.

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
├── backend/          # FastAPI Server
├── frontend/         # React + Vite Frontend
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
    python seed_final_test.py    # Seeds the final 27-question mock paper
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
If you add new audio files, place them in the `audio/` folder and copy them to `frontend/public/audio/` so the browser can serve them:
```bash
cp ../audio/*.mp4 ./public/audio/
```

---

## ✅ Features Implemented
*   **Mondai 1-3**: Complete Kanji, Grammar, Reading, and Listening sections.
*   **Instant Result**: Real-time scoring upon submission.
*   **Detailed Analysis**: Section-by-section performance breakdown.
*   **Premium UI**: Minimalist "Paper-style" Japanese exam aesthetic.
