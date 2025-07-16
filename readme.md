# AnswerAI 📝✅

**Smart OMR Answer Sheet Detection System**  
Automatically grade answer sheets using computer vision with a FastAPI backend and a React Native mobile app.

![Demo](demo.gif) <!-- Replace with actual demo GIF or screenshot -->

---

## ✨ Features

- 🖼️ Scan or photograph answer sheets
- 🔍 Detect filled bubbles with 95%+ accuracy
- 🧠 Automatically grade and highlight correct/incorrect answers
- 📱 Clean and user-friendly mobile app (React Native + Expo)
- 🚀 Real-time grading with FastAPI backend
- 🐍 Python OpenCV-powered image processing

---

## 🗂️ Project Structure

```
answerAi/
├── backend/               # FastAPI server
│   ├── main.py            # Main FastAPI app
│   ├── requirements.txt   # Python dependencies
│   ├── test_images/       # Sample answer sheets for testing
│   └── debug/             # Output folder for marked images
│
├── answerAI-react-native/      # React Native (Expo) app
│   ├── lib/
│   │   └── api.ts         # API base URL config
│   ├── components/        # Reusable UI components
│   └── ...                # Expo project files
│
└── README.md              # This file
```

---
<a href="https://youtube.com/shorts/x7cvR746nHg?feature=shar">
  <img src="thumbnail.jpg" alt="Demo Video" width="480"/>
</a>


---

## 🐍 Backend Setup (FastAPI)

### 1. Create Virtual Environment

```bash
python3 -m venv venv

# Activate:

# On Windows:
.\venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 📱 Mobile App Setup (React Native + Expo)

```bash
cd answerAI-react-native

# Install dependencies
npm install
# or
yarn install
```

### 1. Configure API URL

Edit `lib/api.ts`:

```ts
export const API_URL = 'http://YOUR_LOCAL_IP:8000';
```

Replace `YOUR_LOCAL_IP` with the actual local IP where FastAPI is running.

### 2. Change correct_answers

Edit `App.tsx`:

```tsx
  const correctAnswers = {"Q1": "B", "Q2": "C" ...};
```

Replace `YOUR_LOCAL_IP` with the actual local IP where FastAPI is running.

### 2. Start Expo

```bash
npx expo start
```

---

## 🚀 Usage Guide

### Backend:

- Place test answer sheets into `backend/test_images/`
- Processed results will be saved into `backend/debug/`

**API Endpoints:**

- `POST /upload/` – Upload and process an answer sheet
- `GET /marked` – Retrieve the latest marked image

---

### Mobile App:

1. Tap **“Select Answer Sheet”** to choose or capture an image
2. Tap **“Grade Answers”** to process the sheet
3. View results with correct/incorrect markers

---

## ⚙️ Troubleshooting & Configuration

| Problem                   | Solution                                                        |
|---------------------------|-----------------------------------------------------------------|
| ❌ Bubbles not detected    | Adjust detection params in `main.py`, and check `debug/` output |
| 🌐 CORS errors (mobile)   | Ensure `API_URL` in `api.ts` matches backend server IP/port     |
| 📸 Blurry image           | Use higher quality input (at least 300dpi recommended)          |
| 🔒 Can't access from phone| Use `--host 0.0.0.0` when running FastAPI and use your local IP |

---

## 🤝 Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you'd like to change.

---

## 📜 License

MIT License – see `LICENSE` file for details.  
© 2024 ABEL SALIE
