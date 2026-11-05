/**
 * CodeKita - Quiz Data and Assessment System
 * Sample quizzes for each learning path with questions, options, and scoring
 */

import { Quiz, QuizQuestion, QuizResult, ProgressRecord, User } from './types';

// Programming Quiz: Full-Stack Web Development
export const programmingQuiz: Quiz = {
  id: 'quiz-prog-1',
  title: 'Full-Stack Web Development Fundamentals',
  questions: [
    {
      id: 'q-prog-1',
      type: 'multiple-choice',
      question: 'Which React hook is used to add state to functional components?',
      options: ['useEffect', 'useState', 'useContext', 'useReducer'],
      correctAnswer: 'useState',
      explanation: 'useState is the React hook that lets you add state to function components.',
    },
    {
      id: 'q-prog-2',
      type: 'multiple-choice',
      question: 'In Express.js, which method defines a GET route?',
      options: ['router.get()', 'router.post()', 'router.put()', 'router.delete()'],
      correctAnswer: 'router.get()',
      explanation: 'router.get() is used to define a GET route handler in Express.',
    },
    {
      id: 'q-prog-3',
      type: 'multiple-choice',
      question: 'Which SQL clause is used to combine rows from two or more tables?',
      options: ['SELECT', 'FROM', 'INNER JOIN', 'WHERE'],
      correctAnswer: 'INNER JOIN',
      explanation: 'INNER JOIN combines rows from tables based on a related column.',
    },
    {
      id: 'q-prog-4',
      type: 'multiple-choice',
      question: 'What is the correct way to normalize a value using min-max scaling?',
      options: [
        '(value + min) / (max + min)',
        '(value - min) / (max - min)',
        '(value * min) / (max * min)',
        '(value - max) / (min - max)',
      ],
      correctAnswer: '(value - min) / (max - min)',
      explanation: 'Min-max scaling formula: (x - min) / (max - min)',
    },
  ],
  passingScore: 70,
};

// Cybersecurity Quiz: Network Security Fundamentals
export const cybersecurityQuiz: Quiz = {
  id: 'quiz-cs-1',
  title: 'Network Security Fundamentals',
  questions: [
    {
      id: 'q-cs-1',
      type: 'multiple-choice',
      question: 'Which layer of the TCP/IP model handles routing?',
      options: ['Application', 'Transport', 'Internet', 'Network Access'],
      correctAnswer: 'Internet',
      explanation: 'The Internet layer is responsible for routing packets across networks.',
    },
    {
      id: 'q-cs-2',
      type: 'true-false',
      question: 'Storing passwords in plain text is a secure practice.',
      correctAnswer: 'False',
      explanation: 'Storing passwords in plain text is highly insecure. Passwords should always be hashed with a salt.',
    },
    {
      id: 'q-cs-3',
      type: 'multiple-choice',
      question: 'Which HTTP method should be used for idempotent operations?',
      options: ['GET', 'POST', 'PUT', 'PATCH'],
      correctAnswer: 'GET',
      explanation: 'GET is idempotent, meaning multiple identical requests have the same effect as one request.',
    },
    {
      id: 'q-cs-4',
      type: 'fill-blank',
      question: 'Allow only HTTP (port __) and HTTPS (port __) through the firewall',
      correctAnswer: '80 443',
      explanation: 'Port 80 is for HTTP and port 443 is for HTTPS.',
    },
  ],
  passingScore: 75,
};

// AI Engineering Quiz: Machine Learning Basics
export const aiQuiz: Quiz = {
  id: 'quiz-ai-1',
  title: 'Machine Learning Basics',
  questions: [
    {
      id: 'q-ai-1',
      type: 'multiple-choice',
      question: 'Which of the following is an example of supervised learning?',
      options: ['Clustering', 'Regression', 'Dimensionality reduction', 'Anomaly detection'],
      correctAnswer: 'Regression',
      explanation: 'Regression uses labeled input-output pairs for training.',
    },
    {
      id: 'q-ai-2',
      type: 'true-false',
      question: 'F1-score is the harmonic mean of precision and recall.',
      correctAnswer: 'True',
      explanation: 'F1-score = 2 * (precision * recall) / (precision + recall)',
    },
    {
      id: 'q-ai-3',
      type: 'multiple-choice',
      question: 'Which metric evaluates the ability of a classifier to identify only relevant instances?',
      options: ['Precision', 'Recall', 'Accuracy', 'F1-score'],
      correctAnswer: 'Precision',
      explanation: 'Precision = True Positives / (True Positives + False Positives)',
    },
    {
      id: 'q-ai-4',
      type: 'coding',
      question: 'Write the min-max scaling formula for a value x',
      correctAnswer: '(x - min) / (max - min)',
      explanation: 'Min-max scaling normalizes data to a [0, 1] range.',
    },
  ],
  passingScore: 70,
};

// Quiz results tracking
export const createQuizResult = (
  userId: string,
  quizId: string,
  score: number,
  total: number
): QuizResult => {
  const passed = score >= 70; // Default passing threshold
  return {
    id: `${quizId}-${Date.now()}`,
    userId,
    quizId,
    score,
    total,
    completedAt: new Date(),
    passed,
  };
};

// Sample users with quiz progress
export const sampleQuizTakers: { userId: string; completedQuizzes: string[] }[] = [
  {
    userId: 'user-1',
    completedQuizzes: ['quiz-prog-1', 'quiz-cs-1'],
  },
  {
    userId: 'user-2',
    completedQuizzes: ['quiz-ai-1'],
  },
];