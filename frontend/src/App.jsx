import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  Bell,
  BookmarkPlus,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Database, 
  FileSearch,
  FileText,
  FlaskConical,
  Gauge,
  GraduationCap,
  Headphones,
  Home,
  Library,
  Lightbulb,
  Link2,
  LoaderCircle,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Network,
  NotebookPen,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users, 
  X,
  Zap,
} from "lucide-react";

import "./paper-workspace.css";
import PaperNotesPanel from "./components/PaperNotesPanel.jsx";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\\/$/, "");

/* =========================================================
   NAVIGATION
========================================================= */

const navigation = [
  {
    section: "Workspace",
    items: [
      { id: "today", label: "Today", icon: Home },
      { id: "papers", label: "Papers", icon: Library },
      { id: "knowledge", label: "Knowledge", icon: Network },
      { id: "gaps", label: "Research Gaps", icon: Lightbulb },
      { id: "experiments", label: "Experiments", icon: FlaskConical },
    ],
  },
  {
    section: "Learning",
    items: [
      { id: "learn", label: "Learn", icon: GraduationCap },
      { id: "review", label: "Review", icon: Brain },
      { id: "audio", label: "Audio", icon: Headphones },
      { id: "viva", label: "Viva", icon: MessageSquare },
    ],
  },
  {
    section: "Writing",
    items: [
      { id: "manuscript", label: "Manuscript", icon: NotebookPen },
      { id: "thesis", label: "Thesis", icon: FileText },
    ],
  },
];

/* =========================================================
   PROJECTS
========================================================= */

const projects = [
  {
    id: "all",
    name: "All research",
    color: "#667085",
  },
  {
    id: "project-1",
    name: "Research Methods",
    color: "#6B7CFF",
  },
  {
    id: "project-2",
    name: "Machine Learning",
    color: "#7C9A92",
  },
  {
    id: "project-3",
    name: "Computer Vision",
    color: "#B28B67",
  },
];

/* =========================================================
   STATIC DATA
========================================================= */

const fallbackPapers = [
  {
    id: 1,
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    year: 2017,
    journal: "NeurIPS",
    project: "Machine Learning",
    progress: 68,
    status: "Reading",
    tags: ["Transformers", "Attention"],
  },
];

const gaps = [
  {
    title: "Limited cross-domain generalisation",
    description:
      "Several studies report strong performance within their source dataset but provide limited evidence across independent populations.",
    source: "3 papers",
    category: "Methodological",
    status: "Exploring",
  },
  {
    title: "Interpretability remains fragmented",
    description:
      "Model explanations are often presented independently from the underlying representation or structural information.",
    source: "5 papers",
    category: "Research opportunity",
    status: "Open",
  },
  {
    title: "Evaluation protocols vary considerably",
    description:
      "Different studies use different splits, metrics and validation strategies, making direct comparison difficult.",
    source: "7 papers",
    category: "Methodological",
    status: "Tracking",
  },
];

const learningTasks = [
  {
    id: 1,
    title: "Understand attention mechanisms",
    type: "Deep Dive",
    duration: "35 min",
    progress: 72,
    icon: Brain,
  },
  {
    id: 2,
    title: "Read Methods section",
    type: "Paper Walkthrough",
    duration: "25 min",
    progress: 34,
    icon: BookOpen,
  },
  {
    id: 3,
    title: "Review transformer concepts",
    type: "Recall",
    duration: "15 min",
    progress: 0,
    icon: Zap,
  },
];

const experiments = [
  {
    name: "Baseline model",
    project: "Computer Vision",
    status: "Completed",
    metric: "Accuracy",
    value: "87.4%",
  },
  {
    name: "Attention ablation",
    project: "Computer Vision",
    status: "Running",
    metric: "Validation",
    value: "91.2%",
  },
  {
    name: "Transfer learning study",
    project: "Machine Learning",
    status: "Planned",
    metric: "—",
    value: "—",
  },
];

/* =========================================================
   APP
========================================================= */

function App() {
  const [activePage, setActivePage] = useState("today");
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("all");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const currentProject =
    projects.find(
      (project) => project.id === selectedProject
    ) || projects[0];

  const pageTitle = useMemo(() => {
    const allItems = navigation.flatMap(
      (section) => section.items
    );

    return (
      allItems.find(
        (item) => item.id === activePage
      )?.label || "Today"
    );
  }, [activePage]);

  function navigate(page) {
    setActivePage(page);
    setSelectedPaperId(null);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        navigate={navigate}
        sidebarOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      <main className="main-area">
        <Topbar
          pageTitle={pageTitle}
          currentProject={currentProject}
          projectMenuOpen={projectMenuOpen}
          setProjectMenuOpen={setProjectMenuOpen}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          openSidebar={() => setSidebarOpen(true)}
        />

        <div className="page-container">
          {activePage === "today" &&
            !selectedPaperId && (
              <TodayPage navigate={navigate} />
            )}

          {activePage === "papers" &&
            !selectedPaperId && (
              <PapersPage
                onOpenPaper={(paperId) =>
                  setSelectedPaperId(paperId)
                }
              />
            )}

          {selectedPaperId && (
            <PaperWorkspace
              paperId={selectedPaperId}
              onBack={() =>
                setSelectedPaperId(null)
              }
            />
          )}

          {activePage === "knowledge" && (
            <KnowledgePage />
          )}

          {activePage === "gaps" && (
            <ResearchGapsPage />
          )}

          {activePage === "experiments" && (
            <ExperimentsPage />
          )}

          {activePage === "learn" && (
            <LearnPage />
          )}

          {activePage === "review" && (
            <ReviewPage />
          )}

          {activePage === "audio" && (
            <AudioPage />
          )}

          {activePage === "viva" && (
            <VivaPage />
          )}

          {activePage === "manuscript" && (
            <ManuscriptPage />
          )}

          {activePage === "thesis" && (
            <ThesisPage />
          )}
        </div>
      </main>

      <button
        className="mobile-overlay"
        aria-label="Close menu"
        onClick={() =>
          setSidebarOpen(false)
        }
        style={{
          display: sidebarOpen
            ? "block"
            : "none",
        }}
      />
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  activePage,
  navigate,
  sidebarOpen,
  closeSidebar,
}) {
  return (
    <aside
      className={`sidebar ${
        sidebarOpen ? "sidebar-open" : ""
      }`}
    >
      <div className="sidebar-header">
        <div className="brand-mark">
          <Sparkles
            size={18}
            strokeWidth={2.2}
          />
        </div>

        <div className="brand-text">
          <strong>PhD Companion</strong>
          <span>Research OS</span>
        </div>

        <button
          className="mobile-close"
          onClick={closeSidebar}
        >
          <X size={19} />
        </button>
      </div>

      <div className="sidebar-project">
        <div className="project-dot" />

        <div>
          <span>Current workspace</span>
          <strong>Research Hub</strong>
        </div>

        <ChevronDown size={15} />
      </div>

      <nav className="sidebar-nav">
        {navigation.map((section) => (
          <div
            className="nav-section"
            key={section.section}
          >
            <div className="nav-section-title">
              {section.section}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const active =
                activePage === item.id;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${
                    active ? "active" : ""
                  }`}
                  onClick={() =>
                    navigate(item.id)
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={
                      active ? 2.1 : 1.8
                    }
                  />

                  <span>{item.label}</span>

                  {item.id === "gaps" && (
                    <span className="nav-count">
                      3
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-progress">
          <div className="sidebar-progress-top">
            <span>PhD progress</span>
            <strong>18%</strong>
          </div>

          <div className="mini-progress">
            <span
              style={{
                width: "18%",
              }}
            />
          </div>

          <small>
            Year 1 · Building foundations
          </small>
        </div>

        <button className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="profile-row">
          <div className="avatar">HM</div>

          <div>
            <strong>Researcher</strong>
            <span>PhD Scholar</span>
          </div>

          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar({
  pageTitle,
  currentProject,
  projectMenuOpen,
  setProjectMenuOpen,
  selectedProject,
  setSelectedProject,
  searchOpen,
  setSearchOpen,
  openSidebar,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu"
          onClick={openSidebar}
        >
          <Menu size={21} />
        </button>

        <div>
          <div className="breadcrumb">
            Research Hub
          </div>

          <h1>{pageTitle}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="project-selector">
          <button
            className="project-selector-button"
            onClick={() =>
              setProjectMenuOpen(
                !projectMenuOpen
              )
            }
          >
            <span
              className="selector-dot"
              style={{
                background:
                  currentProject.color,
              }}
            />

            {currentProject.name}

            <ChevronDown size={15} />
          </button>

          {projectMenuOpen && (
            <div className="project-menu">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(
                      project.id
                    );
                    setProjectMenuOpen(false);
                  }}
                >
                  <span
                    className="selector-dot"
                    style={{
                      background:
                        project.color,
                    }}
                  />

                  {project.name}

                  {selectedProject ===
                    project.id && (
                    <Check size={15} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="icon-button"
          onClick={() =>
            setSearchOpen(!searchOpen)
          }
          aria-label="Search"
        >
          <Search size={19} />
        </button>

        <button
          className="icon-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="top-avatar">HM</div>
      </div>

      {searchOpen && (
        <div className="global-search">
          <Search size={19} />

          <input
            autoFocus
            placeholder="Search papers, concepts, notes, gaps..."
          />

          <span>⌘ K</span>
        </div>
      )}
    </header>
  );
}

/* =========================================================
   TODAY
========================================================= */

function TodayPage({ navigate }) {
  return (
    <div className="page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            Thursday · September 19
          </div>

          <h2>Good afternoon.</h2>

          <p className="welcome-subtitle">
            Keep your research moving with one
            focused session at a time.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("learn")
          }
        >
          <Play
            size={16}
            fill="currentColor"
          />
          Start today's session
        </button>
      </section>

      <section className="hero-grid">
        <div className="focus-card">
          <div className="focus-card-header">
            <div>
              <span className="card-label">
                Today's focus
              </span>

              <h3>
                Understand attention mechanisms
              </h3>
            </div>

            <div className="focus-icon">
              <Brain size={22} />
            </div>
          </div>

          <p>
            Build a clear mental model of how
            attention works before moving deeper
            into transformers and vision
            architectures.
          </p>

          <div className="focus-meta">
            <span>
              <Clock3 size={15} />
              35 minutes
            </span>

            <span>
              <Brain size={15} />
              Deep Dive
            </span>

            <span>
              <Target size={15} />
              Priority
            </span>
          </div>

          <div className="focus-bottom">
            <div className="progress-section">
              <div className="progress-header">
                <span>Understanding</span>
                <strong>72%</strong>
              </div>

              <div className="progress-track">
                <span
                  style={{
                    width: "72%",
                  }}
                />
              </div>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate("learn")
              }
            >
              Continue{" "}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="card-label">
              This week
            </span>

            <Activity size={19} />
          </div>

          <div className="weekly-number">
            6.4h
          </div>

          <p>research & learning</p>

          <div className="week-bars">
            {[40, 65, 52, 78, 90, 46, 25].map(
              (height, index) => (
                <div
                  className="week-day"
                  key={index}
                >
                  <div className="week-bar">
                    <span
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <small>
                    {
                      [
                        "M",
                        "T",
                        "W",
                        "T",
                        "F",
                        "S",
                        "S",
                      ][index]
                    }
                  </small>
                </div>
              )
            )}
          </div>

          <div className="stats-footer">
            <span>Goal</span>
            <strong>8h / week</strong>
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <span className="eyebrow">
            Your queue
          </span>

          <h3>Continue learning</h3>
        </div>

        <button
          className="ghost-button"
          onClick={() =>
            navigate("learn")
          }
        >
          View all{" "}
          <ArrowRight size={15} />
        </button>
      </div>

      <section className="learning-grid">
        {learningTasks.map((task) => {
          const Icon = task.icon;

          return (
            <button
              className="learning-card"
              key={task.id}
              onClick={() =>
                navigate("learn")
              }
            >
              <div className="learning-card-top">
                <div className="learning-icon">
                  <Icon size={19} />
                </div>

                <span className="learning-type">
                  {task.type}
                </span>
              </div>

              <h4>{task.title}</h4>

              <div className="learning-card-bottom">
                <span>
                  <Clock3 size={14} />
                  {task.duration}
                </span>

                <span>
                  {task.progress}%
                </span>
              </div>

              <div className="tiny-progress">
                <span
                  style={{
                    width: `${task.progress}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </section>

      <div className="dashboard-columns">
        <section>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">
                Library
              </span>

              <h3>Recently opened</h3>
            </div>

            <button
              className="ghost-button"
              onClick={() =>
                navigate("papers")
              }
            >
              Papers{" "}
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="recent-list">
            {fallbackPapers.map((paper) => (
              <PaperListItem
                paper={paper}
                key={paper.id}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">
                Research thinking
              </span>

              <h3>Open gaps</h3>
            </div>

            <button
              className="ghost-button"
              onClick={() =>
                navigate("gaps")
              }
            >
              Explore{" "}
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="gap-preview">
            {gaps.slice(0, 2).map((gap) => (
              <div
                className="gap-preview-item"
                key={gap.title}
              >
                <div className="gap-bullet">
                  <Lightbulb size={15} />
                </div>

                <div>
                  <strong>
                    {gap.title}
                  </strong>

                  <span>
                    {gap.source}
                  </span>
                </div>

                <ArrowRight size={15} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   PAPERS
========================================================= */

function PapersPage({ onOpenPaper }) {
  const [papers, setPapers] = useState(
    fallbackPapers
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [uploadOpen, setUploadOpen] =
    useState(false);

  const [groupBy, setGroupBy] =
    useState("all");

  async function loadPapers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/papers/`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load papers."
        );
      }

      const data =
        await response.json();

      if (Array.isArray(data)) {
        setPapers(data);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Could not load your paper library from the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, []);

  async function handleUploadComplete() {
    setUploadOpen(false);
    await loadPapers();
  }

  function getPaperTopics(paper) {
    if (Array.isArray(paper.tags)) {
      return paper.tags.length
        ? paper.tags
        : ["Uncategorized"];
    }

    if (!paper.tags) {
      return ["Uncategorized"];
    }

    const topics = paper.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return topics.length
      ? topics
      : ["Uncategorized"];
  }

  function getPaperNotesCount(paper) {
    const noteFields = [
      "notes",
      "research_problem",
      "methodology_notes",
      "key_findings",
      "research_gap",
      "limitations",
      "relevance",
      "personal_thoughts",
    ];

    return noteFields.filter(
      (field) =>
        typeof paper[field] === "string" &&
        paper[field].trim().length > 0
    ).length;
  }

  const groupedPapers = useMemo(() => {
    if (groupBy === "all") {
      return [
        {
          label: "All papers",
          papers,
        },
      ];
    }

    if (groupBy === "topic") {
      const groups = {};

      papers.forEach((paper) => {
        const topics = getPaperTopics(paper);

        topics.forEach((topic) => {
          if (!groups[topic]) {
            groups[topic] = [];
          }

          groups[topic].push(paper);
        });
      });

      return Object.entries(groups)
        .sort(([a], [b]) =>
          a.localeCompare(b)
        )
        .map(([label, grouped]) => ({
          label,
          papers: grouped,
        }));
    }

    if (groupBy === "status") {
      const groups = {};

      papers.forEach((paper) => {
        const status =
          paper.status || "To Read";

        if (!groups[status]) {
          groups[status] = [];
        }

        groups[status].push(paper);
      });

      return Object.entries(groups)
        .sort(([a], [b]) =>
          a.localeCompare(b)
        )
        .map(([label, grouped]) => ({
          label,
          papers: grouped,
        }));
    }

    if (groupBy === "year") {
      const groups = {};

      papers.forEach((paper) => {
        const year =
          paper.year || "Year not available";

        if (!groups[year]) {
          groups[year] = [];
        }

        groups[year].push(paper);
      });

      return Object.entries(groups)
        .sort(([a], [b]) =>
          String(b).localeCompare(
            String(a),
            undefined,
            { numeric: true }
          )
        )
        .map(([label, grouped]) => ({
          label,
          papers: grouped,
        }));
    }

    return [
      {
        label: "All papers",
        papers,
      },
    ];
  }, [papers, groupBy]);

  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Research library
          </span>

          <h2>Your papers</h2>

          <p className="welcome-subtitle">
            Build your personal research
            library and keep your reading,
            notes and progress together.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setUploadOpen(true)
          }
        >
          <Upload size={16} />
          Upload paper
        </button>
      </section>

      {loading && (
        <div className="inline-status">
          <LoaderCircle
            size={18}
            className="spin"
          />

          Loading your paper library...
        </div>
      )}

      {error && (
        <div className="soft-notice">
          {error}
        </div>
      )}

      {!loading && papers.length > 0 && (
        <div className="paper-library-toolbar">
          <div>
            <span className="paper-library-count">
              {papers.length}{" "}
              {papers.length === 1
                ? "paper"
                : "papers"}
            </span>

            <span className="paper-library-toolbar-text">
              Organise your research library
            </span>
          </div>

          <label className="paper-group-control">
            <span>Group by</span>

            <div className="paper-group-select">
              <select
                value={groupBy}
                onChange={(event) =>
                  setGroupBy(
                    event.target.value
                  )
                }
                aria-label="Group papers by"
              >
                <option value="all">
                  All papers
                </option>

                <option value="topic">
                  Topic
                </option>

                <option value="status">
                  Status
                </option>

                <option value="year">
                  Year
                </option>
              </select>

              <ChevronDown size={15} />
            </div>
          </label>
        </div>
      )}

      {!loading && papers.length === 0 && (
        <div className="paper-library-empty">
          <div className="paper-library-empty-icon">
            <Library size={25} />
          </div>

          <h3>
            Your paper library is empty
          </h3>

          <p>
            Upload your first research
            paper to start building your
            PhD knowledge base.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              setUploadOpen(true)
            }
          >
            <Upload size={16} />
            Upload your first paper
          </button>
        </div>
      )}

      {!loading &&
        groupedPapers.map((group) => (
          <section
            className="paper-library-group"
            key={group.label}
          >
            {groupBy !== "all" && (
              <div className="paper-library-group-heading">
                <div>
                  <span className="eyebrow">
                    {groupBy === "topic"
                      ? "Research topic"
                      : groupBy === "status"
                      ? "Reading status"
                      : "Publication year"}
                  </span>

                  <h3>{group.label}</h3>
                </div>

                <span className="paper-group-count">
                  {group.papers.length}{" "}
                  {group.papers.length === 1
                    ? "paper"
                    : "papers"}
                </span>
              </div>
            )}

            <section className="paper-library-grid">
              {group.papers.map((paper) => (
                <button
                  className="paper-library-card"
                  key={`${group.label}-${paper.id}`}
                  onClick={() =>
                    onOpenPaper(paper.id)
                  }
                >
                  <div className="paper-card-top">
                    <div className="paper-card-icon">
                      <FileText size={21} />
                    </div>

                    <span className="paper-status">
                      {paper.status ||
                        "To Read"}
                    </span>
                  </div>

                  <h3>{paper.title}</h3>

                  <p>
                    {paper.authors ||
                      "Authors not available"}
                  </p>

                  <div className="paper-card-meta">
                    {paper.year && (
                      <span>{paper.year}</span>
                    )}

                    {paper.journal && (
                      <>
                        <span>·</span>

                        <span>
                          {paper.journal}
                        </span>
                      </>
                    )}
                  </div>

                  {paper.tags && (
                    <div className="paper-card-tags">
                      {getPaperTopics(paper)
                        .slice(0, 3)
                        .map((topic) => (
                          <span key={topic}>
                            {topic}
                          </span>
                        ))}
                    </div>
                  )}

                  {(() => {
                    const notesCount =
                      getPaperNotesCount(paper);

                    return (
                      <div
                        className={`paper-card-notes ${
                          notesCount > 0
                            ? "has-notes"
                            : "no-notes"
                        }`}
                      >
                        <NotebookPen size={13} />
                        <span>
                          {notesCount > 0
                            ? `${notesCount} ${
                                notesCount === 1
                                  ? "note"
                                  : "notes"
                              } added`
                            : "No notes yet"}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="paper-card-bottom">
                    <div className="tiny-progress">
                      <span
                        style={{
                          width: `${paper.progress ?? 0}%`,
                        }}
                      />
                    </div>

                    <span>
                      {paper.progress ?? 0}%
                    </span>
                  </div>

                  <div className="paper-open-label">
                    Open paper
                    <ArrowRight size={15} />
                  </div>
                </button>
              ))}
            </section>
          </section>
        ))}

      {uploadOpen && (
        <UploadPaperModal
          onClose={() =>
            setUploadOpen(false)
          }
          onUploaded={
            handleUploadComplete
          }
        />
      )}
    </div>
  );
}


/* =========================================================
   UPLOAD PAPER MODAL
========================================================= */

function UploadPaperModal({
  onClose,
  onUploaded,
}) {
  const [file, setFile] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [authors, setAuthors] =
    useState("");

  const [year, setYear] =
    useState("");

  const [journal, setJournal] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  function selectFile(selectedFile) {
    setError("");

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setError(
        "Please select a PDF file."
      );

      return;
    }

    setFile(selectedFile);
  }

  function handleFileChange(event) {
    selectFile(
      event.target.files?.[0]
    );
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragActive(false);

    selectFile(
      event.dataTransfer.files?.[0]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError(
        "Please choose a PDF file first."
      );

      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      if (title.trim()) {
        formData.append(
          "title",
          title.trim()
        );
      }

      if (authors.trim()) {
        formData.append(
          "authors",
          authors.trim()
        );
      }

      if (year.trim()) {
        formData.append(
          "year",
          year.trim()
        );
      }

      if (journal.trim()) {
        formData.append(
          "journal",
          journal.trim()
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/papers/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Could not upload the paper (${response.status}).`
        );
      }

      await onUploaded(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong while uploading the paper."
      );
    } finally {
      setUploading(false);
    }
  }

  const modalStyles = `
    .phd-upload-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.48);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      overflow-y: auto;
    }

    .phd-upload-modal {
      width: min(720px, 100%);
      max-height: min(860px, calc(100vh - 48px));
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid #e7eaf0;
      border-radius: 24px;
      box-shadow:
        0 24px 70px rgba(15, 23, 42, 0.20),
        0 8px 24px rgba(15, 23, 42, 0.08);
      padding: 28px;
      box-sizing: border-box;
      color: #172033;
    }

    .phd-upload-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }

    .phd-upload-header-copy {
      min-width: 0;
    }

    .phd-upload-eyebrow {
      display: block;
      margin-bottom: 7px;
      font-size: 11px;
      line-height: 1.3;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: #667085;
    }

    .phd-upload-title {
      margin: 0;
      font-size: 26px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #172033;
    }

    .phd-upload-subtitle {
      margin: 8px 0 0;
      font-size: 14px;
      line-height: 1.6;
      color: #667085;
    }

    .phd-upload-close {
      flex: 0 0 auto;
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e6e8ee;
      border-radius: 12px;
      background: #ffffff;
      color: #667085;
      cursor: pointer;
      transition:
        background 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease;
    }

    .phd-upload-close:hover:not(:disabled) {
      background: #f6f7fb;
      color: #1f2937;
      border-color: #d9dce5;
    }

    .phd-upload-close:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .phd-upload-dropzone {
      position: relative;
      display: flex;
      min-height: 170px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 28px;
      box-sizing: border-box;
      border: 1.5px dashed #cfd4df;
      border-radius: 18px;
      background: #fafbff;
      text-align: center;
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        transform 0.15s ease;
    }

    .phd-upload-dropzone:hover {
      border-color: #8d9af8;
      background: #f7f8ff;
    }

    .phd-upload-dropzone-active {
      border-color: #667eea;
      background: #f3f5ff;
      transform: translateY(-1px);
    }

    .phd-upload-file-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 2;
    }

    .phd-upload-drop-icon {
      width: 46px;
      height: 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: #eef1ff;
      color: #5968e8;
      pointer-events: none;
    }

    .phd-upload-dropzone strong {
      max-width: 100%;
      overflow-wrap: anywhere;
      font-size: 15px;
      line-height: 1.45;
      font-weight: 650;
      color: #27304a;
      pointer-events: none;
    }

    .phd-upload-dropzone > span {
      font-size: 13px;
      line-height: 1.4;
      color: #8a93a5;
      pointer-events: none;
    }

    .phd-upload-fields {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 18px;
      margin-top: 22px;
    }

    .phd-upload-field {
      min-width: 0;
    }

    .phd-upload-field-wide {
      grid-column: 1 / -1;
    }

    .phd-upload-field-label {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 650;
      color: #344054;
    }

    .phd-upload-field-label span {
      font-weight: 500;
      color: #98a2b3;
      text-align: right;
    }

    .phd-upload-input {
      display: block;
      width: 100%;
      min-height: 46px;
      box-sizing: border-box;
      padding: 11px 13px;
      border: 1px solid #d7dbe4;
      border-radius: 12px;
      outline: none;
      background: #ffffff;
      color: #1f2937;
      font: inherit;
      font-size: 14px;
      line-height: 1.4;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        background 0.15s ease;
    }

    .phd-upload-input::placeholder {
      color: #a0a8b7;
    }

    .phd-upload-input:focus {
      border-color: #7b88f0;
      box-shadow: 0 0 0 4px rgba(102, 124, 255, 0.11);
    }

    .phd-upload-input:disabled {
      background: #f7f8fa;
      color: #98a2b3;
      cursor: not-allowed;
    }

    .phd-upload-error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 11px 13px;
      border: 1px solid #f1c7c7;
      border-radius: 12px;
      background: #fff7f7;
      color: #b42318;
      font-size: 13px;
      line-height: 1.45;
    }

    .phd-upload-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-top: 24px;
      padding-top: 22px;
      border-top: 1px solid #edf0f4;
    }

    .phd-upload-footer-note {
      max-width: 340px;
      font-size: 12px;
      line-height: 1.55;
      color: #8a93a5;
    }

    .phd-upload-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex: 0 0 auto;
    }

    .phd-upload-button {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 12px;
      font: inherit;
      font-size: 14px;
      font-weight: 650;
      cursor: pointer;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        background 0.15s ease,
        border-color 0.15s ease;
    }

    .phd-upload-button:active:not(:disabled) {
      transform: translateY(1px);
    }

    .phd-upload-secondary {
      border: 1px solid #d9dde7;
      background: #ffffff;
      color: #475467;
    }

    .phd-upload-secondary:hover:not(:disabled) {
      background: #f8f9fb;
      border-color: #c8cdd8;
    }

    .phd-upload-primary {
      border: 1px solid #667cff;
      background: #667cff;
      color: #ffffff;
      box-shadow: 0 8px 18px rgba(102, 124, 255, 0.18);
    }

    .phd-upload-primary:hover:not(:disabled) {
      background: #5b6ff0;
      border-color: #5b6ff0;
      box-shadow: 0 10px 22px rgba(102, 124, 255, 0.22);
    }

    .phd-upload-button:disabled {
      opacity: 0.52;
      cursor: not-allowed;
      box-shadow: none;
    }

    .phd-upload-spin {
      animation: phd-upload-spin 0.9s linear infinite;
    }

    @keyframes phd-upload-spin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 640px) {
      .phd-upload-overlay {
        padding: 12px;
        align-items: flex-start;
      }

      .phd-upload-modal {
        max-height: calc(100vh - 24px);
        padding: 20px;
        border-radius: 20px;
      }

      .phd-upload-title {
        font-size: 22px;
      }

      .phd-upload-fields {
        grid-template-columns: 1fr;
      }

      .phd-upload-field-wide {
        grid-column: auto;
      }

      .phd-upload-footer {
        align-items: stretch;
        flex-direction: column;
      }

      .phd-upload-footer-note {
        max-width: none;
      }

      .phd-upload-actions {
        width: 100%;
      }

      .phd-upload-button {
        flex: 1;
      }
    }
  `;

  return (
    <>
      <style>{modalStyles}</style>

      <div
        className="phd-upload-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <div className="phd-upload-modal">
          <div className="phd-upload-header">
            <div className="phd-upload-header-copy">
              <span className="phd-upload-eyebrow">
                Research library
              </span>

              <h3 className="phd-upload-title">
                Upload a research paper
              </h3>

              <p className="phd-upload-subtitle">
                Add a PDF to your permanent
                PhD paper library.
              </p>
            </div>

            <button
              type="button"
              className="phd-upload-close"
              onClick={onClose}
              disabled={uploading}
              title="Close"
              aria-label="Close upload dialog"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              className={`phd-upload-dropzone ${
                dragActive
                  ? "phd-upload-dropzone-active"
                  : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() =>
                setDragActive(false)
              }
              onDrop={handleDrop}
            >
              <input
                className="phd-upload-file-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />

              <div className="phd-upload-drop-icon">
                <Upload size={22} />
              </div>

              <strong>
                {file
                  ? file.name
                  : "Choose a PDF or drag it here"}
              </strong>

              <span>
                PDF files only
              </span>
            </label>

            <div className="phd-upload-fields">
              <div className="phd-upload-field phd-upload-field-wide">
                <label className="phd-upload-field-label">
                  <span
                    style={{
                      color: "#344054",
                      fontWeight: 650,
                    }}
                  >
                    Title
                  </span>

                  <span>
                    optional — extracted
                    automatically
                  </span>
                </label>

                <input
                  className="phd-upload-input"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Paper title"
                  disabled={uploading}
                />
              </div>

              <div className="phd-upload-field">
                <label className="phd-upload-field-label">
                  <span
                    style={{
                      color: "#344054",
                      fontWeight: 650,
                    }}
                  >
                    Authors
                  </span>

                  <span>optional</span>
                </label>

                <input
                  className="phd-upload-input"
                  value={authors}
                  onChange={(event) =>
                    setAuthors(
                      event.target.value
                    )
                  }
                  placeholder="Author names"
                  disabled={uploading}
                />
              </div>

              <div className="phd-upload-field">
                <label className="phd-upload-field-label">
                  <span
                    style={{
                      color: "#344054",
                      fontWeight: 650,
                    }}
                  >
                    Year
                  </span>

                  <span>optional</span>
                </label>

                <input
                  className="phd-upload-input"
                  type="number"
                  min="1900"
                  max="2100"
                  value={year}
                  onChange={(event) =>
                    setYear(
                      event.target.value
                    )
                  }
                  placeholder="2026"
                  disabled={uploading}
                />
              </div>

              <div className="phd-upload-field phd-upload-field-wide">
                <label className="phd-upload-field-label">
                  <span
                    style={{
                      color: "#344054",
                      fontWeight: 650,
                    }}
                  >
                    Journal / Conference
                  </span>

                  <span>optional</span>
                </label>

                <input
                  className="phd-upload-input"
                  value={journal}
                  onChange={(event) =>
                    setJournal(
                      event.target.value
                    )
                  }
                  placeholder="Journal or conference name"
                  disabled={uploading}
                />
              </div>
            </div>

            {error && (
              <div className="phd-upload-error">
                <X size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="phd-upload-footer">
              <span className="phd-upload-footer-note">
                Metadata can be extracted
                from the PDF automatically.
              </span>

              <div className="phd-upload-actions">
                <button
                  type="button"
                  className="phd-upload-button phd-upload-secondary"
                  onClick={onClose}
                  disabled={uploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="phd-upload-button phd-upload-primary"
                  disabled={
                    uploading ||
                    !file
                  }
                >
                  {uploading ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="phd-upload-spin"
                      />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Add to Library
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


function PaperListItem({ paper }) {
  return (
    <div className="recent-item">
      <div className="recent-icon">
        <FileText size={18} />
      </div>

      <div className="recent-content">
        <strong>{paper.title}</strong>

        <span>
          {paper.authors} · {paper.year}
        </span>
      </div>

      <ArrowRight size={15} />
    </div>
  );
}

/* =========================================================
   PAPER CONTENT FORMATTING
========================================================= */

function formatPaperContent(text) {
  if (!text) return [];

  const normalized = String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/([A-Za-z]{2,})-\s*\n\s*([A-Za-z]{2,})/g, "$1$2");

  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const looksLikeHeading = (line, index) => {
    const wordCount = line.split(/\s+/).length;
    const nextLine = lines[index + 1] || "";

    if (!line || line.length > 90 || wordCount > 12) return false;
    if (/^[\d\W]+$/.test(line)) return false;
    if (/[.!?;:]$/.test(line)) return false;
    if (!nextLine || nextLine.length < line.length) return false;

    const knownHeading = /^(data acquisition|external validation|study population|dataset|datasets|model architecture|training|validation|testing|statistical analysis|outcomes|results|discussion|conclusion|limitations|ablation study|experimental setup|implementation details|ethical considerations|participants|materials and methods|methods|methodology|introduction|background|related work)$/i.test(line);

    return knownHeading || /^[A-Z][A-Za-z0-9 ,()\-]+$/.test(line);
  };

  lines.forEach((line, index) => {
    if (looksLikeHeading(line, index)) {
      flushParagraph();
      blocks.push({ type: "heading", text: line });
      return;
    }

    paragraph.push(line);

    if (paragraph.join(" ").length > 1500) {
      flushParagraph();
    }
  });

  flushParagraph();
  return blocks;
}

/* =========================================================
   PAPER WORKSPACE
========================================================= */

function PaperWorkspace({
  paperId,
  onBack,
}) {
  const [paper, setPaper] = useState(null);
  const [sections, setSections] = useState([]);
  const [connections, setConnections] =
  useState([]);

const [allPapers, setAllPapers] =
  useState([]);

const [connectionModalOpen, setConnectionModalOpen] =
  useState(false);
  const [activeSectionId, setActiveSectionId] =
    useState("overview");
  const [workspaceTab, setWorkspaceTab] =
    useState("paper");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [copilotOpen, setCopilotOpen] =
    useState(false);
  
  const [saveToLearnOpen, setSaveToLearnOpen] =
    useState(false);

  const [learningTopics, setLearningTopics] =
    useState([]);

  useEffect(() => {
    async function loadPaper() {
      try {
        setLoading(true);
        setError("");

        const [
  paperResponse,
  sectionsResponse,
  connectionsResponse,
  papersResponse,
] = await Promise.all([
  fetch(
    `${API_BASE_URL}/api/papers/${paperId}`
  ),

  fetch(
    `${API_BASE_URL}/api/papers/${paperId}/sections`
  ),

  fetch(
    `${API_BASE_URL}/api/connections/paper/${paperId}`
  ),

  fetch(
    `${API_BASE_URL}/api/papers/`
  ),
]);

        if (!paperResponse.ok) {
          throw new Error(
            `Could not load paper (${paperResponse.status}).`
          );
        }

        if (!sectionsResponse.ok) {
          throw new Error(
            `Could not load paper sections (${sectionsResponse.status}).`
          );
        }

        const paperData =
  await paperResponse.json();

const sectionsData =
  await sectionsResponse.json();

const connectionsData =
  await connectionsResponse.json();

const papersData =
  await papersResponse.json();

setPaper(paperData);

setSections(
  Array.isArray(sectionsData)
    ? sectionsData
    : []
);

setConnections(
  Array.isArray(connectionsData)
    ? connectionsData
    : []
);

setAllPapers(
  Array.isArray(papersData)
    ? papersData
    : []
);
      } finally {
        setLoading(false);
      }
    }

    loadPaper();
  }, [paperId]);

  if (loading) {
    return (
      <div className="paper-workspace-loading">
        <LoaderCircle
          className="spin"
          size={26}
        />

        <span>
          Loading paper and sections...
        </span>
      </div>
    );
  } 

  function refreshConnections() {
  fetch(
    `${API_BASE_URL}/api/connections/paper/${paperId}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Could not refresh connections."
        );
      }

      return response.json();
    })
    .then((data) => {
      setConnections(
        Array.isArray(data)
          ? data
          : []
      );
    })
    .catch((err) => {
      console.error(err);
    });
}

async function handleConnectionCreated() {
  setConnectionModalOpen(false);
  refreshConnections();
}

  if (error) {
    return (
      <div className="page paper-workspace">
        <button
          className="back-button"
          onClick={onBack}
        >
          <ChevronLeft size={17} />
          Back to papers
        </button>

        <div className="paper-error">
          <FileSearch size={26} />

          <h3>
            Could not load this paper
          </h3>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return null;
  }

  const selectedSection =
    sections.find(
      (section) =>
        String(section.id) ===
        String(activeSectionId)
    ) || null;

  const displayContent =
    activeSectionId === "overview"
      ? paper.abstract
      : selectedSection?.content;

  function openCopilot() {
    setCopilotOpen(true);
  }
  async function openSaveToLearn() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/learn/topics`
    );

    if (!response.ok) {
      throw new Error(
        `Could not load learning topics (${response.status}).`
      );
    }

    const data = await response.json();

    setLearningTopics(
      Array.isArray(data) ? data : []
    );

    setSaveToLearnOpen(true);
  } catch (err) {
    console.error(err);
    alert(
      err.message ||
        "Could not load your learning topics."
    );
  }
} 
  function handlePaperUpdated(updates) {
    setPaper((previous) => ({
      ...previous,
      ...updates,
    }));
  }

  function openPaperTab() {
    setWorkspaceTab("paper");
  }

  function openNotesTab() {
    setWorkspaceTab("notes");
  }

  return (
    <div className="page paper-workspace">
      <button
        className="back-button"
        onClick={onBack}
      >
        <ChevronLeft size={17} />
        Back to papers
      </button>

      <section className="paper-workspace-header">
        <div className="paper-workspace-icon">
          <FileText size={25} />
        </div>

        <div className="paper-workspace-heading">
          <span className="eyebrow">
            Research paper
          </span>

          <h2>{paper.title}</h2>

          <p className="paper-workspace-authors">
            {paper.authors ||
              "Authors not available"}
          </p>

          <div className="paper-workspace-meta">
            {paper.year && (
              <span>{paper.year}</span>
            )}

            {paper.journal && (
              <>
                <span>·</span>
                <span>{paper.journal}</span>
              </>
            )}

            <span>·</span>

            <span>
              {paper.status ||
                "To Read"}
            </span>

            <span>·</span>

            <span>
              {paper.progress ?? 0}%
            </span>

            <span>·</span>

            <span>
              {sections.length} sections
            </span>
          </div>
        </div>
      </section>

      <div className="paper-workspace-main-tabs">
        <button
          className={
            workspaceTab === "paper"
              ? "active"
              : ""
          }
          onClick={openPaperTab}
        >
          <BookOpen size={15} />
          Paper Content
        </button>

        <button
          className={
            workspaceTab === "notes"
              ? "active"
              : ""
          }
          onClick={openNotesTab}
        >
          <NotebookPen size={15} />
          My Notes
        </button>
      </div>

      {workspaceTab === "paper" ? (
        <>
          <div className="paper-section-tabs">
            <button
              className={
                activeSectionId === "overview"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSectionId("overview")
              }
            >
              <BookOpen size={15} />
              Overview
            </button>

            {sections.map((section) => (
              <button
                key={section.id}
                className={
                  String(activeSectionId) ===
                  String(section.id)
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveSectionId(
                    section.id
                  )
                }
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="paper-workspace-grid">
            <main className="paper-content-column">
              <section className="paper-section paper-reading-section">
                <div className="paper-section-heading">
                  <div>
                    <span className="eyebrow">
                      {activeSectionId ===
                      "overview"
                        ? "Overview"
                        : "Paper section"}
                    </span>

                    <h3>
                      {activeSectionId ===
                      "overview"
                        ? "Abstract"
                        : selectedSection?.title ||
                          "Paper section"}
                    </h3>
                  </div>

                  <div className="section-reading-tools">
  <button
    className="section-tool-button"
    title="Open My Notes"
    onClick={openNotesTab}
  >
    <NotebookPen size={17} />
  </button>

  <button
    className="section-tool-button"
    title="Save to Learn"
    onClick={openSaveToLearn}
  >
    <BookmarkPlus size={17} />
  </button>

  <button
    className="section-tool-button"
    title="Explain with Research Copilot"
    onClick={openCopilot}
  >
    <Sparkles size={17} />
  </button>
</div> 
                </div>

                <div className="paper-reading-content">
                  {displayContent ? (
                    formatPaperContent(displayContent).map(
                      (block, index) =>
                        block.type === "heading" ? (
                          <h4
                            className="paper-content-subheading"
                            key={`${block.type}-${index}`}
                          >
                            {block.text}
                          </h4>
                        ) : (
                          <p key={`${block.type}-${index}`}>
                            {block.text}
                          </p>
                        )
                    )
                  ) : (
                    <div className="empty-section">
                      <FileText size={22} />

                      <h4>
                        No content available
                      </h4>

                      <p>
                        This section does not
                        contain extracted text.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {activeSectionId ===
                "overview" && (
                <>
                  <section className="paper-section">
                    <div className="paper-section-heading">
                      <div>
                        <span className="eyebrow">
                          Metadata
                        </span>

                        <h3>
                          Paper information
                        </h3>
                      </div>
                    </div>

                    <div className="paper-info-grid">
                      <div className="paper-info-item">
                        <span>Title</span>
                        <strong>
                          {paper.title}
                        </strong>
                      </div>

                      <div className="paper-info-item">
                        <span>Authors</span>
                        <strong>
                          {paper.authors ||
                            "Not available"}
                        </strong>
                      </div>

                      <div className="paper-info-item">
                        <span>Year</span>
                        <strong>
                          {paper.year ||
                            "Not available"}
                        </strong>
                      </div>

                      <div className="paper-info-item">
                        <span>Journal</span>
                        <strong>
                          {paper.journal ||
                            "Not available"}
                        </strong>
                      </div>

                      <div className="paper-info-item">
                        <span>Status</span>
                        <strong>
                          {paper.status ||
                            "To Read"}
                        </strong>
                      </div>

                      <div className="paper-info-item">
                        <span>Progress</span>
                        <strong>
                          {paper.progress ?? 0}%
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="paper-section">
                    <div className="paper-section-heading">
                      <div>
                        <span className="eyebrow">
                          Reading note
                        </span>

                        <h3>
                          What to look for
                        </h3>
                      </div>
                    </div>

                    <div className="paper-note-card">
                      <Lightbulb size={20} />

                      <div>
                        <h4>
                          Read with your own
                          research questions
                        </h4>

                        <p>
                          Use the paper content as
                          reference, but record your
                          own understanding, gaps,
                          findings and questions in
                          My Notes.
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </main>

            <aside className="paper-workspace-sidebar">
              <div className="paper-sidebar-card paper-connections-card">
  <div className="paper-sidebar-card-heading">
    <div>
      <span className="eyebrow">
        Literature network
      </span>

      <h4>
        {connections.length}{" "}
        {connections.length === 1
          ? "connection"
          : "connections"}
      </h4>
    </div>

    <Link2 size={19} />
  </div>

  {connections.length === 0 ? (
    <div className="paper-connections-empty">
      <p>
        Connect this paper to another
        study as you build your literature
        review.
      </p>

      <button
        className="secondary-button"
        onClick={() =>
          setConnectionModalOpen(true)
        }
        disabled={allPapers.length < 2}
      >
        <Plus size={14} />
        Add connection
      </button>
    </div>
  ) : (
    <>
      <div className="paper-connections-list">
        {connections
          .slice(0, 4)
          .map((connection) => {
            const currentIsSource =
              Number(
                connection.source_paper_id
              ) === Number(paperId);

            return (
              <div
                className="paper-connection-mini"
                key={connection.id}
              >
                <span className="paper-connection-mini-relation">
                  {connection.relation_type}
                </span>

                <strong>
                  {currentIsSource
                    ? connection.target_title
                    : connection.source_title}
                </strong>
              </div>
            );
          })}
      </div>

      <button
        className="secondary-button"
        onClick={() =>
          setConnectionModalOpen(true)
        }
      >
        <Plus size={14} />
        Add connection
      </button>
    </>
  )}
</div>
              <div className="paper-action-card">
                <span className="card-label">
                  Research copilot
                </span>

                <div className="paper-action-icon">
                  <Sparkles size={21} />
                </div>

                <h3>
                  Understand this paper
                </h3>

                <p>
                  Ask questions about this paper,
                  understand difficult concepts
                  and explore its methodology.
                </p>

                <button
                  className="primary-button"
                  onClick={openCopilot}
                >
                  <Sparkles size={16} />
                  Ask Research Copilot
                </button>
              </div>

              <div className="paper-sidebar-card">
                <div className="paper-sidebar-card-heading">
                  <div>
                    <span className="eyebrow">
                      Reading progress
                    </span>

                    <h4>
                      {paper.progress ?? 0}%
                      complete
                    </h4>
                  </div>

                  <Gauge size={19} />
                </div>

                <div className="paper-progress-track">
                  <div
                    className="paper-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          paper.progress ?? 0
                        )
                      )}%`,
                    }}
                  />
                </div>

                <p>
                  Keep exploring the paper
                  section by section.
                </p>
              </div>

              <div className="paper-sidebar-card">
                <div className="paper-sidebar-card-heading">
                  <div>
                    <span className="eyebrow">
                      Paper structure
                    </span>

                    <h4>
                      {sections.length} sections
                    </h4>
                  </div>

                  <Library size={19} />
                </div>

                <div className="paper-structure-list">
                  {sections
                    .slice(0, 8)
                    .map((section) => (
                      <button
                        key={section.id}
                        className={
                          String(
                            activeSectionId
                          ) ===
                          String(section.id)
                            ? "active"
                            : ""
                        }
                        onClick={() => {
                          setActiveSectionId(
                            section.id
                          );
                          openPaperTab();
                        }}
                      >
                        <span>
                          {section.title}
                        </span>

                        <ArrowRight size={13} />
                      </button>
                    ))}

                  {sections.length > 8 && (
                    <span className="paper-structure-more">
                      +{sections.length - 8} more
                    </span>
                  )}
                </div>
              </div>

              <div className="paper-next-card">
                <div className="paper-next-icon">
                  <Target size={18} />
                </div>

                <div>
                  <span className="eyebrow">
                    Next
                  </span>

                  <h4>
                    Write your understanding
                  </h4>

                  <p>
                    Capture your own interpretation
                    before moving to another paper.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={openNotesTab}
                >
                  Notes
                  <NotebookPen size={15} />
                </button>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="paper-notes-workspace">
          <div className="paper-notes-workspace-grid">
            <main className="paper-notes-main-column">
              <PaperNotesPanel
                paperId={paperId}
                paper={paper}
                onPaperUpdated={
                  handlePaperUpdated
                }
              />
            </main>

            <aside className="paper-notes-sidebar">
              <div className="paper-sidebar-card">
                <div className="paper-sidebar-card-heading">
                  <div>
                    <span className="eyebrow">
                      Paper reference
                    </span>

                    <h4>
                      {paper.year ||
                        "Year unavailable"}
                    </h4>
                  </div>

                  <FileText size={19} />
                </div>

                <p>
                  {paper.journal ||
                    "Journal not available"}
                </p>

                <div className="paper-notes-reference-actions">
                  <button
                    className="secondary-button"
                    onClick={openPaperTab}
                  >
                    <BookOpen size={15} />
                    Back to paper
                  </button>
                </div>
              </div>

              <div className="paper-next-card">
                <div className="paper-next-icon">
                  <Sparkles size={18} />
                </div>

                <div>
                  <span className="eyebrow">
                    Need help?
                  </span>

                  <h4>
                    Ask Research Copilot
                  </h4>

                  <p>
                    Use the paper content to clarify
                    a method, result or difficult idea.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={openCopilot}
                >
                  <Sparkles size={15} />
                  Ask
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
       {connectionModalOpen && (
  <PaperConnectionModal
    papers={allPapers}
    sourcePaperId={paperId}
    onClose={() =>
      setConnectionModalOpen(false)
    }
    onCreated={
      handleConnectionCreated
    }
  />
)}
      {saveToLearnOpen && (
  <SaveToLearnModal
    paper={paper}
    section={selectedSection}
    activeSectionId={activeSectionId}
    displayContent={displayContent}
    topics={learningTopics}
    onClose={() =>
      setSaveToLearnOpen(false)
    }
    onSaved={() =>
      setSaveToLearnOpen(false)
    }
  />
)} 
    </div>
  );
}

/* =========================================================
   SAVE TO LEARN MODAL
========================================================= */

function SaveToLearnModal({
  paper,
  section,
  activeSectionId,
  displayContent,
  topics,
  onClose,
  onSaved,
}) {
  const defaultSection =
    activeSectionId === "overview"
      ? "What is it?"
      : section?.title || "What is it?";

  const [topicId, setTopicId] =
    useState(topics[0]?.id || "");

  const [noteSection, setNoteSection] =
    useState(defaultSection);

  const [content, setContent] = useState(
    displayContent || ""
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!topicId) {
      setError(
        "Please choose a learning topic."
      );
      return;
    }

    if (!noteSection.trim()) {
      setError(
        "Please enter a learning section."
      );
      return;
    }

    if (!content.trim()) {
      setError(
        "There is no paper content to save."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/learn/topics/${topicId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: noteSection.trim(),
            content: content.trim(),
            section_order: 0,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ||
            `Could not save to Learn (${response.status}).`
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err.message ||
          "Could not save this content to Learn."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="learn-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="learn-modal save-to-learn-modal">
        <div className="learn-modal-header">
          <div>
            <span className="eyebrow">
              Save to your knowledge library
            </span>

            <h3>Save to Learn</h3>

            <p className="save-to-learn-paper-title">
              {paper?.title}
            </p>
          </div>

          <button
            className="small-icon-button"
            onClick={onClose}
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="learn-modal-form"
          onSubmit={handleSubmit}
        >
          <label>
            Learning topic

            {topics.length > 0 ? (
              <select
                value={topicId}
                onChange={(event) =>
                  setTopicId(event.target.value)
                }
                disabled={saving}
              >
                {topics.map((topic) => (
                  <option
                    key={topic.id}
                    value={topic.id}
                  >
                    {topic.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="save-to-learn-no-topics">
                <BookOpen size={16} />

                <span>
                  No learning topics exist yet.
                  Create one from the Learn page
                  first.
                </span>
              </div>
            )}
          </label>

          <label>
            Learning section

            <input
              value={noteSection}
              onChange={(event) =>
                setNoteSection(
                  event.target.value
                )
              }
              placeholder="e.g. How It Works"
              disabled={saving}
            />
          </label>

          <label>
            Content to save

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              rows={10}
              disabled={saving}
            />
          </label>

          <div className="save-to-learn-source">
            <FileText size={14} />

            <span>
              Source:{" "}
              {activeSectionId ===
              "overview"
                ? "Abstract"
                : section?.title ||
                  "Paper section"}
            </span>
          </div>

          {error && (
            <div className="learn-modal-error">
              <X size={14} />
              {error}
            </div>
          )}

          <div className="learn-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                saving ||
                topics.length === 0
              }
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkPlus
                    size={15}
                  />
                  Save to Learn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   RESEARCH COPILOT
========================================================= */

function ResearchCopilot({
  paperId,
  sections,
  onSelectSection,
  onClose,
}) {
  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const suggestedQuestions = [
    "What is the main idea of this paper?",
    "Explain the methodology used in this paper.",
    "What dataset did the authors use?",
    "What are the main results?",
    "What are the limitations of this paper?",
    "Explain this paper like I am learning it for the first time.",
  ];

  async function askQuestion(
    questionText
  ) {
    const trimmed =
      questionText.trim();

    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setError("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: trimmed,
      },
    ]);

    setQuestion("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/research/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            paper_id: Number(paperId),
            question: trimmed,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Research Copilot could not answer the question."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            data.answer ||
            "I could not generate an answer.",
          sources: Array.isArray(
            data.sources
          )
            ? data.sources
            : [],
        },
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong while contacting Research Copilot."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    askQuestion(question);
  }

  function getSourceTitle(source) {
    if (source.section) {
      return source.section;
    }

    const matchingSection =
      sections.find(
        (section) =>
          String(section.id) ===
          String(source.section_id)
      );

    return (
      matchingSection?.title ||
      `Section ${source.section_id}`
    );
  }

  return (
    <div className="copilot-overlay">
      <div className="copilot-panel">
        <div className="copilot-header">
          <div className="copilot-header-left">
            <div className="copilot-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <span className="eyebrow">
                Research intelligence
              </span>

              <h3>
                Research Copilot
              </h3>

              <p>
                Ask questions about this
                paper.
              </p>
            </div>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            title="Close Research Copilot"
          >
            <X size={19} />
          </button>
        </div>

        <div className="copilot-body">
          {messages.length === 0 ? (
            <div className="copilot-empty">
              <div className="copilot-empty-icon">
                <Brain size={28} />
              </div>

              <h4>
                Understand your paper
                faster
              </h4>

              <p>
                Ask questions about the
                research, methodology,
                results, limitations,
                datasets, or difficult
                concepts.
              </p>

              <div className="copilot-suggestions">
                {suggestedQuestions.map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() =>
                        askQuestion(
                          suggestion
                        )
                      }
                    >
                      <MessageSquare
                        size={15}
                      />

                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="copilot-messages">
              {messages.map(
                (message, index) => (
                  <div
                    key={index}
                    className={`copilot-message ${
                      message.role ===
                      "user"
                        ? "user"
                        : "assistant"
                    }`}
                  >
                    <div className="copilot-message-label">
                      {message.role ===
                      "user"
                        ? "You"
                        : "Research Copilot"}
                    </div>

                    <div className="copilot-message-content">
                      {message.content
                        .split("\n")
                        .filter(
                          (line) =>
                            line.trim()
                        )
                        .map(
                          (
                            line,
                            lineIndex
                          ) => (
                            <p
                              key={
                                lineIndex
                              }
                            >
                              {line}
                            </p>
                          )
                        )}
                    </div>

                    {message.role ===
                      "assistant" &&
                      Array.isArray(
                        message.sources
                      ) &&
                      message.sources.length >
                        0 && (
                        <div className="copilot-sources">
                          <div className="copilot-sources-title">
                            <FileSearch
                              size={14}
                            />
                            Sources from
                            this paper
                          </div>

                          <div className="copilot-source-list">
                            {message.sources
                              .slice(0, 5)
                              .map(
                                (
                                  source,
                                  sourceIndex
                                ) => {
                                  const sourceTitle =
                                    getSourceTitle(
                                      source
                                    );

                                  return (
                                    <button
                                      key={`${source.section_id}-${sourceIndex}`}
                                      onClick={() => {
                                        const matchingSection =
                                          sections.find(
                                            (
                                              section
                                            ) =>
                                              String(
                                                section.id
                                              ) ===
                                              String(
                                                source.section_id
                                              )
                                          );

                                        if (
                                          matchingSection
                                        ) {
                                          onSelectSection(
                                            matchingSection.id
                                          );

                                          onClose();
                                        }
                                      }}
                                    >
                                      <FileText
                                        size={
                                          14
                                        }
                                      />

                                      <span>
                                        {
                                          sourceTitle
                                        }
                                      </span>

                                      <ArrowRight
                                        size={
                                          13
                                        }
                                      />
                                    </button>
                                  );
                                }
                              )}
                          </div>
                        </div>
                      )}
                  </div>
                )
              )}

              {loading && (
                <div className="copilot-message assistant">
                  <div className="copilot-message-label">
                    Research Copilot
                  </div>

                  <div className="copilot-loading">
                    <span />
                    <span />
                    <span />

                    <span>
                      Searching your
                      paper...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="copilot-error">
              <X size={16} />

              <span>{error}</span>
            </div>
          )}
        </div>

        <form
          className="copilot-input-area"
          onSubmit={handleSubmit}
        >
          <div className="copilot-input-wrapper">
            <input
              type="text"
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              placeholder="Ask something about this paper..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={
                loading ||
                !question.trim()
              }
              title="Ask Research Copilot"
            >
              {loading ? (
                <LoaderCircle
                  size={17}
                  className="spin"
                />
              ) : (
                <ArrowRight size={17} />
              )}
            </button>
          </div>

          <div className="copilot-input-hint">
            Answers are grounded in the
            uploaded paper.
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   KNOWLEDGE
========================================================= */

/* =========================================================
   KNOWLEDGE
========================================================= */

function KnowledgePage() {
  const [connections, setConnections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [connectionModalOpen, setConnectionModalOpen] =
    useState(false);

  const [papers, setPapers] =
    useState([]);

  async function loadKnowledge() {
    try {
      setLoading(true);
      setError("");

      const [
        connectionsResponse,
        papersResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/connections/`
        ),
        fetch(
          `${API_BASE_URL}/api/papers/`
        ),
      ]);

      if (!connectionsResponse.ok) {
        throw new Error(
          "Could not load paper connections."
        );
      }

      if (!papersResponse.ok) {
        throw new Error(
          "Could not load papers."
        );
      }

      const connectionsData =
        await connectionsResponse.json();

      const papersData =
        await papersResponse.json();

      setConnections(
        Array.isArray(connectionsData)
          ? connectionsData
          : []
      );

      setPapers(
        Array.isArray(papersData)
          ? papersData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not load your research knowledge."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function handleConnectionCreated() {
    setConnectionModalOpen(false);
    await loadKnowledge();
  }

  async function handleDeleteConnection(
    connectionId
  ) {
    const confirmed =
      window.confirm(
        "Remove this paper connection?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/connections/${connectionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.detail ||
            "Could not delete the connection."
        );
      }

      await loadKnowledge();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not delete the connection."
      );
    }
  }

  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Knowledge system
          </span>

          <h2>Research knowledge</h2>

          <p className="welcome-subtitle">
            Connect papers so you can see how
            the literature relates to each other.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setConnectionModalOpen(true)
          }
          disabled={papers.length < 2}
        >
          <Plus size={16} />
          Add connection
        </button>
      </section>

      {error && (
        <div className="soft-notice">
          {error}
        </div>
      )}

      {/* -----------------------------------------------------
          CONNECTIONS
      ----------------------------------------------------- */}

      <section className="connections-page-section">
        <div className="connections-page-header">
          <div>
            <span className="eyebrow">
              Literature network
            </span>

            <h3>
              Paper connections
            </h3>

            <p>
              Capture how one paper relates to
              another as your literature review grows.
            </p>
          </div>

          <div className="connections-count">
            <Link2 size={16} />

            <strong>
              {connections.length}
            </strong>

            <span>
              {connections.length === 1
                ? "connection"
                : "connections"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="connections-empty-state">
            <LoaderCircle
              size={21}
              className="spin"
            />

            <span>
              Loading your literature network...
            </span>
          </div>
        ) : connections.length === 0 ? (
          <div className="connections-empty-state">
            <div className="connections-empty-icon">
              <Link2 size={22} />
            </div>

            <h4>
              No paper connections yet
            </h4>

            <p>
              Start connecting papers when you
              notice that one study supports,
              extends, contradicts or relates to
              another.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setConnectionModalOpen(true)
              }
              disabled={papers.length < 2}
            >
              <Plus size={16} />
              Create first connection
            </button>

            {papers.length < 2 && (
              <small>
                Upload at least two papers to
                create a connection.
              </small>
            )}
          </div>
        ) : (
          <div className="connections-list">
            {connections.map((connection) => (
              <div
                className="connection-card"
                key={connection.id}
              >
                <div className="connection-paper connection-source">
                  <div className="connection-paper-icon">
                    <FileText size={17} />
                  </div>

                  <div>
                    <span className="connection-label">
                      Source paper
                    </span>

                    <strong>
                      {connection.source_title}
                    </strong>
                  </div>
                </div>

                <div className="connection-relation">
                  <span>
                    {connection.relation_type}
                  </span>

                  <ArrowRight size={16} />
                </div>

                <div className="connection-paper connection-target">
                  <div className="connection-paper-icon">
                    <FileText size={17} />
                  </div>

                  <div>
                    <span className="connection-label">
                      Related paper
                    </span>

                    <strong>
                      {connection.target_title}
                    </strong>
                  </div>
                </div>

                {connection.note && (
                  <div className="connection-note">
                    <span>
                      Your note
                    </span>

                    <p>
                      {connection.note}
                    </p>
                  </div>
                )}

                <button
                  className="connection-delete-button"
                  onClick={() =>
                    handleDeleteConnection(
                      connection.id
                    )
                  }
                  title="Delete connection"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* -----------------------------------------------------
          EXISTING KNOWLEDGE AREA
      ----------------------------------------------------- */}

      <div className="dashboard-columns knowledge-bottom-grid"> 
        <section className="simple-card">
          <div className="card-label">
            Concepts
          </div>

          <h3>Research concepts</h3>

          <p>
            Your knowledge system can later
            connect papers with concepts,
            methodologies, experiments and
            research gaps.
          </p>

          <div className="tag-row">
            <span>Transformers</span>
            <span>ViT</span>
            <span>GAT</span>
          </div>
        </section>

        <section className="simple-card">
          <div className="card-label">
            Literature network
          </div>

          <h3>
            {connections.length} paper links
          </h3>

          <p>
            These relationships will become the
            foundation for your future literature
            map and research-gap analysis.
          </p>
        </section>
      </div>

      {connectionModalOpen && (
        <PaperConnectionModal
          papers={papers}
          onClose={() =>
            setConnectionModalOpen(false)
          }
          onCreated={
            handleConnectionCreated
          }
        />
      )}
    </div>
  );
} 


/* =========================================================
   PAPER CONNECTION MODAL
========================================================= */

function PaperConnectionModal({
  papers,
  sourcePaperId = "",
  onClose,
  onCreated,
}) {
  const [sourceId, setSourceId] =
    useState(
      sourcePaperId
        ? String(sourcePaperId)
        : ""
    );

  const [targetId, setTargetId] =
    useState("");

  const [relationType, setRelationType] =
    useState("supports");

  const [note, setNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const relationOptions = [
    {
      value: "supports",
      label: "Supports",
    },
    {
      value: "extends",
      label: "Extends",
    },
    {
      value: "contradicts",
      label: "Contradicts",
    },
    {
      value: "related to",
      label: "Related to",
    },
    {
      value: "uses method from",
      label: "Uses method from",
    },
    {
      value: "compares with",
      label: "Compares with",
    },
  ];

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!sourceId) {
      setError(
        "Please select the source paper."
      );

      return;
    }

    if (!targetId) {
      setError(
        "Please select the related paper."
      );

      return;
    }

    if (sourceId === targetId) {
      setError(
        "Source and related paper must be different."
      );

      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/connections/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            source_paper_id:
              Number(sourceId),

            target_paper_id:
              Number(targetId),

            relation_type:
              relationType,

            note:
              note.trim() || null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not create paper connection."
        );
      }

      await onCreated(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not create paper connection."
      );
    } finally {
      setSaving(false);
    }
  }

  const sourcePaper =
    papers.find(
      (paper) =>
        String(paper.id) ===
        String(sourceId)
    );

  const targetOptions =
    papers.filter(
      (paper) =>
        String(paper.id) !==
        String(sourceId)
    );

  return (
    <div
      className="connection-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="connection-modal">
        <div className="connection-modal-header">
          <div>
            <span className="eyebrow">
              Literature network
            </span>

            <h3>
              Add paper connection
            </h3>

            <p>
              Describe how two papers relate
              to each other.
            </p>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            disabled={saving}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="connection-modal-form"
          onSubmit={handleSubmit}
        >
          <div className="connection-form-field">
            <label>
              Source paper
            </label>

            <select
              value={sourceId}
              onChange={(event) => {
                setSourceId(
                  event.target.value
                );

                if (
                  event.target.value ===
                  targetId
                ) {
                  setTargetId("");
                }
              }}
              disabled={saving}
            >
              <option value="">
                Select a paper...
              </option>

              {papers.map((paper) => (
                <option
                  value={paper.id}
                  key={paper.id}
                >
                  {paper.title}
                </option>
              ))}
            </select>
          </div>

          <div className="connection-form-relation">
            <span className="connection-form-arrow">
              ↓
            </span>

            <label>
              Relationship
            </label>

            <select
              value={relationType}
              onChange={(event) =>
                setRelationType(
                  event.target.value
                )
              }
              disabled={saving}
            >
              {relationOptions.map(
                (relation) => (
                  <option
                    value={relation.value}
                    key={
                      relation.value
                    }
                  >
                    {relation.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="connection-form-field">
            <label>
              Related paper
            </label>

            <select
              value={targetId}
              onChange={(event) =>
                setTargetId(
                  event.target.value
                )
              }
              disabled={
                saving ||
                !sourceId
              }
            >
              <option value="">
                {sourceId
                  ? "Select a related paper..."
                  : "Select the source paper first"}
              </option>

              {targetOptions.map(
                (paper) => (
                  <option
                    value={paper.id}
                    key={paper.id}
                  >
                    {paper.title}
                  </option>
                )
              )}
            </select>
          </div>

          {sourcePaper && (
            <div className="connection-preview">
              <div>
                <span>
                  {sourcePaper.title}
                </span>

                <strong>
                  {relationType}
                </strong>
              </div>

              <ArrowRight size={17} />

              <div>
                <span>
                  {targetId
                    ? papers.find(
                        (paper) =>
                          String(
                            paper.id
                          ) ===
                          String(
                            targetId
                          )
                      )?.title ||
                      "Related paper"
                    : "Related paper"}
                </span>
              </div>
            </div>
          )}

          <div className="connection-form-field">
            <label>
              Your note
              <span>optional</span>
            </label>

            <textarea
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              placeholder="Why is this relationship important to your literature review?"
              rows={4}
              disabled={saving}
            />
          </div>

          {error && (
            <div className="connection-form-error">
              <X size={15} />
              {error}
            </div>
          )}

          <div className="connection-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                saving ||
                papers.length < 2
              }
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Link2 size={16} />

                  Create connection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 

/* =========================================================
   RESEARCH GAPS
========================================================= */

function ResearchGapsPage() {
  const [gaps, setGaps] = useState([]);
  const [papers, setPapers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState("All");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingGap, setEditingGap] =
    useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        gapsResponse,
        papersResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/gaps/`
        ),
        fetch(
          `${API_BASE_URL}/api/papers`
        ),
      ]);

      if (!gapsResponse.ok) {
        throw new Error(
          "Could not load research gaps."
        );
      }

      if (!papersResponse.ok) {
        throw new Error(
          "Could not load papers."
        );
      }

      const gapsData =
        await gapsResponse.json();

      const papersData =
        await papersResponse.json();

      setGaps(
        Array.isArray(gapsData)
          ? gapsData
          : []
      );

      setPapers(
        Array.isArray(papersData)
          ? papersData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not load research gaps."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingGap(null);
    setModalOpen(true);
  }

  function openEditModal(gap) {
    setEditingGap(gap);
    setModalOpen(true);
  }

  async function handleSaved() {
    setModalOpen(false);
    setEditingGap(null);
    await loadData();
  }

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredGaps = gaps.filter(
    (gap) => {

      const matchesFilter =
        activeFilter === "All" ||
        gap.status === activeFilter;

      const matchesSearch =
        !normalizedSearch ||
        gap.title
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        gap.description
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        gap.category
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        gap.source_title
          ?.toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesFilter &&
        matchesSearch
      );
    }
  );

  const openCount = gaps.filter(
    (gap) =>
      gap.status === "Open" ||
      gap.status === "Exploring"
  ).length;

  const investigatingCount =
    gaps.filter(
      (gap) =>
        gap.status ===
        "Investigating"
    ).length;

  const addressedCount =
    gaps.filter(
      (gap) =>
        gap.status === "Addressed"
    ).length;

  return (
    <div className="page research-gaps-page">

      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Research thinking
          </span>

          <h2>
            Research gaps
          </h2>

          <p className="welcome-subtitle">
            Capture unresolved problems,
            limitations and potential
            research opportunities.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            openCreateModal
          }
        >
          <Plus size={16} />
          Add research gap
        </button>
      </section>

      {error && (
        <div className="soft-notice">
          {error}
        </div>
      )}

      <section className="gap-summary-grid">

        <div className="gap-summary-card">
          <span>
            Total gaps
          </span>

          <strong>
            {gaps.length}
          </strong>

          <small>
            Across your literature
          </small>
        </div>

        <div className="gap-summary-card">
          <span>
            Open / Exploring
          </span>

          <strong>
            {openCount}
          </strong>

          <small>
            Still being considered
          </small>
        </div>

        <div className="gap-summary-card">
          <span>
            Investigating
          </span>

          <strong>
            {investigatingCount}
          </strong>

          <small>
            Actively being explored
          </small>
        </div>

        <div className="gap-summary-card">
          <span>
            Addressed
          </span>

          <strong>
            {addressedCount}
          </strong>

          <small>
            No longer open
          </small>
        </div>

      </section>

      <section className="gap-toolbar">

        <div className="gap-search">

          <Search size={16} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search your research gaps..."
          />

        </div>

        <div className="gap-filter-tabs">

          {[
            "All",
            "Open",
            "Exploring",
            "Investigating",
            "Addressed",
            "Parked",
          ].map((filter) => (

            <button
              key={filter}
              className={
                activeFilter === filter
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter(
                  filter
                )
              }
            >
              {filter}
            </button>

          ))}

        </div>

      </section>

      {loading ? (

        <div className="inline-status">

          <LoaderCircle
            size={18}
            className="spin"
          />

          Loading your research gaps...

        </div>

      ) : filteredGaps.length === 0 ? (

        <section className="gap-empty-state">

          <div className="gap-empty-icon">
            <Lightbulb size={23} />
          </div>

          <h3>
            {search
              ? "No matching gaps"
              : "No research gaps yet"}
          </h3>

          <p>
            {search
              ? "Try a different search term."
              : "Start recording the unresolved problems you notice while reading."}
          </p>

          {!search && (
            <button
              className="primary-button"
              onClick={
                openCreateModal
              }
            >
              <Plus size={16} />
              Create your first gap
            </button>
          )}

        </section>

      ) : (

        <section className="gap-list">

          {filteredGaps.map(
            (gap) => (

              <article
                className="gap-card"
                key={gap.id}
                onClick={() =>
                  openEditModal(gap)
                }
              >

                <div className="gap-bullet">
                  <Lightbulb
                    size={17}
                  />
                </div>

                <div className="gap-card-content">

                  <div className="gap-card-top">

                    <div>

                      <span className="eyebrow">
                        {gap.category}
                      </span>

                      <h3>
                        {gap.title}
                      </h3>

                    </div>

                    <span
                      className={`status-pill gap-status-${gap.status
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >
                      {gap.status}
                    </span>

                  </div>

                  <p>
                    {gap.description}
                  </p>

                  {(gap.source_title ||
                    gap.why_it_matters) && (

                    <div className="gap-card-details">

                      {gap.source_title && (
                        <span>
                          <FileText
                            size={14}
                          />

                          {gap.source_title}
                        </span>
                      )}

                      {gap.why_it_matters && (
                        <span>
                          Why it matters:{" "}
                          {gap.why_it_matters}
                        </span>
                      )}

                    </div>

                  )}

                  <div className="gap-card-footer">

                    <span>
                      Updated{" "}
                      {new Date(
                        gap.updated_at
                      ).toLocaleDateString(
                        undefined,
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>

                    <button
                      className="ghost-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(gap);
                      }}
                    >
                      Investigate
                      <ArrowRight
                        size={15}
                      />
                    </button>

                  </div>

                </div>

              </article>

            )
          )}

        </section>

      )}

      {modalOpen && (
        <ResearchGapModal
          gap={editingGap}
          papers={papers}
          onClose={() => {
            setModalOpen(false);
            setEditingGap(null);
          }}
          onSaved={
            handleSaved
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   RESEARCH GAP MODAL
========================================================= */

function ResearchGapModal({
  gap,
  papers,
  onClose,
  onSaved,
}) {
  const [title, setTitle] =
    useState(gap?.title || "");

  const [description, setDescription] =
    useState(
      gap?.description || ""
    );

  const [category, setCategory] =
    useState(
      gap?.category || "Other"
    );

  const [status, setStatus] =
    useState(
      gap?.status || "Open"
    );

  const [sourcePaperId, setSourcePaperId] =
    useState(
      gap?.source_paper_id
        ? String(
            gap.source_paper_id
          )
        : ""
    );

  const [whyItMatters, setWhyItMatters] =
    useState(
      gap?.why_it_matters || ""
    );

  const [nextStep, setNextStep] =
    useState(
      gap?.next_step || ""
    );

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !title.trim() ||
      !description.trim()
    ) {
      setError(
        "Please enter a title and description."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: title.trim(),
        description:
          description.trim(),
        category,
        status,
        source_paper_id:
          sourcePaperId
            ? Number(
                sourcePaperId
              )
            : null,
        why_it_matters:
          whyItMatters.trim() ||
          null,
        next_step:
          nextStep.trim() ||
          null,
      };

      const response = await fetch(
        gap
          ? `${API_BASE_URL}/api/gaps/${gap.id}`
          : `${API_BASE_URL}/api/gaps/`,
        {
          method: gap
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not save research gap."
        );
      }

      await onSaved();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not save research gap."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!gap) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this research gap?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response =
        await fetch(
          `${API_BASE_URL}/api/gaps/${gap.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not delete research gap."
        );
      }

      await onSaved();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not delete research gap."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="gap-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="gap-modal">

        <div className="gap-modal-header">

          <div>
            <span className="eyebrow">
              Research thinking
            </span>

            <h3>
              {gap
                ? "Edit research gap"
                : "Add research gap"}
            </h3>

            <p>
              Record what is missing,
              unresolved, or worth
              investigating.
            </p>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            type="button"
            title="Close"
          >
            <X size={19} />
          </button>

        </div>

        <form
          className="gap-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="gap-form-field">
            <label>
              Gap title
            </label>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Limited external validation"
              disabled={saving}
            />
          </div>

          <div className="gap-form-field">
            <label>
              What is the gap?
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe the unresolved problem, limitation, contradiction, or unexplored direction..."
              rows={5}
              disabled={saving}
            />
          </div>

          <div className="gap-form-grid">

            <div className="gap-form-field">

              <label>
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option>
                  Methodological
                </option>

                <option>
                  Dataset
                </option>

                <option>
                  Evaluation
                </option>

                <option>
                  Generalisability
                </option>

                <option>
                  Interpretability
                </option>

                <option>
                  Theoretical
                </option>

                <option>
                  Practical
                </option>

                <option>
                  Other
                </option>
              </select>

            </div>

            <div className="gap-form-field">

              <label>
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option>
                  Open
                </option>

                <option>
                  Exploring
                </option>

                <option>
                  Investigating
                </option>

                <option>
                  Addressed
                </option>

                <option>
                  Parked
                </option>
              </select>

            </div>

          </div>

          <div className="gap-form-field">

            <label>
              Source paper
              <span>
                optional
              </span>
            </label>

            <select
              value={sourcePaperId}
              onChange={(event) =>
                setSourcePaperId(
                  event.target.value
                )
              }
              disabled={saving}
            >

              <option value="">
                No source paper
              </option>

              {papers.map(
                (paper) => (

                  <option
                    key={paper.id}
                    value={paper.id}
                  >
                    {paper.title}
                  </option>

                )
              )}

            </select>

          </div>

          <div className="gap-form-field">

            <label>
              Why does this matter?
              <span>
                optional
              </span>
            </label>

            <textarea
              value={whyItMatters}
              onChange={(event) =>
                setWhyItMatters(
                  event.target.value
                )
              }
              placeholder="Why is this gap important for the research field or your PhD?"
              rows={3}
              disabled={saving}
            />

          </div>

          <div className="gap-form-field">

            <label>
              Potential next step
              <span>
                optional
              </span>
            </label>

            <textarea
              value={nextStep}
              onChange={(event) =>
                setNextStep(
                  event.target.value
                )
              }
              placeholder="What could you investigate, test, compare, or develop?"
              rows={3}
              disabled={saving}
            />

          </div>

          {error && (
            <div className="gap-modal-error">
              <X size={15} />
              {error}
            </div>
          )}

          <div className="gap-modal-footer">

            {gap ? (

              <button
                type="button"
                className="danger-button"
                onClick={
                  handleDelete
                }
                disabled={
                  saving ||
                  deleting
                }
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            ) : (
              <span />
            )}

            <div className="gap-modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={
                  saving ||
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving ||
                  deleting
                }
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    {gap
                      ? "Save changes"
                      : "Add research gap"}
                  </>
                )}
              </button>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
}
/* =========================================================
   EXPERIMENTS
========================================================= */

function ExperimentsPage() {
  const [experiments, setExperiments] =
    useState([]);

  const [papers, setPapers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingExperiment, setEditingExperiment] =
    useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        experimentsResponse,
        papersResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/experiments/`
        ),
        fetch(
          `${API_BASE_URL}/api/papers`
        ),
      ]);

      if (!experimentsResponse.ok) {
        throw new Error(
          "Could not load experiments."
        );
      }

      if (!papersResponse.ok) {
        throw new Error(
          "Could not load papers."
        );
      }

      const experimentsData =
        await experimentsResponse.json();

      const papersData =
        await papersResponse.json();

      setExperiments(
        Array.isArray(
          experimentsData
        )
          ? experimentsData
          : []
      );

      setPapers(
        Array.isArray(papersData)
          ? papersData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not load experiments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingExperiment(null);
    setModalOpen(true);
  }

  function openEditModal(
    experiment
  ) {
    setEditingExperiment(
      experiment
    );

    setModalOpen(true);
  }

  async function handleSaved() {
    setModalOpen(false);
    setEditingExperiment(null);

    await loadData();
  }

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredExperiments =
    experiments.filter(
      (experiment) => {

        const matchesFilter =
          activeFilter === "All" ||
          experiment.status ===
            activeFilter;

        const matchesSearch =
          !normalizedSearch ||
          experiment.name
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          experiment.objective
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          experiment.dataset
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          experiment.model
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          experiment.source_title
            ?.toLowerCase()
            .includes(
              normalizedSearch
            );

        return (
          matchesFilter &&
          matchesSearch
        );
      }
    );

  const plannedCount =
    experiments.filter(
      (experiment) =>
        experiment.status ===
        "Planned"
    ).length;

  const runningCount =
    experiments.filter(
      (experiment) =>
        experiment.status ===
        "Running"
    ).length;

  const completedCount =
    experiments.filter(
      (experiment) =>
        experiment.status ===
        "Completed"
    ).length;

  const failedCount =
    experiments.filter(
      (experiment) =>
        experiment.status ===
        "Failed"
    ).length;

  return (
    <div className="page experiments-page">

      <section className="page-header-row">

        <div>
          <span className="eyebrow">
            Research execution
          </span>

          <h2>
            Experiments
          </h2>

          <p className="welcome-subtitle">
            Design, track and document
            your research experiments.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            openCreateModal
          }
        >
          <Plus size={16} />
          New experiment
        </button>

      </section>

      {error && (
        <div className="soft-notice">
          {error}
        </div>
      )}

      <section className="experiment-summary">

        <div className="experiment-summary-card">
          <span>
            Total experiments
          </span>

          <strong>
            {experiments.length}
          </strong>

          <small>
            Across your research
          </small>
        </div>

        <div className="experiment-summary-card">
          <span>
            Planned
          </span>

          <strong>
            {plannedCount}
          </strong>

          <small>
            Waiting to run
          </small>
        </div>

        <div className="experiment-summary-card">
          <span>
            Running
          </span>

          <strong>
            {runningCount}
          </strong>

          <small>
            Currently active
          </small>
        </div>

        <div className="experiment-summary-card">
          <span>
            Completed
          </span>

          <strong>
            {completedCount}
          </strong>

          <small>
            Finished experiments
          </small>
        </div>

      </section>

      <section className="experiment-toolbar">

        <div className="experiment-search">

          <Search size={16} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search experiments..."
          />

        </div>

        <div className="experiment-filter-tabs">

          {[
            "All",
            "Planned",
            "Running",
            "Completed",
            "Paused",
            "Failed",
          ].map(
            (filter) => (

              <button
                key={filter}
                className={
                  activeFilter ===
                  filter
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveFilter(
                    filter
                  )
                }
              >
                {filter}
              </button>

            )
          )}

        </div>

      </section>

      {loading ? (

        <div className="inline-status">

          <LoaderCircle
            size={18}
            className="spin"
          />

          Loading your experiments...

        </div>

      ) : filteredExperiments.length ===
        0 ? (

        <section className="experiment-empty-state">

          <div className="experiment-empty-icon">
            <FlaskConical
              size={24}
            />
          </div>

          <h3>
            {search
              ? "No matching experiments"
              : "No experiments yet"}
          </h3>

          <p>
            {search
              ? "Try a different search term."
              : "Start documenting the experiments you plan to run and the results you obtain."}
          </p>

          {!search && (
            <button
              className="primary-button"
              onClick={
                openCreateModal
              }
            >
              <Plus size={16} />
              Create first experiment
            </button>
          )}

        </section>

      ) : (

        <section className="experiment-list">

          {filteredExperiments.map(
            (experiment) => (

              <article
                className="experiment-card"
                key={
                  experiment.id
                }
                onClick={() =>
                  openEditModal(
                    experiment
                  )
                }
              >

                <div className="experiment-card-icon">
                  <FlaskConical
                    size={19}
                  />
                </div>

                <div className="experiment-card-content">

                  <div className="experiment-card-top">

                    <div>

                      <span className="eyebrow">
                        {
                          experiment.experiment_type
                        }
                      </span>

                      <h3>
                        {experiment.name}
                      </h3>

                    </div>

                    <span
                      className={`status-pill experiment-status-${experiment.status
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >
                      {
                        experiment.status
                      }
                    </span>

                  </div>

                  <p>
                    {
                      experiment.objective
                    }
                  </p>

                  <div className="experiment-meta">

                    {experiment.dataset && (
  <span>
    <Database size={13} />
    {experiment.dataset}
  </span>
)} 

                    {experiment.model && (
                      <span>
                        <Brain
                          size={13}
                        />
                        {
                          experiment.model
                        }
                      </span>
                    )}

                    {experiment.metric_name && (
                      <span>
                        <Gauge
                          size={13}
                        />
                        {
                          experiment.metric_name
                        }

                        {experiment.metric_value &&
                          ` · ${experiment.metric_value}`}
                      </span>
                    )}

                  </div>

                  <div className="experiment-card-footer">

                    {experiment.source_title ? (
                      <span>
                        <FileText
                          size={14}
                        />

                        {
                          experiment.source_title
                        }
                      </span>
                    ) : (
                      <span>
                        No linked paper
                      </span>
                    )}

                    <button
                      className="ghost-button"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        openEditModal(
                          experiment
                        );
                      }}
                    >
                      Open
                      <ArrowRight
                        size={15}
                      />
                    </button>

                  </div>

                </div>

              </article>

            )
          )}

        </section>

      )}

      {modalOpen && (
        <ExperimentModal
          experiment={
            editingExperiment
          }
          papers={papers}
          onClose={() => {
            setModalOpen(
              false
            );

            setEditingExperiment(
              null
            );
          }}
          onSaved={
            handleSaved
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   EXPERIMENT MODAL
========================================================= */

function ExperimentModal({
  experiment,
  papers,
  onClose,
  onSaved,
}) {
  const [name, setName] =
    useState(
      experiment?.name || ""
    );

  const [objective, setObjective] =
    useState(
      experiment?.objective || ""
    );

  const [hypothesis, setHypothesis] =
    useState(
      experiment?.hypothesis || ""
    );

  const [experimentType, setExperimentType] =
    useState(
      experiment?.experiment_type ||
        "Other"
    );

  const [status, setStatus] =
    useState(
      experiment?.status ||
        "Planned"
    );

  const [dataset, setDataset] =
    useState(
      experiment?.dataset || ""
    );

  const [model, setModel] =
    useState(
      experiment?.model || ""
    );

  const [metricName, setMetricName] =
    useState(
      experiment?.metric_name ||
        ""
    );

  const [metricValue, setMetricValue] =
    useState(
      experiment?.metric_value ||
        ""
    );

  const [results, setResults] =
    useState(
      experiment?.results || ""
    );

  const [conclusion, setConclusion] =
    useState(
      experiment?.conclusion || ""
    );

  const [nextStep, setNextStep] =
    useState(
      experiment?.next_step || ""
    );

  const [sourcePaperId, setSourcePaperId] =
    useState(
      experiment?.source_paper_id
        ? String(
            experiment.source_paper_id
          )
        : ""
    );

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !name.trim() ||
      !objective.trim()
    ) {
      setError(
        "Experiment name and objective are required."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: name.trim(),
        objective:
          objective.trim(),
        hypothesis:
          hypothesis.trim() ||
          null,
        experiment_type:
          experimentType,
        status,
        dataset:
          dataset.trim() ||
          null,
        model:
          model.trim() ||
          null,
        metric_name:
          metricName.trim() ||
          null,
        metric_value:
          metricValue.trim() ||
          null,
        results:
          results.trim() ||
          null,
        conclusion:
          conclusion.trim() ||
          null,
        next_step:
          nextStep.trim() ||
          null,
        source_paper_id:
          sourcePaperId
            ? Number(
                sourcePaperId
              )
            : null,
      };

      const response =
        await fetch(
          experiment
            ? `${API_BASE_URL}/api/experiments/${experiment.id}`
            : `${API_BASE_URL}/api/experiments/`,
          {
            method:
              experiment
                ? "PUT"
                : "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not save experiment."
        );
      }

      await onSaved();

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not save experiment."
      );

    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!experiment) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this experiment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response =
        await fetch(
          `${API_BASE_URL}/api/experiments/${experiment.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not delete experiment."
        );
      }

      await onSaved();

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not delete experiment."
      );

    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="experiment-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="experiment-modal">

        <div className="experiment-modal-header">

          <div>
            <span className="eyebrow">
              Research execution
            </span>

            <h3>
              {experiment
                ? "Edit experiment"
                : "New experiment"}
            </h3>

            <p>
              Document what you are
              testing, how you tested it,
              and what you learned.
            </p>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            title="Close"
          >
            <X size={19} />
          </button>

        </div>

        <form
          className="experiment-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="experiment-form-field">

            <label>
              Experiment name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="e.g. Baseline model comparison"
              disabled={saving}
            />

          </div>

          <div className="experiment-form-field">

            <label>
              Objective
            </label>

            <textarea
              value={objective}
              onChange={(event) =>
                setObjective(
                  event.target.value
                )
              }
              placeholder="What are you trying to investigate?"
              rows={4}
              disabled={saving}
            />

          </div>

          <div className="experiment-form-field">

            <label>
              Hypothesis
              <span>
                optional
              </span>
            </label>

            <textarea
              value={hypothesis}
              onChange={(event) =>
                setHypothesis(
                  event.target.value
                )
              }
              placeholder="What do you expect to happen and why?"
              rows={3}
              disabled={saving}
            />

          </div>

          <div className="experiment-form-grid">

            <div className="experiment-form-field">

              <label>
                Type
              </label>

              <select
                value={
                  experimentType
                }
                onChange={(event) =>
                  setExperimentType(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option>
                  Baseline
                </option>

                <option>
                  Ablation
                </option>

                <option>
                  Comparison
                </option>

                <option>
                  Prototype
                </option>

                <option>
                  Evaluation
                </option>

                <option>
                  Validation
                </option>

                <option>
                  Other
                </option>
              </select>

            </div>

            <div className="experiment-form-field">

              <label>
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option>
                  Planned
                </option>

                <option>
                  Running
                </option>

                <option>
                  Completed
                </option>

                <option>
                  Paused
                </option>

                <option>
                  Failed
                </option>
              </select>

            </div>

          </div>

          <div className="experiment-form-grid">

            <div className="experiment-form-field">

              <label>
                Dataset
                <span>
                  optional
                </span>
              </label>

              <input
                value={dataset}
                onChange={(event) =>
                  setDataset(
                    event.target.value
                  )
                }
                placeholder="Dataset or data source"
                disabled={saving}
              />

            </div>

            <div className="experiment-form-field">

              <label>
                Model / method
                <span>
                  optional
                </span>
              </label>

              <input
                value={model}
                onChange={(event) =>
                  setModel(
                    event.target.value
                  )
                }
                placeholder="Model, algorithm, framework..."
                disabled={saving}
              />

            </div>

          </div>

          <div className="experiment-form-grid">

            <div className="experiment-form-field">

              <label>
                Metric
                <span>
                  optional
                </span>
              </label>

              <input
                value={metricName}
                onChange={(event) =>
                  setMetricName(
                    event.target.value
                  )
                }
                placeholder="Accuracy, F1, MAE..."
                disabled={saving}
              />

            </div>

            <div className="experiment-form-field">

              <label>
                Metric value
                <span>
                  optional
                </span>
              </label>

              <input
                value={metricValue}
                onChange={(event) =>
                  setMetricValue(
                    event.target.value
                  )
                }
                placeholder="e.g. 91.2%"
                disabled={saving}
              />

            </div>

          </div>

          <div className="experiment-form-field">

            <label>
              Results
              <span>
                optional
              </span>
            </label>

            <textarea
              value={results}
              onChange={(event) =>
                setResults(
                  event.target.value
                )
              }
              placeholder="Record observations, measurements, comparisons, unexpected findings..."
              rows={4}
              disabled={saving}
            />

          </div>

          <div className="experiment-form-field">

            <label>
              Conclusion
              <span>
                optional
              </span>
            </label>

            <textarea
              value={conclusion}
              onChange={(event) =>
                setConclusion(
                  event.target.value
                )
              }
              placeholder="What did you learn from the experiment?"
              rows={3}
              disabled={saving}
            />

          </div>

          <div className="experiment-form-field">

            <label>
              Next step
              <span>
                optional
              </span>
            </label>

            <textarea
              value={nextStep}
              onChange={(event) =>
                setNextStep(
                  event.target.value
                )
              }
              placeholder="What should you test or change next?"
              rows={3}
              disabled={saving}
            />

          </div>

          <div className="experiment-form-field">

            <label>
              Linked paper
              <span>
                optional
              </span>
            </label>

            <select
              value={
                sourcePaperId
              }
              onChange={(event) =>
                setSourcePaperId(
                  event.target.value
                )
              }
              disabled={saving}
            >

              <option value="">
                No linked paper
              </option>

              {papers.map(
                (paper) => (

                  <option
                    key={paper.id}
                    value={paper.id}
                  >
                    {paper.title}
                  </option>

                )
              )}

            </select>

          </div>

          {error && (
            <div className="experiment-modal-error">
              <X size={15} />
              {error}
            </div>
          )}

          <div className="experiment-modal-footer">

            {experiment ? (
              <button
                type="button"
                className="danger-button"
                onClick={
                  handleDelete
                }
                disabled={
                  saving ||
                  deleting
                }
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            ) : (
              <span />
            )}

            <div className="experiment-modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  onClose
                }
                disabled={
                  saving ||
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving ||
                  deleting
                }
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    {experiment
                      ? "Save changes"
                      : "Create experiment"}
                  </>
                )}
              </button>

            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
/* =========================================================
   LEARN
========================================================= */

function LearnPage() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] =
    useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [error, setError] = useState("");

  const [selectedTopic, setSelectedTopic] =
    useState(null);

  const [topicModalOpen, setTopicModalOpen] =
    useState(false);
  const [editingTopic, setEditingTopic] =
    useState(null);

  const [noteModalOpen, setNoteModalOpen] =
    useState(false);
  const [editingNote, setEditingNote] = 
    useState(null);

  const [resourceModalOpen, setResourceModalOpen] =
    useState(false);
  const [editingResource, setEditingResource] =
    useState(null);

  const [quizModalOpen, setQuizModalOpen] =
    useState(false);
  const [editingQuiz, setEditingQuiz] =
    useState(null);

  async function loadTopics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/learn/topics`
      );

      if (!response.ok) {
        throw new Error(
          `Could not load learning topics (${response.status}).`
        );
      }

      const data = await response.json();

      setTopics(data);

      if (
        selectedTopicId &&
        data.some(
          (topic) => topic.id === selectedTopicId
        )
      ) {
        return;
      }

      if (data.length > 0) {
        setSelectedTopicId(data[0].id);
      } else {
        setSelectedTopicId(null);
        setSelectedTopic(null);
      }
    } catch (err) {
      setError(
        err.message ||
          "Could not load learning topics."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTopic(topicId) {
    try {
      setDetailLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/learn/topics/${topicId}`
      );

      if (!response.ok) {
        throw new Error(
          `Could not load topic (${response.status}).`
        );
      }

      const data = await response.json();

      setSelectedTopic(data);
    } catch (err) {
      setError(
        err.message ||
          "Could not load the selected topic."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      loadTopic(selectedTopicId);
    }
  }, [selectedTopicId]);

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (topic.category || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (topic.description || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      topic.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function handleDeleteTopic(topicId) {
    const confirmed = window.confirm(
      "Delete this learning topic and all its notes, resources and quizzes?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/learn/topics/${topicId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not delete topic (${response.status}).`
        );
      }

      if (selectedTopicId === topicId) {
        setSelectedTopicId(null);
        setSelectedTopic(null);
      }

      await loadTopics();
    } catch (err) {
      setError(
        err.message ||
          "Could not delete the learning topic."
      );
    }
  }

  async function handleDeleteNote(noteId) {
    const confirmed = window.confirm(
      "Delete this learning note?"
    );

    if (!confirmed || !selectedTopicId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/learn/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not delete note (${response.status}).`
        );
      }

      await loadTopic(selectedTopicId);
    } catch (err) {
      setError(
        err.message ||
          "Could not delete the learning note."
      );
    }
  }

  async function handleDeleteResource(resourceId) {
    const confirmed = window.confirm(
      "Delete this resource?"
    );

    if (!confirmed || !selectedTopicId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/learn/resources/${resourceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not delete resource (${response.status}).`
        );
      }

      await loadTopic(selectedTopicId);
    } catch (err) {
      setError(
        err.message ||
          "Could not delete the learning resource."
      );
    }
  }

  async function handleDeleteQuiz(quizId) {
    const confirmed = window.confirm(
      "Delete this quiz question?"
    );

    if (!confirmed || !selectedTopicId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/learn/quizzes/${quizId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not delete quiz (${response.status}).`
        );
      }

      await loadTopic(selectedTopicId);
    } catch (err) {
      setError(
        err.message ||
          "Could not delete the quiz question."
      );
    }
  }

  async function handleTopicSaved() {
    setTopicModalOpen(false);
    setEditingTopic(null);
    await loadTopics();
  }

  async function handleNoteSaved() {
    setNoteModalOpen(false);
    setEditingNote(null);

    if (selectedTopicId) {
      await loadTopic(selectedTopicId);
      await loadTopics();
    }
  }

  async function handleResourceSaved() {
    setResourceModalOpen(false);
    setEditingResource(null);

    if (selectedTopicId) {
      await loadTopic(selectedTopicId);
      await loadTopics();
    }
  }

  async function handleQuizSaved() {
    setQuizModalOpen(false);
    setEditingQuiz(null);

    if (selectedTopicId) {
      await loadTopic(selectedTopicId);
      await loadTopics();
    }
  }

  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Personal knowledge library
          </span>

          <h2>Learn</h2>

          <p className="welcome-subtitle">
            Save what you learn, build your own
            understanding, and keep it for your
            entire PhD journey.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setEditingTopic(null);
            setTopicModalOpen(true);
          }}
        >
          <Plus size={16} />
          New topic
        </button>
      </section>

      {error && (
        <div className="learn-error">
          <X size={15} />
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <section className="learn-library-layout">
        <aside className="learn-topic-sidebar">
          <div className="learn-topic-toolbar">
            <div className="learn-search">
              <Search size={15} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search topics..."
              />
            </div>

            <div className="learn-filter-tabs">
              {[
                "All",
                "Not Started",
                "In Progress",
                "Completed",
              ].map((status) => (
                <button
                  key={status}
                  className={
                    statusFilter === status
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(status)
                  }
                >
                  {status === "Not Started"
                    ? "New"
                    : status === "In Progress"
                    ? "Learning"
                    : status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="learn-empty-state">
              <LoaderCircle
                size={20}
                className="spin"
              />
              <span>Loading your topics...</span>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="learn-empty-state">
              <div className="learn-empty-icon">
                <BookOpen size={20} />
              </div>

              <strong>
                {search || statusFilter !== "All"
                  ? "No matching topics"
                  : "No learning topics yet"}
              </strong>

              <span>
                {search || statusFilter !== "All"
                  ? "Try another search or filter."
                  : "Create your first topic to start building your knowledge library."}
              </span>

              {!search &&
                statusFilter === "All" && (
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingTopic(null);
                      setTopicModalOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    Create topic
                  </button>
                )}
            </div>
          ) : (
            <div className="learn-topic-list">
              {filteredTopics.map((topic) => {
                const isSelected =
                  selectedTopicId === topic.id;

                return (
                  <button
                    key={topic.id}
                    className={`learn-topic-card ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedTopicId(topic.id)
                    }
                  >
                    <div className="learn-topic-card-top">
                      <div className="learn-topic-icon">
                        <Brain size={17} />
                      </div>

                      <span
                        className={`learn-status ${topic.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {topic.status}
                      </span>
                    </div>

                    <h3>{topic.title}</h3>

                    {topic.category && (
                      <span className="learn-topic-category">
                        {topic.category}
                      </span>
                    )}

                    {topic.description && (
                      <p>
                        {topic.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="learn-topic-workspace">
          {!selectedTopicId ? (
            <div className="learn-workspace-empty">
              <div className="learn-workspace-empty-icon">
                <Library size={28} />
              </div>

              <h3>Build your knowledge library</h3>

              <p>
                Create a learning topic such as
                RNN, PCA, GAT, LoRA, statistics,
                research methods, or anything you
                want to understand better.
              </p>

              <button
                className="primary-button"
                onClick={() => {
                  setEditingTopic(null);
                  setTopicModalOpen(true);
                }}
              >
                <Plus size={16} />
                Create your first topic
              </button>
            </div>
          ) : detailLoading ? (
            <div className="learn-workspace-loading">
              <LoaderCircle
                size={22}
                className="spin"
              />
              Loading topic...
            </div>
          ) : selectedTopic ? (
            <>
              <div className="learn-workspace-header">
                <div>
                  <span className="eyebrow">
                    {selectedTopic.category ||
                      "Learning topic"}
                  </span>

                  <h3>
                    {selectedTopic.title}
                  </h3>

                  {selectedTopic.description && (
                    <p>
                      {selectedTopic.description}
                    </p>
                  )}
                </div>

                <div className="learn-workspace-actions">
                  <span
                    className={`learn-status learn-status-large ${selectedTopic.status
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {selectedTopic.status}
                  </span>

                  <button
                    className="small-icon-button"
                    title="Edit topic"
                    onClick={() => {
                      setEditingTopic(
                        selectedTopic
                      );
                      setTopicModalOpen(true);
                    }}
                  >
                    <MoreHorizontal
                      size={17}
                    />
                  </button>

                  <button
                    className="learn-delete-button"
                    onClick={() =>
                      handleDeleteTopic(
                        selectedTopic.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="learn-section-block">
                <div className="learn-section-heading">
                  <div>
                    <span className="eyebrow">
                      Your knowledge
                    </span>

                    <h4>
                      Learning notes
                    </h4>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingNote(null);
                      setNoteModalOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    Add note
                  </button>
                </div>

                {selectedTopic.notes?.length ===
                0 ? (
                  <div className="learn-inline-empty">
                    <FileText size={18} />

                    <div>
                      <strong>
                        No notes yet
                      </strong>

                      <span>
                        Add what you learned in your
                        own words.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="learn-note-list">
                    {selectedTopic.notes.map(
                      (note) => (
                        <article
                          className="learn-note-card"
                          key={note.id}
                        >
                          <div className="learn-note-card-top">
                            <span className="learn-note-section">
                              {note.section}
                            </span>

                            <div>
                              <button
                                className="small-icon-button"
                                title="Edit note"
                                onClick={() => {
                                  setEditingNote(
                                    note
                                  );
                                  setNoteModalOpen(
                                    true
                                  );
                                }}
                              >
                                <MoreHorizontal
                                  size={15}
                                />
                              </button>

                              <button
                                className="learn-mini-delete"
                                onClick={() =>
                                  handleDeleteNote(
                                    note.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <p>
                            {note.content}
                          </p>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="learn-section-block">
                <div className="learn-section-heading">
                  <div>
                    <span className="eyebrow">
                      Useful material
                    </span>

                    <h4>Resources</h4>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingResource(
                        null
                      );
                      setResourceModalOpen(
                        true
                      );
                    }}
                  >
                    <Plus size={15} />
                    Add resource
                  </button>
                </div>

                {selectedTopic.resources
                  ?.length === 0 ? (
                  <div className="learn-inline-empty">
                    <BookOpen size={18} />

                    <div>
                      <strong>
                        No resources yet
                      </strong>

                      <span>
                        Save books, papers, videos,
                        websites, PDFs or courses.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="learn-resource-list">
                    {selectedTopic.resources.map(
                      (resource) => (
                        <article
                          className="learn-resource-card"
                          key={resource.id}
                        >
                          <div className="learn-resource-icon">
                            <FileText
                              size={16}
                            />
                          </div>

                          <div className="learn-resource-main">
                            <strong>
                              {resource.title}
                            </strong>

                            <span>
                              {
                                resource.resource_type
                              }
                            </span>

                            {resource.notes && (
                              <p>
                                {
                                  resource.notes
                                }
                              </p>
                            )}

                            {resource.url && (
                              <a
                                href={
                                  resource.url
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open resource
                                <ArrowRight
                                  size={13}
                                />
                              </a>
                            )}
                          </div>

                          <div className="learn-resource-actions">
                            <button
                              className="small-icon-button"
                              title="Edit resource"
                              onClick={() => {
                                setEditingResource(
                                  resource
                                );
                                setResourceModalOpen(
                                  true
                                );
                              }}
                            >
                              <MoreHorizontal
                                size={15}
                              />
                            </button>

                            <button
                              className="learn-mini-delete"
                              onClick={() =>
                                handleDeleteResource(
                                  resource.id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="learn-section-block">
                <div className="learn-section-heading">
                  <div>
                    <span className="eyebrow">
                      Active recall
                    </span>

                    <h4>Self Quiz</h4>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingQuiz(null);
                      setQuizModalOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    Add question
                  </button>
                </div>

                {selectedTopic.quizzes?.length ===
                0 ? (
                  <div className="learn-inline-empty">
                    <Zap size={18} />

                    <div>
                      <strong>
                        No quiz questions yet
                      </strong>

                      <span>
                        Add questions you can use later
                        to test yourself.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="learn-quiz-list">
                    {selectedTopic.quizzes.map(
                      (quiz, index) => (
                        <article
                          className="learn-quiz-card"
                          key={quiz.id}
                        >
                          <div className="learn-quiz-number">
                            {index + 1}
                          </div>

                          <div className="learn-quiz-main">
                            <div className="learn-quiz-top">
                              <span>
                                {quiz.difficulty}
                              </span>

                              <div>
                                <button
                                  className="small-icon-button"
                                  title="Edit question"
                                  onClick={() => {
                                    setEditingQuiz(
                                      quiz
                                    );
                                    setQuizModalOpen(
                                      true
                                    );
                                  }}
                                >
                                  <MoreHorizontal
                                    size={15}
                                  />
                                </button>

                                <button
                                  className="learn-mini-delete"
                                  onClick={() =>
                                    handleDeleteQuiz(
                                      quiz.id
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <strong>
                              {quiz.question}
                            </strong>

                            <details>
                              <summary>
                                Show answer
                              </summary>

                              <p>
                                {quiz.answer}
                              </p>
                            </details>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>
      </section>

      {topicModalOpen && (
        <LearningTopicModal
          topic={editingTopic}
          onClose={() => {
            setTopicModalOpen(false);
            setEditingTopic(null);
          }}
          onSaved={handleTopicSaved}
        />
      )}

      {noteModalOpen && selectedTopicId && (
        <LearningNoteModal
          topicId={selectedTopicId}
          note={editingNote}
          onClose={() => {
            setNoteModalOpen(false);
            setEditingNote(null);
          }}
          onSaved={handleNoteSaved}
        />
      )}

      {resourceModalOpen &&
        selectedTopicId && (
          <LearningResourceModal
            topicId={selectedTopicId}
            resource={editingResource}
            onClose={() => {
              setResourceModalOpen(false);
              setEditingResource(null);
            }}
            onSaved={handleResourceSaved}
          />
        )}

      {quizModalOpen && selectedTopicId && (
        <LearningQuizModal
          topicId={selectedTopicId}
          quiz={editingQuiz}
          onClose={() => {
            setQuizModalOpen(false);
            setEditingQuiz(null);
          }}
          onSaved={handleQuizSaved}
        />
      )}
    </div>
  );
}


/* =========================================================
   LEARN - TOPIC MODAL
========================================================= */

function LearningTopicModal({
  topic,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState(
    topic?.title || ""
  );

  const [category, setCategory] = useState(
    topic?.category || "Other"
  );

  const [description, setDescription] =
    useState(topic?.description || "");

  const [status, setStatus] = useState(
    topic?.status || "Not Started"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Topic title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = topic
        ? `${API_BASE_URL}/api/learn/topics/${topic.id}`
        : `${API_BASE_URL}/api/learn/topics`;

      const method = topic ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim() || "Other",
          description:
            description.trim() || null,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.detail ||
            `Could not save topic (${response.status}).`
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err.message || "Could not save topic."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="learn-modal-backdrop">
      <div className="learn-modal">
        <div className="learn-modal-header">
          <div>
            <span className="eyebrow">
              {topic
                ? "Update learning topic"
                : "New learning topic"}
            </span>

            <h3>
              {topic
                ? "Edit topic"
                : "Create a topic"}
            </h3>
          </div>

          <button
            className="small-icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="learn-modal-form"
          onSubmit={handleSubmit}
        >
          <label>
            Topic
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. RNN"
              disabled={saving}
            />
          </label>

          <label>
            Category
            <input
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              placeholder="e.g. Deep Learning"
              disabled={saving}
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="What are you trying to understand?"
              rows={4}
              disabled={saving}
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              disabled={saving}
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </label>

          {error && (
            <div className="learn-modal-error">
              <X size={14} />
              {error}
            </div>
          )}

          <div className="learn-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={15} />
                  {topic
                    ? "Save changes"
                    : "Create topic"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* =========================================================
   LEARN - NOTE MODAL
========================================================= */

function LearningNoteModal({
  topicId,
  note,
  onClose,
  onSaved,
}) {
  const [section, setSection] = useState(
    note?.section || "What is it?"
  );

  const [content, setContent] = useState(
    note?.content || ""
  );

  const [sectionOrder, setSectionOrder] =
    useState(
      note?.section_order ?? 0
    );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!section.trim()) {
      setError("Section name is required.");
      return;
    }

    if (!content.trim()) {
      setError("Note content is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = note
        ? `${API_BASE_URL}/api/learn/notes/${note.id}`
        : `${API_BASE_URL}/api/learn/topics/${topicId}/notes`;

      const method = note ? "PUT" : "POST";

      const body = {
        section: section.trim(),
        content: content.trim(),
        section_order: Number(sectionOrder),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.detail ||
            `Could not save note (${response.status}).`
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err.message || "Could not save note."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="learn-modal-backdrop">
      <div className="learn-modal">
        <div className="learn-modal-header">
          <div>
            <span className="eyebrow">
              {note
                ? "Edit learning note"
                : "Add learning note"}
            </span>

            <h3>
              {note
                ? "Update your note"
                : "Save what you learned"}
            </h3>
          </div>

          <button
            className="small-icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="learn-modal-form"
          onSubmit={handleSubmit}
        >
          <label>
            Section
            <input
              value={section}
              onChange={(event) =>
                setSection(event.target.value)
              }
              placeholder="e.g. My Understanding"
              disabled={saving}
            />
          </label>

          <label>
            Order
            <input
              type="number"
              min="0"
              value={sectionOrder}
              onChange={(event) =>
                setSectionOrder(
                  event.target.value
                )
              }
              disabled={saving}
            />
          </label>

          <label>
            Your notes
            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Write the concept in your own words..."
              rows={8}
              disabled={saving}
            />
          </label>

          {error && (
            <div className="learn-modal-error">
              <X size={14} />
              {error}
            </div>
          )}

          <div className="learn-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={15} />
                  {note
                    ? "Save changes"
                    : "Save note"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* =========================================================
   LEARN - RESOURCE MODAL
========================================================= */

function LearningResourceModal({
  topicId,
  resource,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState(
    resource?.title || ""
  );

  const [url, setUrl] = useState(
    resource?.url || ""
  );

  const [resourceType, setResourceType] =
    useState(
      resource?.resource_type || "Other"
    );

  const [notes, setNotes] = useState(
    resource?.notes || ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Resource title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const urlEndpoint = resource
        ? `${API_BASE_URL}/api/learn/resources/${resource.id}`
        : `${API_BASE_URL}/api/learn/topics/${topicId}/resources`;

      const method = resource ? "PUT" : "POST";

      const response = await fetch(
        urlEndpoint,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            url: url.trim() || null,
            resource_type: resourceType,
            notes: notes.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ||
            `Could not save resource (${response.status}).`
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err.message ||
          "Could not save resource."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="learn-modal-backdrop">
      <div className="learn-modal">
        <div className="learn-modal-header">
          <div>
            <span className="eyebrow">
              {resource
                ? "Edit resource"
                : "Add resource"}
            </span>

            <h3>
              {resource
                ? "Update resource"
                : "Save a learning resource"}
            </h3>
          </div>

          <button
            className="small-icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="learn-modal-form"
          onSubmit={handleSubmit}
        >
          <label>
            Title
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Deep Learning Book"
              disabled={saving}
            />
          </label>

          <label>
            Resource type
            <select
              value={resourceType}
              onChange={(event) =>
                setResourceType(
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option>Paper</option>
              <option>Book</option>
              <option>Video</option>
              <option>Website</option>
              <option>Course</option>
              <option>PDF</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            URL
            <input
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              placeholder="https://..."
              disabled={saving}
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Why is this useful?"
              rows={5}
              disabled={saving}
            />
          </label>

          {error && (
            <div className="learn-modal-error">
              <X size={14} />
              {error}
            </div>
          )}

          <div className="learn-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={15} />
                  {resource
                    ? "Save changes"
                    : "Save resource"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* =========================================================
   LEARN - QUIZ MODAL
========================================================= */

function LearningQuizModal({
  topicId,
  quiz,
  onClose,
  onSaved,
}) {
  const [question, setQuestion] =
    useState(quiz?.question || "");

  const [answer, setAnswer] = useState(
    quiz?.answer || ""
  );

  const [difficulty, setDifficulty] =
    useState(
      quiz?.difficulty || "Medium"
    );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!question.trim()) {
      setError("Question is required.");
      return;
    }

    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = quiz
        ? `${API_BASE_URL}/api/learn/quizzes/${quiz.id}`
        : `${API_BASE_URL}/api/learn/topics/${topicId}/quizzes`;

      const method = quiz ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          difficulty,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ||
            `Could not save quiz (${response.status}).`
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err.message ||
          "Could not save quiz."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="learn-modal-backdrop">
      <div className="learn-modal">
        <div className="learn-modal-header">
          <div>
            <span className="eyebrow">
              {quiz
                ? "Edit quiz question"
                : "Add quiz question"}
            </span>

            <h3>
              {quiz
                ? "Update self-test"
                : "Create a self-test"}
            </h3>
          </div>

          <button
            className="small-icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="learn-modal-form"
          onSubmit={handleSubmit}
        >
          <label>
            Question
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              placeholder="What do you want to test yourself on?"
              rows={5}
              disabled={saving}
            />
          </label>

          <label>
            Answer
            <textarea
              value={answer}
              onChange={(event) =>
                setAnswer(
                  event.target.value
                )
              }
              placeholder="Write the correct answer..."
              rows={5}
              disabled={saving}
            />
          </label>

          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          {error && (
            <div className="learn-modal-error">
              <X size={14} />
              {error}
            </div>
          )}

          <div className="learn-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={15} />
                  {quiz
                    ? "Save changes"
                    : "Save question"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   REVIEW
========================================================= */

function ReviewPage() {
  const [topics, setTopics] = useState([]);
  const [quizItems, setQuizItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  async function loadReviewData() {
    try {
      setLoading(true);
      setError("");

      const topicsResponse = await fetch(
        `${API_BASE_URL}/api/learn/topics`
      );

      if (!topicsResponse.ok) {
        throw new Error(
          `Could not load learning topics (${topicsResponse.status}).`
        );
      }

      const topicData = await topicsResponse.json();

      if (!Array.isArray(topicData)) {
        setTopics([]);
        setQuizItems([]);
        return;
      }

      setTopics(topicData);

      const topicDetails = await Promise.all(
        topicData.map(async (topic) => {
          const response = await fetch(
            `${API_BASE_URL}/api/learn/topics/${topic.id}`
          );

          if (!response.ok) {
            return null;
          }

          return response.json();
        })
      );

      const allQuizzes = [];

      topicDetails
        .filter(Boolean)
        .forEach((topic) => {
          if (Array.isArray(topic.quizzes)) {
            topic.quizzes.forEach((quiz) => {
              allQuizzes.push({
                ...quiz,
                topic_title: topic.title,
              });
            });
          }
        });

      setQuizItems(allQuizzes);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not load your review questions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviewData();
  }, []);

  function startQuiz(quiz) {
    setActiveQuiz(quiz);
    setShowAnswer(false);
  }

  function closeQuiz() {
    setActiveQuiz(null);
    setShowAnswer(false);
  }

  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Spaced repetition
          </span>

          <h2>Review</h2>

          <p className="welcome-subtitle">
            Test yourself using the questions
            you created while learning.
          </p>
        </div>

        {quizItems.length > 0 && (
          <button
            className="primary-button"
            onClick={() =>
              startQuiz(quizItems[0])
            }
          >
            <Play
              size={16}
              fill="currentColor"
            />
            Start review
          </button>
        )}
      </section>

      {loading && (
        <div className="inline-status">
          <LoaderCircle
            size={18}
            className="spin"
          />

          Loading your review questions...
        </div>
      )}

      {error && (
        <div className="soft-notice">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        quizItems.length === 0 && (
          <div className="paper-library-empty">
            <div className="paper-library-empty-icon">
              <Brain size={25} />
            </div>

            <h3>
              No review questions yet
            </h3>

            <p>
              Create quiz questions inside
              Learn and they will appear here
              for review.
            </p>
          </div>
        )}

      {!loading && quizItems.length > 0 && (
        <section className="review-list">
          {quizItems.map((quiz) => (
            <button
              className="review-item"
              key={quiz.id}
              onClick={() =>
                startQuiz(quiz)
              }
            >
              <div className="review-icon">
                <Brain size={18} />
              </div>

              <div>
                <strong>
                  {quiz.question}
                </strong>

                <span>
                  {quiz.topic_title} ·{" "}
                  {quiz.difficulty}
                </span>
              </div>

              <ArrowRight size={16} />
            </button>
          ))}
        </section>
      )}

      {activeQuiz && (
        <div
          className="learn-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeQuiz();
            }
          }}
        >
          <div className="learn-modal review-quiz-modal">
            <div className="learn-modal-header">
              <div>
                <span className="eyebrow">
                  {activeQuiz.topic_title}
                </span>

                <h3>
                  Test yourself
                </h3>
              </div>

              <button
                className="small-icon-button"
                onClick={closeQuiz}
              >
                <X size={18} />
              </button>
            </div>

            <div className="review-quiz-content">
              <span className="review-quiz-difficulty">
                {activeQuiz.difficulty}
              </span>

              <h4>
                {activeQuiz.question}
              </h4>

              {!showAnswer ? (
                <button
                  className="primary-button"
                  onClick={() =>
                    setShowAnswer(true)
                  }
                >
                  <Check size={16} />
                  Reveal answer
                </button>
              ) : (
                <div className="review-answer-card">
                  <span>
                    Answer
                  </span>

                  <p>
                    {activeQuiz.answer}
                  </p>
                </div>
              )}
            </div>

            <div className="learn-modal-footer">
              <button
                className="secondary-button"
                onClick={closeQuiz}
              >
                Close
              </button>

              {showAnswer && (
                <button
                  className="primary-button"
                  onClick={() => {
                    const currentIndex =
                      quizItems.findIndex(
                        (quiz) =>
                          quiz.id ===
                          activeQuiz.id
                      );

                    const nextQuiz =
                      quizItems[
                        currentIndex + 1
                      ];

                    if (nextQuiz) {
                      startQuiz(nextQuiz);
                    } else {
                      closeQuiz();
                    }
                  }}
                >
                  <ArrowRight size={15} />
                  Next question
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   AUDIO
========================================================= */

function AudioPage() {
  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Voice learning
          </span>

          <h2>Audio tutor</h2>

          <p className="welcome-subtitle">
            Turn research concepts into spoken
            learning sessions.
          </p>
        </div>

        <button className="primary-button">
          <Headphones size={16} />
          Start audio session
        </button>
      </section>

      <section className="simple-card">
        <div className="focus-icon">
          <Headphones size={23} />
        </div>

        <h3>
          Your research tutor
        </h3>

        <p>
          Ask questions, request explanations,
          practise recall and discuss papers
          using your voice.
        </p>

        <div className="audio-feature-grid">
          <div>
            <MessageSquare size={18} />
            <strong>
              Research discussion
            </strong>
          </div>

          <div>
            <Brain size={18} />
            <strong>
              Concept explanation
            </strong>
          </div>

          <div>
            <Trophy size={18} />
            <strong>
              Viva practice
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   VIVA
========================================================= */

function VivaPage() {
  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            PhD defence preparation
          </span>

          <h2>Viva examiner</h2>

          <p className="welcome-subtitle">
            Practise explaining your research
            under realistic questioning.
          </p>
        </div>

        <button className="primary-button">
          <MessageSquare size={16} />
          Start viva
        </button>
      </section>

      <section className="viva-card">
        <div className="viva-icon">
          <GraduationCap size={25} />
        </div>

        <h3>
          Your examiner is ready
        </h3>

        <p>
          Questions can cover fundamentals,
          methodology, literature, limitations,
          experimental design and your
          research contribution.
        </p>

        <div className="viva-topics">
          <span>Fundamentals</span>
          <span>Methodology</span>
          <span>Literature</span>
          <span>Limitations</span>
          <span>Contribution</span>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MANUSCRIPT
========================================================= */

function ManuscriptPage() {
  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            Research writing
          </span>

          <h2>Manuscript</h2>

          <p className="welcome-subtitle">
            Organise ideas, references and
            sections for future publications.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={16} />
          New manuscript
        </button>
      </section>

      <section className="writing-board">
        {[
          "Introduction",
          "Related Work",
          "Methodology",
          "Experiments",
          "Results",
          "Discussion",
        ].map((section, index) => (
          <div
            className="writing-section"
            key={section}
          >
            <div className="writing-section-number">
              {index + 1}
            </div>

            <div>
              <strong>
                {section}
              </strong>

              <span>
                {index === 0
                  ? "Drafting"
                  : "Not started"}
              </span>
            </div>

            <ArrowRight size={15} />
          </div>
        ))}
      </section>
    </div>
  );
}

/* =========================================================
   THESIS
========================================================= */

function ThesisPage() {
  const chapters = [
    "Introduction",
    "Literature Review",
    "Research Methodology",
    "Proposed Framework",
    "Experiments",
    "Results",
    "Discussion",
    "Conclusion",
  ];

  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">
            PhD thesis
          </span>

          <h2>Thesis workspace</h2>

          <p className="welcome-subtitle">
            Build your thesis progressively from
            your research knowledge.
          </p>
        </div>

        <button className="primary-button">
          <FileText size={16} />
          Open thesis
        </button>
      </section>

      <section className="thesis-board">
        {chapters.map(
          (chapter, index) => (
            <div
              className="thesis-chapter"
              key={chapter}
            >
              <div className="thesis-number">
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </div>

              <div>
                <strong>
                  {chapter}
                </strong>

                <span>
                  {index === 0
                    ? "In progress"
                    : "Planned"}
                </span>
              </div>

              <ArrowRight size={15} />
            </div>
          )
        )}
      </section>
    </div>
  );
}

/* =========================================================
   DEFAULT EXPORT
   IMPORTANT: THIS MUST APPEAR ONLY ONCE.
========================================================= */

export default App; 