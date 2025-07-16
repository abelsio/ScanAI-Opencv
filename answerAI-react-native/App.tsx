import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Image, Animated, Platform } from 'react-native';
import { Camera, CameraType, CameraView, FlashMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios'
import AnswerSheetGrader from './components/Answers';
import { API_URL } from './lib/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GUIDE_RATIO = 4 / 3;
const GUIDE_WIDTH = screenWidth * 0.9;
const GUIDE_HEIGHT = GUIDE_WIDTH * GUIDE_RATIO;

export default function AnswerSheetScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<{}>({})
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const cameraRef = useRef<Camera>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [markedImg, setMarkedImg] = useState<string>('')
  const correctAnswers = {"Q1": "B", "Q10": "A", "Q2": "C", "Q3": "C", "Q4": "D", "Q5": "C", "Q6": "D", "Q7": "D", "Q8": "C", "Q9": "C"}


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const closeAnswer = ()=>{
    setAnswers({})
    setMarkedImg('')
    setCapturedImage(null)
    setIsPreviewVisible(false)
  }

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: true,
          exif: false,
        });

        // Calculate the exact crop area to match what was visible in the guide
        // First get the camera's aspect ratio (typically 4:3)
        const cameraAspectRatio = photo.height / photo.width;
        
        // Calculate the visible portion of the camera that matches our guide
        const scale = photo.width / screenWidth;
        const visibleWidth = GUIDE_WIDTH * scale;
        const visibleHeight = visibleWidth * (GUIDE_HEIGHT/GUIDE_WIDTH);
        
        // Center the crop area
        const cropX = (photo.width - visibleWidth) / 2;
        const cropY = (photo.height - visibleHeight) / 2;

        // Perform the crop - this will give us exactly what was in the guide
        const { uri } = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: cropX,
                originY: cropY,
                width: visibleWidth,
                height: visibleHeight,
              },
            },
          ],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedImage(uri);
        setIsPreviewVisible(true);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType(current =>
      current === 'back' ? 'front' : 'back'
    );
  };

  const toggleFlash = () => {
    setFlashMode(current=> current === 'off' ? 'on' : 'off');
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setIsPreviewVisible(false);
  };

  const usePicture = async () => {
    console.warn('called uploading')
    if (!capturedImage) {
      alert('No image to upload!');
      return;
    }

    try {
      const formData = new FormData();
      
      const filename = capturedImage.split('/').pop() || `answer_sheet_${Date.now()}.jpg`;
      
      // Prepare the file object
      formData.append('file', {
        uri: capturedImage,
        name: filename,
        type: 'image/jpeg',
      });

      // Send POST request
      console.warn('uploading')
      const response = await axios.post(`${API_URL}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Image uploaded successfully!');
      console.log('Upload response:', response.data);
      setAnswers(response.data.answers)
      setMarkedImg(response.data.marked_image)


    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
      
      if (error.response) {
        console.error('Server responded with:', error.response.data);
      }
    }
  };


  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  if (answers && markedImg){
    return(
      <AnswerSheetGrader
        onClose={closeAnswer}
        userAnswers={answers}
        correctAnswers={correctAnswers}
        markedImage={markedImg}
      />
    )
  }

  return (
    <View style={styles.container}>
      {!isPreviewVisible ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            ratio="4:3"
            flash={flashMode}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
              style={styles.overlay}
            >
              <View style={styles.guideContainer}>
                <Animated.View style={[styles.guideBorder, { opacity: fadeAnim }]} />
                <View style={styles.guide} />
                <Text style={styles.guideText}>Align answer sheet within this frame</Text>
              </View>
            </LinearGradient>
          </CameraView>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons name={flashMode === 'on' ? 'flash' : 'flash-off'} size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <View style={[styles.previewImageContainer, { width: GUIDE_WIDTH, height: GUIDE_HEIGHT }]}>
            <Image 
              source={{ uri: capturedImage! }} 
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="cover"
            />
          </View>
          
          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.previewButton} onPress={retakePicture}>
              <Ionicons name="arrow-back" size={24} color="white" />
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.previewButton} onPress={usePicture}>
              <Text style={styles.previewButtonText}>Use Photo</Text>
              <Ionicons name="checkmark" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guide: {
    width: GUIDE_WIDTH ,
    height: GUIDE_HEIGHT ,
  },
  guideBorder: {
    position: 'absolute',
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    borderWidth: 4,
    borderColor: '#32FF00',
  },
  guideText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
});