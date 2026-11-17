import { useEffect, useState, type ReactNode, type FormEvent, type ChangeEvent } from 'react';
import { Route, Switch, Link, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Check, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, Download, ExternalLink, FileText, GraduationCap,
  LayoutDashboard, Menu, MessageSquareText, Paperclip, Trash2, Upload, X,
} from 'lucide-react';
import { deleteEvidenceFile, listEvidenceFiles, saveEvidenceFile, type EvidenceFileRecord } from '@/lib/evidence-storage';
import { buildReadinessExport, type QuizAttempt } from '@/lib/readiness-export';

type Lesson = { id: string; title: string; content: string[] };
type Course = { id: string; title: string; description: string; lessons: Lesson[]; duration: string; icon: typeof FileText };
type Task = { id: string; courseId: string; title: string; due: string };
type QuizRecord = { attempts: QuizAttempt[] };

const STUDENT_ID = 'student-raisa-butti-001';
const STUDENT_NAME = 'Raisa Butti';

const courses: Course[] = [
  {
    id: 'cv',
    title: 'CV Writing',
    description: 'Build a clear, confident CV that puts your experience and strengths in the right light.',
    duration: '35 min',
    icon: FileText,
    lessons: [
      { id: 'cv-purpose', title: 'Start with the role', content: ['A CV is a short, focused introduction to the value you could bring to a role.', 'Read the internship description first. Highlight the skills and responsibilities that match your experience, studies, projects, or volunteering.'] },
      { id: 'cv-achievements', title: 'Show your achievements', content: ['Use action verbs to explain what you did, then add a result or useful detail.', 'Instead of “helped with events,” try “Promoted three student events and increased sign-ups by 20%.” Be accurate and use evidence you can explain.'] },
      { id: 'cv-structure', title: 'Keep it easy to scan', content: ['Use clear headings, consistent dates, and a readable font. Put the most relevant information where a busy reader can find it quickly.', 'For a first internship, education, projects, part-time work, volunteering, and student activities can all show useful skills.'] },
      { id: 'cv-tailoring', title: 'Tailor your CV', content: ['Adjust your profile and skill examples for each opportunity. Use the employer’s language when it honestly describes your experience.', 'Check spelling, contact details, and document formatting before you send the final version.'] },
    ],
  },
  {
    id: 'interview',
    title: 'Interview Preparation',
    description: 'Prepare thoughtful answers, settle your nerves, and make a strong first impression.',
    duration: '45 min',
    icon: BriefcaseBusiness,
    lessons: [
      { id: 'interview-research', title: 'Research the opportunity', content: ['Learn what the organization does, who it serves, and what the internship involves.', 'Choose two details that genuinely interest you and prepare a question about the work or team.'] },
      { id: 'interview-intro', title: 'Introduce yourself', content: ['Prepare a short introduction that connects what you study, what you have worked on, and what you hope to learn.', 'Keep it conversational. A clear 30–60 second answer is more useful than memorizing a long script.'] },
      { id: 'interview-star', title: 'Use the STAR structure', content: ['For a behavior question, explain the Situation, Task, Action, and Result.', 'Spend most of your answer on the actions you took. Include what you learned, even if the result was not perfect.'] },
      { id: 'interview-practice', title: 'Practice out loud', content: ['Practice common questions with a friend or record yourself once. Listen for clear examples and answers that stay on topic.', 'Prepare a calm pause for difficult questions: take a breath, then organize your thoughts before answering.'] },
      { id: 'interview-followup', title: 'Close with confidence', content: ['Ask one or two relevant questions and thank the interviewer for their time.', 'After the interview, note what went well and one point you would improve next time.'] },
    ],
  },
  {
    id: 'workplace',
    title: 'Workplace Communication',
    description: 'Practice the everyday communication skills that help you thrive on a new team.',
    duration: '30 min',
    icon: MessageSquareText,
    lessons: [
      { id: 'workplace-listening', title: 'Listen actively', content: ['Give a colleague your attention, avoid interrupting, and summarize key points when the work is complex.', 'If an instruction is unclear, ask a specific follow-up question before starting.'] },
      { id: 'workplace-writing', title: 'Write clear messages', content: ['Start with the purpose, include only the context the reader needs, and make the next action clear.', 'Use a respectful tone and check names, dates, attachments, and recipients before sending.'] },
      { id: 'workplace-feedback', title: 'Use feedback well', content: ['Listen to feedback before responding. Ask for an example if you are not sure what to change.', 'Agree on one practical next step, then follow up to show how you used the advice.'] },
      { id: 'workplace-support', title: 'Ask for support early', content: ['Raise blockers early and explain what you have tried, what is stuck, and what help would move the work forward.', 'A brief, timely update helps your team plan and prevents small issues from becoming bigger ones.'] },
    ],
  },
];
const DEFAULT_COMPLETED_LESSONS = ['cv-purpose', 'cv-achievements', 'interview-research', 'interview-intro', 'workplace-listening'];
const tasks: Task[] = [
  { id: 'cv-draft', courseId: 'cv', title: 'Draft your experience section', due: 'CV Writing' },
  { id: 'cv-tailor', courseId: 'cv', title: 'Tailor your CV to a role', due: 'CV Writing' },
  { id: 'interview-intro', courseId: 'interview', title: 'Write a 60-second introduction', due: 'Interview Preparation' },
  { id: 'interview-star', courseId: 'interview', title: 'Prepare one STAR example', due: 'Interview Preparation' },
];
const quizQuestions = [
  {
    prompt: 'Which detail is most important to include at the top of a CV?',
    options: ['A clear name and professional contact details', 'Your full home address and date of birth', 'A list of every class you have taken'],
    correct: 0,
  },
  {
    prompt: 'What is the strongest way to describe an achievement?',
    options: ['Use general phrases such as “helped with things”', 'Describe your action and the result with specific evidence', 'Repeat the job description word for word'],
    correct: 1,
  },
  {
    prompt: 'How should you tailor a CV for a specific internship?',
    options: ['Send the same CV to every employer', 'Add unrelated details to make it longer', 'Highlight relevant skills and experience for that role'],
    correct: 2,
  },
];

const legacyStorageKeys: Record<string, string> = {
  enrolled: 'prep-enrolled',
  'task-completions': 'prep-tasks',
  'quiz-record': 'prep-quiz-score',
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const storageKey = `ipp:${STUDENT_ID}:${key}`;
    const value = localStorage.getItem(storageKey);
    if (value !== null) return JSON.parse(value) as T;

    const legacyKey = legacyStorageKeys[key];
    const legacyValue = legacyKey ? localStorage.getItem(legacyKey) : null;
    if (legacyValue === null) return fallback;
    const parsed: unknown = JSON.parse(legacyValue);
    let migrated = parsed;
    if (key === 'quiz-record') {
      migrated = typeof parsed === 'number'
        ? { attempts: [{ score: parsed, submittedAt: new Date().toISOString() }] }
        : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { attempts?: unknown }).attempts)
          ? parsed
          : { attempts: [] };
    }
    localStorage.setItem(storageKey, JSON.stringify(migrated));
    return migrated as T;
  } catch {
    return fallback;
  }
}

function useStoredState<T>(key: string, fallback: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));
  const update = (next: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      try { localStorage.setItem(`ipp:${STUDENT_ID}:${key}`, JSON.stringify(resolved)); } catch { /* Keep this visit usable if browser storage is unavailable. */ }
      return resolved;
    });
  };
  return [value, update];
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { href: '/', label: 'My dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/quizzes', label: 'Quizzes', icon: ClipboardCheck },
    { href: '/evidence', label: 'My evidence', icon: Paperclip },
  ];
  const currentTitle = location.startsWith('/courses/')
    ? 'Courses'
    : nav.find((item) => item.href === location)?.label ?? 'Page not found';

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link href="/" className="brand" data-testid="link-brand-home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><GraduationCap size={21} strokeWidth={2.1} /></span>
          <span className="brand-title">Internship Prep</span>
        </Link>
        <div className="nav-caption">Learning space</div>
        <nav className={`nav-list${menuOpen ? ' open' : ''}`} aria-label="Learning pages">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className="nav-link"
              aria-current={location === href ? 'page' : undefined}
              data-testid={`nav-${href === '/' ? 'dashboard' : href.slice(1)}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <b>Your next step starts here</b>
          <p>Small, steady progress makes your first internship feel closer.</p>
        </div>
        <button className="mobile-nav-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} data-testid="button-mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="crumb">Learning space <ChevronRight size={12} style={{ verticalAlign: 'middle', margin: '0 4px' }} /> <strong>{currentTitle}</strong></div>
          <div className="top-profile" data-testid="profile-sample-student">
            <div className="avatar" aria-label={`${STUDENT_NAME} initials`}>RB</div>
            <div className="profile-copy"><div className="profile-name">{STUDENT_NAME}</div><div className="profile-role">Undergraduate student</div></div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function ProgressBar({ value, testId }: { value: number; testId: string }) {
  return (
    <div className="progress-track" role="progressbar" aria-label="Course progress" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} data-testid={testId}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function getCourseProgress(course: Course, completedLessonIds: string[], quizComplete: boolean) {
  const completedLessons = course.lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const quizMilestone = course.id === 'cv' ? 1 : 0;
  const completedQuiz = course.id === 'cv' && quizComplete ? 1 : 0;
  return Math.round(((completedLessons + completedQuiz) / (course.lessons.length + quizMilestone)) * 100);
}

function getOverallProgress(completedLessonIds: string[], completedTaskIds: string[], quizComplete: boolean) {
  const validLessons = courses.flatMap((course) => course.lessons).filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const totalSteps = courses.reduce((count, course) => count + course.lessons.length, 0) + tasks.length + 1;
  const completeSteps = validLessons + tasks.filter((task) => completedTaskIds.includes(task.id)).length + (quizComplete ? 1 : 0);
  return Math.round((completeSteps / totalSteps) * 100);
}

function Dashboard() {
  const [enrolled] = useStoredState<string[]>('enrolled', ['cv', 'interview']);
  const [completedTasks, setCompletedTasks] = useStoredState<string[]>('task-completions', ['cv-draft', 'interview-intro']);
  const [completedLessons] = useStoredState<string[]>('completed-lessons', DEFAULT_COMPLETED_LESSONS);
  const [quizRecord] = useStoredState<QuizRecord>('quiz-record', { attempts: [] });
  const quizScore = quizRecord.attempts.at(-1)?.score ?? null;
  const overallProgress = getOverallProgress(completedLessons, completedTasks, quizScore !== null);
  const completedCount = completedTasks.length;

  return (
    <div className="page-content">
      <div className="eyebrow">Your learning snapshot</div>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <div className="welcome-kicker">A good place to begin</div>
          <h1 id="welcome-title" className="welcome-title">You’re building your next opportunity, Raisa.</h1>
          <p>Pick up where you left off, or take one small step today.</p>
        </div>
        <Link href="/courses" className="welcome-cta" data-testid="link-explore-courses">Explore courses <ArrowRight size={15} /></Link>
      </section>

      <div className="stat-strip" aria-label="Learning progress">
        <div className="stat-box" data-testid="stat-overall-progress"><div className="stat-label">Overall progress</div><div className="stat-value">{overallProgress}%</div><div className="stat-caption">Lessons, quiz, and tasks</div></div>
        <div className="stat-box" data-testid="stat-enrolled-courses"><div className="stat-label">Courses enrolled</div><div className="stat-value">{enrolled.length} <span style={{ fontSize: 13, fontWeight: 500, color: '#87929c' }}>/ 3</span></div><div className="stat-caption">Keep building your toolkit</div></div>
        <div className="stat-box" data-testid="stat-completed-tasks"><div className="stat-label">Tasks completed</div><div className="stat-value">{completedCount}<span style={{ fontSize: 13, fontWeight: 500, color: '#87929c' }}> / {tasks.length}</span></div><div className="stat-caption">One step at a time</div></div>
      </div>

      <div className="dashboard-grid">
        <section aria-labelledby="enrolled-heading">
          <div className="section-heading"><h2 id="enrolled-heading">Your courses</h2><Link href="/courses" className="text-link" data-testid="link-all-courses">All courses <ArrowRight size={13} /></Link></div>
          <div className="panel course-list">
            {enrolled.length ? courses.filter((course) => enrolled.includes(course.id)).map((course) => {
              const Icon = course.icon;
              const progress = getCourseProgress(course, completedLessons, quizScore !== null);
              return (
                <div className="course-row" key={course.id} data-testid={`dashboard-course-${course.id}`}>
                  <div className="course-icon"><Icon size={19} /></div>
                  <div>
                    <div className="course-name">{course.title}</div>
                    <div className="course-meta">{course.lessons.length} short lessons · {course.duration}</div>
                    <div className="row-progress"><ProgressBar value={progress} testId={`progress-course-${course.id}`} /><span className="progress-label">{progress}%</span></div>
                  </div>
                  <Link href={`/courses/${course.id}`} className="outline-button" data-testid={`link-continue-${course.id}`}>Continue</Link>
                </div>
              );
            }) : <div className="empty-state" data-testid="empty-dashboard-courses"><strong>No courses yet</strong>Visit courses to choose your first learning path.</div>}
          </div>
        </section>
        <section aria-labelledby="tasks-heading">
          <div className="section-heading"><h2 id="tasks-heading">Your learning tasks</h2></div>
          <div className="panel tasks-panel">
            {tasks.map((task) => {
              const done = completedTasks.includes(task.id);
              return (
                <label className="task-item" key={task.id} data-testid={`task-row-${task.id}`}>
                  <input
                    type="checkbox"
                    className="task-check"
                    checked={done}
                    aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                    data-testid={`checkbox-task-${task.id}`}
                    onChange={() => setCompletedTasks((current) => done ? current.filter((id) => id !== task.id) : [...current, task.id])}
                  />
                  <span className={`task-copy${done ? ' done' : ''}`}>{task.title}<span className="task-due">{task.due}</span></span>
                  {done && <CheckCircle2 size={15} color="#6c9279" aria-label="Completed" />}
                </label>
              );
            })}
          </div>
        </section>
      </div>
      <section style={{ marginTop: 24 }} aria-labelledby="activity-heading">
        <div className="section-heading"><h2 id="activity-heading">Recent milestones</h2><Link href="/evidence" className="text-link" data-testid="link-evidence-from-dashboard">Add evidence <ArrowRight size={13} /></Link></div>
        <div className="panel tasks-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-testid="milestone-cv"><span className="course-icon" style={{ width: 34, height: 34 }}><Check size={16} /></span><span className="task-copy">CV foundations started<span className="task-due">A strong first draft is underway</span></span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-testid="milestone-quiz"><span className="course-icon" style={{ width: 34, height: 34 }}><ClipboardCheck size={16} /></span><span className="task-copy">{quizScore === null ? 'CV knowledge check' : `Quiz score: ${quizScore} of 3`}<span className="task-due">{quizScore === null ? 'Ready when you are' : 'Your result is saved on this device'}</span></span></div>
        </div>
      </section>
    </div>
  );
}

function CoursesPage() {
  const [enrolled, setEnrolled] = useStoredState<string[]>('enrolled', ['cv', 'interview']);
  const [completedLessons] = useStoredState<string[]>('completed-lessons', DEFAULT_COMPLETED_LESSONS);
  const [quizRecord] = useStoredState<QuizRecord>('quiz-record', { attempts: [] });
  const toggleEnrollment = (id: string) => setEnrolled((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <div className="page-content">
      <div className="page-heading-row">
        <div><div className="eyebrow">Learn at your own pace</div><h1 className="page-title">Courses</h1><p className="page-intro">Practical skills for your first step into the world of work.</p></div>
        <span className="status-pill" data-testid="course-count">{courses.length} learning paths</span>
      </div>
      <div className="course-grid">
        {courses.map((course) => {
          const Icon = course.icon;
          const isEnrolled = enrolled.includes(course.id);
          const progress = getCourseProgress(course, completedLessons, quizRecord.attempts.length > 0);
          return (
            <article className="panel course-card" key={course.id} data-testid={`course-card-${course.id}`}>
              <div className="course-card-top"><div className="course-card-icon"><Icon size={21} /></div><span className={`status-pill${isEnrolled ? ' active' : ''}`} data-testid={`status-course-${course.id}`}>{isEnrolled ? 'Enrolled' : 'Available'}</span></div>
              <h2>{course.title}</h2><p>{course.description}</p>
              <div className="course-progress-wrap"><div className="course-progress-label"><span>Your progress</span><span data-testid={`course-percent-${course.id}`}>{progress}%</span></div><ProgressBar value={progress} testId={`courses-progress-${course.id}`} /></div>
              <div className="course-card-bottom">
                <span className="course-length"><Clock3 size={13} /> {course.lessons.length} lessons · {course.duration}</span>
                <div className="course-card-actions">
                  <Link href={`/courses/${course.id}`} className="outline-button" data-testid={`link-open-course-${course.id}`}>Open course</Link>
                  <button type="button" className={isEnrolled ? 'quiet-button' : 'primary-button'} data-testid={`button-${isEnrolled ? 'unenroll' : 'enroll'}-${course.id}`} onClick={() => toggleEnrollment(course.id)}>
                    {isEnrolled ? 'Leave course' : 'Enroll'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <section className="panel tasks-panel" style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
        <div><div className="course-name">Ready to check your CV knowledge?</div><div className="course-meta">Take the short three-question knowledge check.</div></div>
        <Link href="/quizzes" className="text-link" data-testid="link-cv-quiz">Go to quiz <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}

function CourseDetailPage() {
  const [matched, params] = useRoute('/courses/:courseId');
  const [completedLessons, setCompletedLessons] = useStoredState<string[]>('completed-lessons', DEFAULT_COMPLETED_LESSONS);
  const [enrolled, setEnrolled] = useStoredState<string[]>('enrolled', ['cv', 'interview']);
  const [quizRecord] = useStoredState<QuizRecord>('quiz-record', { attempts: [] });
  const course = matched ? courses.find((item) => item.id === params?.courseId) : undefined;

  if (!course) {
    return <div className="page-content"><div className="eyebrow">Learning space</div><h1 className="page-title">Course not found</h1><p className="page-intro">Choose one of the three courses to continue learning.</p><Link href="/courses" className="outline-button inline-action" data-testid="link-return-courses">Back to courses</Link></div>;
  }

  const quizComplete = course.id === 'cv' && quizRecord.attempts.length > 0;
  const progress = getCourseProgress(course, completedLessons, quizRecord.attempts.length > 0);
  const completedCount = course.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
  const isEnrolled = enrolled.includes(course.id);
  const toggleLesson = (lessonId: string) => {
    setCompletedLessons((current) => current.includes(lessonId)
      ? current.filter((id) => id !== lessonId)
      : [...current, lessonId]);
  };
  const toggleEnrollment = () => setEnrolled((current) => isEnrolled
    ? current.filter((id) => id !== course.id)
    : [...current, course.id]);

  return (
    <div className="page-content">
      <div className="eyebrow"><Link href="/courses" className="breadcrumb-link" data-testid="link-back-to-courses">Courses</Link><ChevronRight size={12} /> Learning path</div>
      <div className="page-heading-row course-detail-heading">
        <div><h1 className="page-title">{course.title}</h1><p className="page-intro">{course.description}</p></div>
        <button type="button" className={isEnrolled ? 'quiet-button' : 'primary-button'} data-testid={`button-detail-enrollment-${course.id}`} onClick={toggleEnrollment}>{isEnrolled ? 'Leave course' : 'Enroll in course'}</button>
      </div>

      <section className="panel course-detail-summary" aria-label={`${course.title} progress`}>
        <div className="course-progress-label"><strong>Your progress</strong><span data-testid={`detail-course-percent-${course.id}`}>{progress}% · {completedCount} of {course.lessons.length} lessons{course.id === 'cv' ? ` · quiz ${quizComplete ? 'complete' : 'not complete'}` : ''}</span></div>
        <ProgressBar value={progress} testId={`detail-progress-${course.id}`} />
      </section>

      <div className="lesson-list">
        {course.lessons.map((lesson, index) => {
          const isComplete = completedLessons.includes(lesson.id);
          return (
            <article className="panel lesson-card" key={lesson.id} data-testid={`lesson-${lesson.id}`}>
              <div className="lesson-card-heading"><span className="lesson-number">LESSON {String(index + 1).padStart(2, '0')}</span>{isComplete && <span className="status-pill active"><CheckCircle2 size={12} /> Completed</span>}</div>
              <h2>{lesson.title}</h2>
              <div className="lesson-copy">{lesson.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              <button type="button" className={isComplete ? 'quiet-button' : 'primary-button'} data-testid={`button-complete-lesson-${lesson.id}`} aria-pressed={isComplete} onClick={() => toggleLesson(lesson.id)}>{isComplete ? 'Mark as not complete' : 'Mark lesson complete'}</button>
            </article>
          );
        })}
      </div>

      {course.id === 'cv' && (
        <section className="panel course-quiz-callout" data-testid="cv-course-quiz">
          <div><div className="course-name">CV Writing knowledge check</div><p>{quizComplete ? `Latest score: ${quizRecord.attempts.at(-1)?.score} out of ${quizQuestions.length}. This quiz counts toward your course progress.` : 'Complete the short quiz to add the final step to your CV course progress.'}</p></div>
          <Link href="/quizzes" className="outline-button" data-testid="link-course-quiz">{quizComplete ? 'Review or retake quiz' : 'Take the quiz'} <ArrowRight size={13} /></Link>
        </section>
      )}
    </div>
  );
}

function QuizzesPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [record, setRecord] = useStoredState<QuizRecord>('quiz-record', { attempts: [] });
  const [message, setMessage] = useState('');
  const [isRetaking, setIsRetaking] = useState(false);
  const latestAttempt = record.attempts.at(-1);
  const score = latestAttempt?.score ?? 0;
  const submitted = latestAttempt !== undefined && !isRetaking;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(answers).length !== quizQuestions.length) {
      setMessage('Choose one answer for each question before submitting.');
      return;
    }
    const result = quizQuestions.reduce((total, question, index) => total + (answers[index] === question.correct ? 1 : 0), 0);
    setRecord((current) => ({
      attempts: [...current.attempts, { score: result, submittedAt: new Date().toISOString() }],
    }));
    setIsRetaking(false);
    setMessage('');
  };
  const resetQuiz = () => { setAnswers({}); setIsRetaking(true); setMessage(''); };

  return (
    <div className="page-content">
      <div className="eyebrow">Check what you know</div>
      <h1 className="page-title">Knowledge checks</h1>
      <p className="page-intro">A few quick questions help the key ideas stick.</p>
      <form className="panel quiz-card" onSubmit={handleSubmit} noValidate>
        <div className="quiz-progress-top"><span><strong style={{ color: '#25415e' }}>CV Writing</strong> · Knowledge check</span><span>Attempt {record.attempts.length + (isRetaking ? 1 : 0) || 1} · 3 questions</span></div>
        <ProgressBar value={submitted ? 100 : Math.round((Object.keys(answers).length / quizQuestions.length) * 100)} testId="quiz-progress" />
        {quizQuestions.map((question, index) => (
          <fieldset className="quiz-question" key={question.prompt} style={{ border: 0, paddingLeft: 0, paddingRight: 0, margin: 0 }} data-testid={`quiz-question-${index + 1}`}>
            <legend className="sr-only">{question.prompt}</legend>
            <span className="question-number">Question {index + 1}</span>
            <h2 aria-hidden="true">{question.prompt}</h2>
            <div className="answer-list">
              {question.options.map((option, optionIndex) => {
                const selected = answers[index] === optionIndex;
                let resultClass = '';
                if (submitted && optionIndex === question.correct) resultClass = ' correct';
                else if (submitted && selected) resultClass = ' incorrect';
                return (
                  <label key={option} className={`answer-option${selected ? ' selected' : ''}${resultClass}`}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionIndex}
                      checked={selected}
                      disabled={submitted}
                      data-testid={`answer-${index + 1}-${optionIndex + 1}`}
                      onChange={() => { setAnswers((current) => ({ ...current, [index]: optionIndex })); setMessage(''); }}
                    />
                    <span>{option}</span>
                    {submitted && optionIndex === question.correct && <Check size={15} aria-label="Correct answer" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        {message && <div role="alert" className="quiz-result" data-testid="quiz-validation-message"><strong>Almost there</strong><p>{message}</p></div>}
        {submitted && <div className="quiz-result" role="status" data-testid="quiz-result"><strong>You scored {score} out of {quizQuestions.length}</strong><p>{score === 3 ? 'Excellent work. You have a strong grasp of CV essentials.' : score >= 2 ? 'Good progress. Review the highlighted answers and keep going.' : 'A useful first try. Take another look through the CV Writing course and try again.'}</p><p className="saved-result-note">Saved locally for {STUDENT_NAME} · {new Date(latestAttempt?.submittedAt ?? new Date().toISOString()).toLocaleString()}</p></div>}
        {record.attempts.length > 1 && <p className="attempt-history" data-testid="quiz-attempt-history">{record.attempts.length} saved attempts · Latest score {score} of {quizQuestions.length}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 21 }}>
          {!submitted ? <button type="submit" className="primary-button" data-testid="button-submit-quiz">Submit answers <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 5 }} /></button> : <button type="button" className="outline-button" data-testid="button-retake-quiz" onClick={resetQuiz}>Try again</button>}
        </div>
      </form>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getSupportedEvidenceType(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const fallbackTypes: Record<string, string> = {
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', avif: 'image/avif',
  };
  const declaredType = file.type.toLowerCase();
  if (declaredType === 'application/pdf' || declaredType.startsWith('image/')) return declaredType;
  if (!declaredType || declaredType === 'application/octet-stream') return fallbackTypes[extension] ?? null;
  return null;
}

function EvidenceRow({ file, onDelete, deleting }: { file: EvidenceFileRecord; onDelete: (id: string) => void; deleting: boolean }) {
  const [fileUrl, setFileUrl] = useState('');
  const relatedCourse = courses.find((course) => course.id === file.courseId)?.title ?? 'General readiness';

  useEffect(() => {
    const url = URL.createObjectURL(file.blob);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file.blob]);

  return (
    <article className="evidence-row" data-testid={`evidence-item-${file.id}`}>
      {file.type.startsWith('image/') && fileUrl ? (
        <img className="evidence-thumbnail" src={fileUrl} alt={`Preview of ${file.name}`} />
      ) : (
        <div className="file-type-icon"><FileText size={17} /></div>
      )}
      <div className="file-info">
        <div className="file-name" title={file.name} data-testid={`evidence-filename-${file.id}`}>{file.name}</div>
        <div className="file-meta">{formatSize(file.size)} · {file.type} · {relatedCourse} · Added {new Date(file.addedAt).toLocaleDateString()}</div>
      </div>
      <div className="evidence-actions">
        {fileUrl && <a className="file-action-link" href={fileUrl} target="_blank" rel="noreferrer" aria-label={`View ${file.name}`} data-testid={`link-view-evidence-${file.id}`}><ExternalLink size={14} /> View</a>}
        {fileUrl && <a className="file-action-link" href={fileUrl} download={file.name} aria-label={`Download ${file.name}`} data-testid={`link-download-evidence-${file.id}`}><Download size={14} /> Download</a>}
        <button type="button" className="danger-button" aria-label={`Delete ${file.name}`} data-testid={`button-remove-evidence-${file.id}`} disabled={deleting} onClick={() => onDelete(file.id)}><Trash2 size={13} /> Delete</button>
      </div>
    </article>
  );
}

function EvidencePage() {
  const [files, setFiles] = useState<EvidenceFileRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('cv');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [legacyFileCount, setLegacyFileCount] = useState(0);
  const [completedLessons] = useStoredState<string[]>('completed-lessons', DEFAULT_COMPLETED_LESSONS);
  const [quizRecord] = useStoredState<QuizRecord>('quiz-record', { attempts: [] });

  useEffect(() => {
    let active = true;
    listEvidenceFiles(STUDENT_ID)
      .then((savedFiles) => { if (active) setFiles(savedFiles); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load evidence files from this browser.');
      })
      .finally(() => { if (active) setLoading(false); });
    try {
      const oldMetadata = localStorage.getItem('prep-evidence');
      if (oldMetadata) {
        const parsed: unknown = JSON.parse(oldMetadata);
        if (Array.isArray(parsed)) setLegacyFileCount(parsed.length);
      }
    } catch {
      // Ignore invalid legacy metadata; only files stored in IndexedDB are shown as evidence.
    }
    return () => { active = false; };
  }, []);

  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!selected.length) return;
    setNotice('');
    setError('');
    setUploading(true);

    const added: EvidenceFileRecord[] = [];
    const rejected: string[] = [];

    try {
      for (const file of selected) {
        const type = getSupportedEvidenceType(file);
        if (!type) {
          rejected.push(`${file.name}: choose a PDF or image file.`);
          continue;
        }
        if (file.size === 0 || file.size > 15 * 1024 * 1024) {
          rejected.push(`${file.name}: files must be 15 MB or smaller and not empty.`);
          continue;
        }
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const record: EvidenceFileRecord = {
          id,
          studentId: STUDENT_ID,
          courseId: selectedCourseId,
          name: file.name,
          size: file.size,
          type,
          addedAt: new Date().toISOString(),
          blob: file,
        };
        try {
          await saveEvidenceFile(record);
          added.push(record);
        } catch {
          rejected.push(`${file.name}: the browser could not save this file.`);
        }
      }
      if (added.length) {
        setFiles((current) => [...added, ...current]);
        setNotice(`${added.length} ${added.length === 1 ? 'file' : 'files'} saved in this browser.`);
      }
      if (rejected.length) setError(rejected.join(' '));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (id: string) => {
    setError('');
    setDeletingId(id);
    try {
      await deleteEvidenceFile(id);
      setFiles((current) => current.filter((file) => file.id !== id));
      setNotice('Evidence file deleted from this browser.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete this evidence file.');
    } finally {
      setDeletingId(null);
    }
  };

  const exportReadiness = () => {
    const readiness = buildReadinessExport(
      STUDENT_ID,
      STUDENT_NAME,
      courses.map((course) => ({ id: course.id, title: course.title, lessonIds: course.lessons.map((lesson) => lesson.id) })),
      completedLessons,
      quizRecord.attempts,
      files,
    );
    const blob = new Blob([JSON.stringify(readiness, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'raisa-butti-readiness.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Readiness JSON exported. Evidence references are local to this browser.');
  };

  return (
    <div className="page-content">
      <div className="eyebrow">Show what you can do</div>
      <div className="page-heading-row evidence-heading">
        <div><h1 className="page-title">My evidence</h1><p className="page-intro">Keep a personal record of work that demonstrates your growing skills.</p></div>
        <button type="button" className="outline-button export-button" data-testid="button-export-readiness" onClick={exportReadiness}><Download size={14} /> Export readiness JSON</button>
      </div>
      <section className="panel evidence-panel" aria-labelledby="evidence-upload-heading">
        <div className="section-heading"><h2 id="evidence-upload-heading">Add a piece of evidence</h2><span className="status-pill">Saved in this browser</span></div>
        <div className="storage-notice"><strong>Local classroom demo</strong><span>Real files are saved in this browser only. They are not shared with other devices or students.</span></div>
        {legacyFileCount > 0 && <p className="legacy-notice" role="status" data-testid="legacy-evidence-notice">{legacyFileCount} earlier filename-only {legacyFileCount === 1 ? 'entry was' : 'entries were'} not treated as uploaded files. Select those files again to save their contents.</p>}
        <div className="drop-zone">
          <div className="upload-icon"><Upload size={19} /></div>
          <strong>Choose a PDF or image to save</strong>
          <p>Up to 15 MB each. Examples: a CV draft, project, reflection, or certificate.</p>
          <label className="course-select-label">Related course
            <select aria-label="Related course" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.currentTarget.value)} data-testid="select-evidence-course">
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label className="file-input-label" data-testid="label-select-evidence"><Upload size={14} /> Choose file
            <input type="file" accept=".pdf,image/*" multiple aria-label="Choose PDF or image evidence files" data-testid="input-evidence-files" disabled={uploading || loading} onChange={addFiles} />
          </label>
          {uploading && <p role="status" className="uploading-note" data-testid="evidence-uploading">Saving file contents in this browser…</p>}
        </div>
        {notice && <p role="status" className="evidence-notice" data-testid="evidence-notice">{notice}</p>}
        {error && <p role="alert" className="evidence-error" data-testid="evidence-error">{error}</p>}
        <div className="evidence-list">
          <div className="section-heading"><h2>Your evidence list</h2><span className="course-meta" data-testid="evidence-count">{loading ? 'Loading…' : `${files.length} ${files.length === 1 ? 'file' : 'files'}`}</span></div>
          {loading ? <div className="empty-state" data-testid="evidence-loading">Loading saved evidence from this browser…</div> :
            files.length ? files.map((file) => <EvidenceRow key={file.id} file={file} onDelete={removeFile} deleting={deletingId === file.id} />) :
              <div className="empty-state" data-testid="empty-evidence"><strong>Your evidence list is ready</strong>Choose a PDF or image above to save its contents in this browser.</div>}
        </div>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return <div className="page-content"><div className="eyebrow">Learning space</div><h1 className="page-title">This page isn’t here</h1><p className="page-intro">Use the navigation to return to your learning space.</p><Link href="/" className="welcome-cta" style={{ display: 'inline-flex', marginTop: 20 }} data-testid="link-return-dashboard">Back to dashboard <ArrowRight size={14} /></Link></div>;
}

function RoutedPages() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/courses" component={CoursesPage} />
        <Route path="/courses/:courseId" component={CourseDetailPage} />
        <Route path="/quizzes" component={QuizzesPage} />
        <Route path="/evidence" component={EvidencePage} />
        <Route component={NotFoundPage} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedPages /></WouterRouter>;
}

export default App;
