/**
 * CodeKita - Learning Path Component
 * Displays a structured learning path with lessons and progress
 */

import type { LearningPath as LearningPathData, Progress } from '../types';

interface LearningPathProps {
  path: LearningPathData;
  userProgress: Progress | null;
  onLessonSelect: (lessonId: string) => void;
}

export const LearningPath: React.FC<LearningPathProps> = ({ path, userProgress, onLessonSelect }) => {
  const completionRate = userProgress && path.lessons.length
    ? (userProgress.completedLessons.length / path.lessons.length) * 100
    : 0;
  const completedLessons = userProgress?.completedLessons || [];
  const currentLessonId = userProgress?.currentLesson;

  return (
    <div className="learning-path border rounded-lg overflow-hidden shadow-sm">
      <div className="pillar-header bg-gray-600 text-white py-4">
        <div className="pillar-icon text-2xl mb-2">📚</div>
        <h2 className="text-lg font-semibold">{path.title}</h2>
        <p className="text-opacity-80">{path.description}</p>
      </div>

      <div className="p-progress bg-gray-100 rounded-h-full h-4">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      <div className="p-lessons p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Progress: {completionRate.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">
            {userProgress?.lastAccessed
              ? new Date(userProgress.lastAccessed).toLocaleDateString()
              : 'Never accessed'}
          </span>
        </div>

        <ul className="space-y-2">
          {path.lessons.map((lesson) => {
            const completed = completedLessons.includes(lesson.id) || false;
            const isCurrent = currentLessonId === lesson.id;

            const baseClasses =
              'cursor-pointer select-none rounded p-2 transition-colors';
            const completedClass = 'bg-gray-100';
            const currentClass = 'bg-primary-100';

            let classes = baseClasses;
            if (completed) classes += ' ' + completedClass;
            if (isCurrent) classes += ' ' + currentClass;

            return (
              <li
                key={lesson.id}
                className={classes}
                onClick={() => onLessonSelect(lesson.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lesson.title}</span>
                  <span className="text-xs text-gray-400">
                    {lesson.estimatedTime} min
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};