/**
 * CodeKita - Educational Technology Platform
 * Types and interfaces for the modular monolith
 */

// User & Authentication
export interface ProgressRecord {
  completedLessons: string[];
  currentLesson: string | null;
  score: number;
  lastAccessed: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  progress: Record<string, ProgressRecord>; // progress per learning path
  createdAt: Date;
  updatedAt: Date;
}

// Learning Path
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  pillar: 'programming' | 'cybersecurity' | 'ai-engineering';
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  icon: string;
  color: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  exercises: Exercise[];
  quiz?: Quiz; // Optional quiz at end of lesson
  estimatedTime: number; // in minutes
}

export interface Exercise {
  id: string;
  type: 'coding' | 'multiple-choice' | 'fill-blank' | 'drag-drop';
  prompt: string;
  hint?: string;
  solution?: string;
  autoGraded: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
}

// Progress Tracking
export interface Progress {
  userId: string;
  learningPathId: string;
  completedLessons: string[];
  currentLesson: string | null;
  score: number;
  lastAccessed: Date;
}

// Cybersecurity specific
export interface Vulnerability {
  id: string;
  name: string;
  type: 'sql-injection' | 'xss' | 'csrf' | 'auth-bypass' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
}

export interface CTFChallenge {
  id: string;
  title: string;
  category: 'web' | 'crypto' | 'pwn' | 'forensics' | 'misc';
  description: string;
  points: number;
  flags: Flag[];
}

export interface Flag {
  id: string;
  value: string;
  hint?: string;
}

// AI Engineering specific
export interface AIModel {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'generation' | 'clustering';
  framework: 'tensorflow' | 'pytorch' | 'scikit-learn' | 'openai';
  description: string;
  parameters: Record<string, any>;
}

export interface AIPrompt {
  id: string;
  title: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

// Platform-wide
export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  total: number;
  completedAt: Date;
  passed: boolean;
}

export type Pillar = 'programming' | 'cybersecurity' | 'ai-engineering';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';