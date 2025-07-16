# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
source venv\Scripts\activate kalsera just run this venv\Scripts\activate

# Install required packages
pip install fastapi uvicorn opencv-python numpy imutils python-multipart

# Start the server
uvicorn main:app --reload
