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

answerAi/
├── backend/ # FastAPI server
│ ├── main.py # Main FastAPI app
│ ├── requirements.txt # Python dependencies
│ ├── test_images/ # Sample answer sheets for testing
│ └── debug/ # Output folder for marked images
│
├── mobile/ # React Native (Expo) app
│ ├── lib/
│ │ └── api.ts # API base URL config
│ ├── components/ # Reusable UI components
│ └── ... # Expo project files
│
└── README.md # This file

yaml
Copy
Edit

---

## 🐍 Backend Setup (FastAPI)

### 1. Create Virtual Environment

```bash
python3 -m venv venv
2. Activate Environment
Windows:

bash
Copy
Edit
.\venv\Scripts\activate
Mac/Linux:

bash
Copy
Edit
source venv/bin/activate
3. Install Dependencies
bash
Copy
Edit
pip install -r requirements.txt
4. Run FastAPI Server
bash
Copy
Edit
uvicorn main:app --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs

📱 Mobile App Setup (React Native + Expo)
1. Navigate to the mobile folder
bash
Copy
Edit
cd answerAi/mobile
2. Install dependencies
bash
Copy
Edit
npm install
# or
yarn install
3. Configure API URL
Edit lib/api.ts:

ts
Copy
Edit
export const API_URL = 'http://YOUR_LOCAL_IP:8000';
// Replace with your actual IP and make sure FastAPI uses host 0.0.0.0
4. Run the app
bash
Copy
Edit
npx expo start
Scan the QR code with Expo Go

Or run on Android/iOS emulator

🚀 Usage Guide
Backend:
Put test images into test_images/

Processed results are saved into debug/

API Endpoints:
POST /upload/ – Process an uploaded answer sheet

GET /marked – View the latest marked image

Mobile App:
Select or capture an image of the answer sheet

Tap "Grade Answers"

Instantly see results with marked answers

⚙️ Configuration (in main.py)
python
Copy
Edit
BUBBLE_MIN_SIZE = 0.02          # 2% of image area
BUBBLE_MAX_SIZE = 0.15          # 15% of image area
THRESHOLD_SENSITIVITY = 0.6     # Bubble fill threshold
Tweak these to improve detection for your specific sheet format.

🛠️ Troubleshooting
Problem	Solution
❌ Bubbles not detected	Adjust detection params in main.py, check debug/ output
🌐 CORS errors (mobile)	Ensure API_URL in api.ts matches the backend IP + port
📸 Image too blurry	Use higher quality (300+ dpi) or better lighting
🔒 Network access issue	Use --host 0.0.0.0 and confirm device is on same LAN

🤝 Contributing
Pull requests are welcome!
For major changes, open an issue first to discuss the proposed update.

📜 License
MIT License – See LICENSE file for details.
© 2023 [Your Name]

🎓 Smart grading for the modern classroom.
yaml
Copy
Edit

---

Let me know if you want:
- An **MIT license template**
- A **`.env` setup** guide
- Or a **deployment-ready version** of this setup (e.g., with Docker or Railway)