export type ReadinessCourse = {
  id: string;
  title: string;
  lessonIds: string[];
};

export type ReadinessEvidence = {
  id: string;
  name: string;
  courseId: string;
};

export type QuizAttempt = {
  score: number;
  submittedAt: string;
};

export function buildReadinessExport(
  studentId: string,
  studentName: string,
  courses: ReadinessCourse[],
  completedLessonIds: string[],
  quizAttempts: QuizAttempt[],
  evidenceFiles: ReadinessEvidence[],
) {
  const latestQuizScore = quizAttempts.at(-1)?.score ?? null;
  const records = courses.flatMap((course) => {
    const courseLessonsDone = course.lessonIds.filter((id) => completedLessonIds.includes(id)).length;
    const quizDone = course.id === 'cv' && quizAttempts.length > 0;
    const totalItems = course.lessonIds.length + (course.id === 'cv' ? 1 : 0);
    const completedItems = courseLessonsDone + (quizDone ? 1 : 0);
    const completionStatus = completedItems === totalItems
      ? 'completed'
      : completedItems > 0
        ? 'in_progress'
        : 'not_started';
    const courseEvidence = evidenceFiles.filter((file) => file.courseId === course.id);

    return (courseEvidence.length ? courseEvidence : [null]).map((file) => ({
      studentId,
      courseName: course.title,
      quizScore: course.id === 'cv' ? latestQuizScore : null,
      completionStatus,
      evidenceFileLink: file ? `browser-local://evidence/${encodeURIComponent(file.id)}` : null,
      evidenceFileName: file?.name ?? null,
    }));
  });

  return {
    studentId,
    studentName,
    storageScope: 'single-browser',
    evidenceLinkNote: 'browser-local:// references identify files in this browser only; they are not shareable URLs.',
    exportedAt: new Date().toISOString(),
    records,
  };
}
