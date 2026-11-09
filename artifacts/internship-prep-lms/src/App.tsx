import { useState, type ReactNode, type FormEvent, type ChangeEvent } from 'react';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Check, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, FileText, GraduationCap, LayoutDashboard, Menu,
  MessageSquareText, Paperclip, Upload, X,
} from 'lucide-react';

type Course = { id: string; title: string; description: string; lessons: number; duration: string; icon: typeof FileText };
type Task = { id: string; courseId: string; title: string; due: string };
type EvidenceFile = { id: string; name: string; size: number; type: string; addedAt: string };

const courses: Course[] = [
  { id: 'cv', title: 'CV Writing', description: 'Build a clear, confident CV that puts your experience and strengths in the right light.', lessons: 4, duration: '35 min', icon: FileText },
  { id: 'interview', title: 'Interview Preparation', description: 'Prepare thoughtful answers, settle your nerves, and make a strong first impression.', lessons: 5, duration: '45 min', icon: BriefcaseBusiness },
  { id: 'workplace', title: 'Workplace Communication', description: 'Practice the everyday communication skills that help you thrive on a new team.', lessons: 4, duration: '30 min', icon: MessageSquareText },
];
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

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

function useStoredState<T>(key: string, fallback: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));
  const update = (next: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      try { localStorage.setItem(key, JSON.stringify(resolved)); } catch { /* The demo still works for this visit. */ }
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
  const currentTitle = nav.find((item) => item.href === location)?.label ?? 'Page not found';

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
            <div className="avatar" aria-label="Raisa Butti initials">RB</div>
            <div className="profile-copy"><div className="profile-name">Raisa Butti</div><div className="profile-role">Undergraduate student</div></div>
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

function Dashboard() {
  const [enrolled, setEnrolled] = useStoredState<string[]>('prep-enrolled', ['cv', 'interview']);
  const [completedTasks, setCompletedTasks] = useStoredState<string[]>('prep-tasks', ['cv-draft', 'interview-intro']);
  const [quizScore] = useStoredState<number | null>('prep-quiz-score', null);
  const completedCount = completedTasks.length;
  const overallProgress = Math.round((completedCount / tasks.length) * 100);

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
        <div className="stat-box" data-testid="stat-overall-progress"><div className="stat-label">Overall progress</div><div className="stat-value">{overallProgress}%</div><div className="stat-caption">Across your learning tasks</div></div>
        <div className="stat-box" data-testid="stat-enrolled-courses"><div className="stat-label">Courses enrolled</div><div className="stat-value">{enrolled.length} <span style={{ fontSize: 13, fontWeight: 500, color: '#87929c' }}>/ 3</span></div><div className="stat-caption">Keep building your toolkit</div></div>
        <div className="stat-box" data-testid="stat-completed-tasks"><div className="stat-label">Tasks completed</div><div className="stat-value">{completedCount}<span style={{ fontSize: 13, fontWeight: 500, color: '#87929c' }}> / {tasks.length}</span></div><div className="stat-caption">One step at a time</div></div>
      </div>

      <div className="dashboard-grid">
        <section aria-labelledby="enrolled-heading">
          <div className="section-heading"><h2 id="enrolled-heading">Your courses</h2><Link href="/courses" className="text-link" data-testid="link-all-courses">All courses <ArrowRight size={13} /></Link></div>
          <div className="panel course-list">
            {enrolled.length ? courses.filter((course) => enrolled.includes(course.id)).map((course) => {
              const Icon = course.icon;
              const related = tasks.filter((task) => task.courseId === course.id);
              const progress = Math.round((related.filter((task) => completedTasks.includes(task.id)).length / related.length) * 100);
              return (
                <div className="course-row" key={course.id} data-testid={`dashboard-course-${course.id}`}>
                  <div className="course-icon"><Icon size={19} /></div>
                  <div>
                    <div className="course-name">{course.title}</div>
                    <div className="course-meta">{course.lessons} short lessons · {course.duration}</div>
                    <div className="row-progress"><ProgressBar value={progress} testId={`progress-course-${course.id}`} /><span className="progress-label">{progress}%</span></div>
                  </div>
                  <Link href={course.id === 'cv' ? '/quizzes' : '/courses'} className="outline-button" data-testid={`link-continue-${course.id}`}>{course.id === 'cv' ? 'Continue' : 'View course'}</Link>
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
  const [enrolled, setEnrolled] = useStoredState<string[]>('prep-enrolled', ['cv', 'interview']);
  const [completedTasks] = useStoredState<string[]>('prep-tasks', ['cv-draft', 'interview-intro']);
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
          const related = tasks.filter((task) => task.courseId === course.id);
          const progress = Math.round((related.filter((task) => completedTasks.includes(task.id)).length / related.length) * 100);
          return (
            <article className="panel course-card" key={course.id} data-testid={`course-card-${course.id}`}>
              <div className="course-card-top"><div className="course-card-icon"><Icon size={21} /></div><span className={`status-pill${isEnrolled ? ' active' : ''}`} data-testid={`status-course-${course.id}`}>{isEnrolled ? 'Enrolled' : 'Available'}</span></div>
              <h2>{course.title}</h2><p>{course.description}</p>
              {isEnrolled && <div className="course-progress-wrap"><div className="course-progress-label"><span>Your progress</span><span data-testid={`course-percent-${course.id}`}>{progress}%</span></div><ProgressBar value={progress} testId={`courses-progress-${course.id}`} /></div>}
              <div className="course-card-bottom">
                <span className="course-length"><Clock3 size={13} /> {course.lessons} lessons · {course.duration}</span>
                <button type="button" className={isEnrolled ? 'quiet-button' : 'primary-button'} data-testid={`button-${isEnrolled ? 'unenroll' : 'enroll'}-${course.id}`} onClick={() => toggleEnrollment(course.id)}>
                  {isEnrolled ? 'Leave course' : 'Enroll'}
                </button>
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

function QuizzesPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useStoredState<number | null>('prep-quiz-score', null);
  const [message, setMessage] = useState('');
  const submitted = score !== null;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(answers).length !== quizQuestions.length) {
      setMessage('Choose one answer for each question before submitting.');
      return;
    }
    const result = quizQuestions.reduce((total, question, index) => total + (answers[index] === question.correct ? 1 : 0), 0);
    setScore(result);
    setMessage('');
  };
  const resetQuiz = () => { setAnswers({}); setScore(null); setMessage(''); };

  return (
    <div className="page-content">
      <div className="eyebrow">Check what you know</div>
      <h1 className="page-title">Knowledge checks</h1>
      <p className="page-intro">A few quick questions help the key ideas stick.</p>
      <form className="panel quiz-card" onSubmit={handleSubmit} noValidate>
        <div className="quiz-progress-top"><span><strong style={{ color: '#25415e' }}>CV Writing</strong> · Knowledge check</span><span>3 questions · about 2 min</span></div>
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
        {submitted && <div className="quiz-result" role="status" data-testid="quiz-result"><strong>You scored {score} out of {quizQuestions.length}</strong><p>{score === 3 ? 'Excellent work. You have a strong grasp of CV essentials.' : score >= 2 ? 'Good progress. Review the highlighted answers and keep going.' : 'A useful first try. Take another look through the CV Writing course and try again.'}</p></div>}
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

function EvidencePage() {
  const [files, setFiles] = useStoredState<EvidenceFile[]>('prep-evidence', []);
  const [notice, setNotice] = useState('');
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    if (selected.length) {
      const added = selected.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'File',
        addedAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      }));
      setFiles((current) => [...current, ...added]);
      setNotice(`${added.length} ${added.length === 1 ? 'file' : 'files'} added to your evidence list.`);
      event.currentTarget.value = '';
    }
  };
  const removeFile = (id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
    setNotice('Evidence item removed.');
  };

  return (
    <div className="page-content">
      <div className="eyebrow">Show what you can do</div>
      <h1 className="page-title">My evidence</h1>
      <p className="page-intro">Keep a personal record of work that demonstrates your growing skills.</p>
      <section className="panel evidence-panel" aria-labelledby="evidence-upload-heading">
        <div className="section-heading"><h2 id="evidence-upload-heading">Add a piece of evidence</h2><span className="status-pill">Saved on this device</span></div>
        <div className="drop-zone">
          <div className="upload-icon"><Upload size={19} /></div>
          <strong>Choose a file to add to your list</strong>
          <p>Examples: a CV draft, project, reflection, or certificate.</p>
          <label className="file-input-label" data-testid="label-select-evidence"><Upload size={14} /> Choose file
            <input type="file" multiple aria-label="Choose evidence files" data-testid="input-evidence-files" onChange={addFiles} />
          </label>
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 10 }}>Only the filename and file details are saved here. File contents are not uploaded.</p>
        </div>
        {notice && <p role="status" style={{ color: '#527460', fontSize: 11, margin: '12px 0 0' }} data-testid="evidence-notice">{notice}</p>}
        <div className="evidence-list">
          <div className="section-heading"><h2>Your evidence list</h2><span className="course-meta" data-testid="evidence-count">{files.length} {files.length === 1 ? 'item' : 'items'}</span></div>
          {files.length ? files.map((file) => (
            <div className="evidence-row" key={file.id} data-testid={`evidence-item-${file.id}`}>
              <div className="file-type-icon"><FileText size={17} /></div>
              <div className="file-info"><div className="file-name" title={file.name} data-testid={`evidence-filename-${file.id}`}>{file.name}</div><div className="file-meta">{formatSize(file.size)} · {file.type} · Added {file.addedAt}</div></div>
              <button type="button" className="danger-button" aria-label={`Remove ${file.name}`} data-testid={`button-remove-evidence-${file.id}`} onClick={() => removeFile(file.id)}>Remove</button>
            </div>
          )) : <div className="empty-state" data-testid="empty-evidence"><strong>Your evidence list is ready</strong>Choose a file above to add its details to this device.</div>}
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
