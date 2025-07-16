from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import os
from typing import List, Tuple
import math

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def auto_rotate_image(image: np.ndarray) -> np.ndarray:
    """Automatically detect and correct image orientation"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
    
    if lines is None:
        return image
    
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
        angles.append(angle)
    
    median_angle = np.median(angles)
    if abs(median_angle) > 5:  # Only rotate if significant tilt / adjust madreg tchilaleh for better result
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated
    return image

def enhanced_bubble_detection(image: np.ndarray) -> List[np.ndarray]:
    """
    Improved bubble detection with better preprocessing and contour filtering
    Returns list of bubble contours
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Enhanced preprocessing
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Use adaptive thresholding with automatic block size
    height, width = gray.shape
    block_size = int(min(height, width) / 20) | 1  # Ensure odd number
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY_INV, block_size, 3)
    
    # Morphological operations to clean up
    kernel = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # Find contours
    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    bubble_contours = []
    
    for c in contours:
        (x, y, w, h) = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        perimeter = cv2.arcLength(c, True)
        
        # Skip very small contours /
        if area < 50:
            continue
            
        # Calculate circularity (4*pi*area/perimeter^2)
        if perimeter > 0:
            circularity = 4 * math.pi * area / (perimeter * perimeter)
        else:
            circularity = 0
        
        # Aspect ratio
        aspect_ratio = w / float(h)
        
        # Adjusted detection parameters
        min_dim = min(image.shape[:2])
        min_size = min_dim * 0.02  # 2% of image height/width 
        max_size = min_dim * 0.15  # 15% of image height/width
        
        # Bubble detection conditions
        if (min_size < w < max_size and
            min_size < h < max_size and
            0.7 < aspect_ratio < 1.3 and  # More strict aspect ratio
            circularity > 0.6 and         # More circular
            area > 100):                  # Minimum area
            
            bubble_contours.append(c)
    
    # Debug visualization
    debug_img = image.copy()
    cv2.drawContours(debug_img, bubble_contours, -1, (0, 255, 0), 2)
    debug_save(debug_img, "4_detected_bubbles")
    
    return bubble_contours


def debug_save(image: np.ndarray, name: str):
    """Helper function to save intermediate images for debugging"""
    if not os.path.exists("debug"):
        os.makedirs("debug")
    cv2.imwrite(f"debug/{name}.jpg", image)

def adaptive_preprocess(image: np.ndarray) -> np.ndarray:
    """Enhanced preprocessing that adapts to different lighting conditions"""
    # Convert to grayscale and equalize histogram
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    equalized = clahe.apply(gray)
    
    # Adaptive thresholding with automatic block size
    height, width = equalized.shape
    block_size = int(min(height, width) / 40) | 1  # Ensure odd number
    thresh = cv2.adaptiveThreshold(equalized, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                  cv2.THRESH_BINARY_INV, block_size, 5)
    
    # Morphological operations to clean up
    kernel = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    debug_save(cleaned, "1_preprocessed")
    return cleaned

def find_document_contour(image: np.ndarray) -> np.ndarray:
    """Find the largest rectangular contour in the image"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blur, 30, 150)
    
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
    
    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        
        if len(approx) == 4:
            debug_save(cv2.drawContours(image.copy(), [approx], -1, (0, 255, 0), 3), "2_document_contour")
            return approx
    
    return None

def perspective_transform(image: np.ndarray, contour: np.ndarray) -> np.ndarray:
    """Apply perspective transform to get a top-down view"""
    # Order points: top-left, top-right, bottom-right, bottom-left
    rect = order_points(contour.reshape(4, 2))
    (tl, tr, br, bl) = rect
    
    # Compute the width and height of the new image
    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b))
    
    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b))
    
    # Destination points for transform
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]], dtype="float32")
    
    # Compute perspective transform and apply it
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height))
    
    debug_save(warped, "3_perspective_transformed")
    return warped

def order_points(pts: np.ndarray) -> np.ndarray:
    """Arrange points in consistent order: top-left, top-right, bottom-right, bottom-left"""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left has smallest sum
    rect[2] = pts[np.argmax(s)]  # bottom-right has largest sum
    
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right has smallest difference
    rect[3] = pts[np.argmax(diff)]  # bottom-left has largest difference
    
    return rect

def group_bubbles(contours: List[np.ndarray], image_shape: Tuple[int, int]) -> List[List[np.ndarray]]:
    """Group bubbles into rows and sort them left to right"""
    if not contours:
        return []
    
    # Get bounding boxes and sort top to bottom
    boxes = [cv2.boundingRect(c) for c in contours]
    sorted_contours = [c for _, c in sorted(zip(boxes, contours), key=lambda x: x[0][1])]
    boxes = sorted(boxes, key=lambda x: x[1])
    
    # Calculate row height threshold (average height * 1.5)
    avg_height = np.mean([h for (x, y, w, h) in boxes])
    row_threshold = avg_height * 1.5
    
    # Group into rows
    rows = []
    current_row = []
    y_prev = boxes[0][1]
    
    for i, (x, y, w, h) in enumerate(boxes):
        if abs(y - y_prev) > row_threshold:
            if current_row:
                rows.append(current_row)
            current_row = []
        current_row.append(sorted_contours[i])
        y_prev = y
    
    if current_row:
        rows.append(current_row)
    
    # Sort each row left to right
    sorted_rows = []
    for row in rows:
        row_boxes = [cv2.boundingRect(c) for c in row]
        sorted_row = [c for _, c in sorted(zip(row_boxes, row), key=lambda x: x[0][0])]
        sorted_rows.append(sorted_row)
    
    return sorted_rows

def analyze_bubbles(image: np.ndarray, grouped_bubbles: List[List[np.ndarray]]) -> Tuple[dict, np.ndarray]:
    """Analyze which bubbles are filled and return results"""
    processed = adaptive_preprocess(image)
    marked_image = image.copy()
    answers = {}
    choices = ['A', 'B', 'C', 'D', 'E']
    
    for q_num, row in enumerate(grouped_bubbles, 1):
        if len(row) != len(choices):
            answers[f"Q{q_num}"] = "?"
            continue
        
        fill_values = []
        for bubble in row:
            mask = np.zeros_like(processed)
            cv2.drawContours(mask, [bubble], -1, 255, -1)
            filled_pixels = cv2.countNonZero(cv2.bitwise_and(processed, processed, mask=mask))
            fill_values.append(filled_pixels)
        
        # Normalize fill values (0-100 scale)
        min_fill = min(fill_values)
        max_fill = max(fill_values)
        range_fill = max_fill - min_fill if max_fill != min_fill else 1
        
        normalized_fills = [(fv - min_fill) / range_fill * 100 for fv in fill_values]
        
        # Determine selected answer (threshold at 50% fill)
        selected = None
        for i, fill in enumerate(normalized_fills):
            if fill > 50:
                selected = choices[i]
                cv2.drawContours(marked_image, [row[i]], -1, (0, 255, 0), 2)
                break
        
        answers[f"Q{q_num}"] = selected if selected else "?"
    
    debug_save(marked_image, "5_marked_answers")
    return answers, marked_image

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        original = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Auto-rotate to handle tilt
        rotated = auto_rotate_image(original)
        
        # Try to find document contour and correct perspective
        doc_contour = find_document_contour(rotated)
        if doc_contour is not None:
            processed_img = perspective_transform(rotated, doc_contour)
        else:
            processed_img = rotated.copy()
        
        # Resize to standard processing size while maintaining aspect ratio
        height, width = processed_img.shape[:2]
        target_height = 900
        target_width = int(width * (target_height / height))
        resized = cv2.resize(processed_img, (target_width, target_height))
        
        # Detect and group bubbles
        bubbles = enhanced_bubble_detection(resized)
        grouped = group_bubbles(bubbles, resized.shape)
        
        if not grouped:
            return JSONResponse({
                "error": "No bubbles detected",
                "debug_images": ["/debug/1_preprocessed.jpg", 
                               "/debug/2_document_contour.jpg",
                               "/debug/3_perspective_transformed.jpg",
                               "/debug/4_detected_bubbles.jpg"]
            }, status_code=400)
        
        # Analyze answers
        answers, marked_img = analyze_bubbles(resized, grouped)
        
        # Save results
        output_path = "marked_output.jpg"
        cv2.imwrite(output_path, marked_img)
        
        return JSONResponse({
            "answers": answers,
            "marked_image": "/marked",
            "debug_images": ["/debug/1_preprocessed.jpg", 
                           "/debug/2_document_contour.jpg",
                           "/debug/3_perspective_transformed.jpg",
                           "/debug/4_detected_bubbles.jpg",
                           "/debug/5_marked_answers.jpg"],
            "status": "success"
        })
        
    except Exception as e:
        return JSONResponse({
            "error": str(e),
            "status": "error"
        }, status_code=500)

@app.get("/marked")
def get_marked():
    if not os.path.exists("marked_output.jpg"):
        return JSONResponse({"error": "No marked image found"}, status_code=404)
    return FileResponse("marked_output.jpg")

@app.get("/debug/{image_name}")
def get_debug_image(image_name: str):
    path = f"debug/{image_name}.jpg"
    if not os.path.exists(path):
        return JSONResponse({"error": "Debug image not found"}, status_code=404)
    return FileResponse(path)
