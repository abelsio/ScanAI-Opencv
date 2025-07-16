import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { API_URL } from '../lib/api';

interface Answers {
  [key: string]: string;
}

interface Props {
    userAnswers: {};
    markedImage: string;
    correctAnswers: {};
    onClose: ()=> void
}

const AnswerSheetGrader = ({userAnswers, markedImage, correctAnswers, onClose}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateScore = () => {
    if (!userAnswers) return 0;
    
    let score = 0;
    Object.keys(userAnswers).forEach((question) => {
      if (userAnswers[question] === correctAnswers[question]) {
        score++;
      }
    });
    return score;
  };

  const totalQuestions = userAnswers ? Object.keys(userAnswers).length : 0;
  const score = calculateScore();
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <LinearGradient
      colors={['#6a11cb', '#2575fc']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={{width:'100%', flexDirection:'row', justifyContent:'space-between'}}>
            <TouchableOpacity style={{padding:5}} onPress={onClose}>
                <Ionicons name="arrow-back" size={26} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Answer Sheet Grader</Text>
            <Text></Text>
        </View>
        

        { userAnswers && markedImage && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Grading Results</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                Score: {score}/{totalQuestions}
              </Text>
              <Text style={styles.percentageText}>
                {percentage}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${percentage}%` }
                ]}
              />
            </View>

            <Image 
              source={{ uri: `${API_URL}/marked` }}
              style={styles.markedImage} 
            />

            <View style={styles.answersGrid}>
              {Object.keys(userAnswers).map((question) => {
                const isCorrect = userAnswers[question] === correctAnswers[question];
                return (
                  <View 
                    key={question} 
                    style={[
                      styles.answerItem,
                      isCorrect ? styles.correctAnswer : styles.incorrectAnswer
                    ]}
                  >
                    <Text style={styles.questionText}>{question}</Text>
                    <Text style={styles.answerText}>{userAnswers[question]}</Text>
                    {isCorrect ? (
                      <AntDesign name="checkcircle" size={20} color="#4CAF50" />
                    ) : (
                      <>
                        <AntDesign name="closecircle" size={20} color="#F44336" />
                        <Text style={styles.correctAnswerText}>
                          (Correct: {correctAnswers[question]})
                        </Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:30
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  markedImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 20,
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6a11cb',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  correctAnswer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  incorrectAnswer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  questionText: {
    fontWeight: 'bold',
    marginRight: 5,
    color: '#333',
  },
  answerText: {
    marginRight: 5,
    color: '#333',
  },
  correctAnswerText: {
    marginLeft: 5,
    color: '#333',
    fontStyle: 'italic',
  },
});

export default AnswerSheetGrader;