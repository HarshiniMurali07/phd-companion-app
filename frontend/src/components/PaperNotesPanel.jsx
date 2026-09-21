import { useEffect, useState } from "react";
import {
  Check,
  Edit3,
  LoaderCircle,
  Save,
  Tag,
  X,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const NOTE_FIELDS = [
  {
    key: "notes",
    label: "General Notes",
    placeholder:
      "Write what you understood from this paper in your own words...",
  },
  {
    key: "research_problem",
    label: "Research Problem",
    placeholder:
      "What problem is this paper trying to solve?",
  },
  {
    key: "methodology_notes",
    label: "Methodology Notes",
    placeholder:
      "Write your understanding of the methodology, models, datasets, experiments, etc.",
  },
  {
    key: "key_findings",
    label: "Key Findings",
    placeholder:
      "What are the most important findings you want to remember?",
  },
  {
    key: "research_gap",
    label: "Research Gap",
    placeholder:
      "What gap, limitation, or unexplored direction did you notice?",
  },
  {
    key: "limitations",
    label: "Limitations",
    placeholder:
      "What limitations did the authors mention or what limitations did you notice?",
  },
  {
    key: "relevance",
    label: "Relevance",
    placeholder:
      "How is this paper relevant to your research or PhD?",
  },
  {
    key: "personal_thoughts",
    label: "Personal Thoughts & Questions",
    placeholder:
      "Write your own thoughts, doubts, connections, or questions...",
  },
];

const EMPTY_NOTES = {
  notes: "",
  research_problem: "",
  methodology_notes: "",
  key_findings: "",
  research_gap: "",
  limitations: "",
  relevance: "",
  personal_thoughts: "",
};

export default function PaperNotesPanel({
  paperId,
  paper,
  onPaperUpdated,
}) {
  const [notes, setNotes] = useState(EMPTY_NOTES);
  const [status, setStatus] = useState(
    paper?.status || "To Read"
  );
  const [progress, setProgress] = useState(
    paper?.progress ?? 0
  );
  const [tags, setTags] = useState(
    paper?.tags || ""
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotesAndTracker() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const [notesResponse, trackerResponse] =
          await Promise.all([
            fetch(
              `${API_BASE_URL}/api/papers/${paperId}/notes`
            ),
            fetch(
              `${API_BASE_URL}/api/papers/${paperId}/tracker`
            ),
          ]);

        if (!notesResponse.ok) {
          throw new Error("Could not load your notes.");
        }

        if (!trackerResponse.ok) {
          throw new Error("Could not load your paper tracker.");
        }

        const notesData = await notesResponse.json();
        const trackerData = await trackerResponse.json();

        const loadedNotes = {
          notes: notesData.notes || "",
          research_problem: notesData.research_problem || "",
          methodology_notes: notesData.methodology_notes || "",
          key_findings: notesData.key_findings || "",
          research_gap: notesData.research_gap || "",
          limitations: notesData.limitations || "",
          relevance: notesData.relevance || "",
          personal_thoughts: notesData.personal_thoughts || "",
        };

        setNotes(loadedNotes);
        setStatus(
          trackerData.status || paper?.status || "To Read"
        );
        setProgress(
          trackerData.progress ?? paper?.progress ?? 0
        );
        setTags(trackerData.tags || paper?.tags || "");

        // Open directly in reading mode. The saved content is visible
        // as soon as the My Notes tab loads.
        setEditing(false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load your notes.");
      } finally {
        setLoading(false);
      }
    }

    loadNotesAndTracker();
  }, [paperId]);

  function updateNote(field, value) {
    setNotes((previous) => ({
      ...previous,
      [field]: value,
    }));
    setMessage("");
  }

  async function saveNotes() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const notesResponse = await fetch(
        `${API_BASE_URL}/api/papers/${paperId}/notes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notes),
        }
      );

      if (!notesResponse.ok) {
        const data = await notesResponse.json();
        throw new Error(
          data.detail || "Could not save your notes."
        );
      }

      const trackerResponse = await fetch(
        `${API_BASE_URL}/api/papers/${paperId}/tracker`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            progress: Number(progress),
            tags,
          }),
        }
      );

      if (!trackerResponse.ok) {
        const data = await trackerResponse.json();
        throw new Error(
          data.detail ||
            "Notes were saved, but tracker information could not be saved."
        );
      }

      const trackerData = await trackerResponse.json();

      if (onPaperUpdated) {
        onPaperUpdated({
          status: trackerData.status || status,
          progress:
            trackerData.progress ?? Number(progress),
          tags: trackerData.tags ?? tags,
        });
      }

      setMessage("Your notes and tracker were saved.");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="paper-notes-panel">
        <div className="paper-notes-loading">
          <LoaderCircle size={20} className="spin" />
          <span>Loading your notes...</span>
        </div>
      </section>
    );
  }

  const savedFields = NOTE_FIELDS.filter(
    (field) => notes[field.key]?.trim()
  );

  return (
    <section className="paper-notes-panel">
      <div className="paper-notes-header paper-notes-header-improved">
        <div>
          <span className="eyebrow">Your research understanding</span>
          <h3>My Notes</h3>
          <p>
            Your personal understanding, observations, gaps and questions
            about this paper.
          </p>
        </div>

        {!editing ? (
          <button
            className="secondary-button paper-notes-edit-button"
            onClick={() => {
              setMessage("");
              setError("");
              setEditing(true);
            }}
          >
            <Edit3 size={15} />
            Edit notes
          </button>
        ) : (
          <div className="paper-notes-edit-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setMessage("");
                setError("");
                setEditing(false);
              }}
              disabled={saving}
            >
              <X size={15} />
              Cancel
            </button>

            <button
              className="primary-button"
              onClick={saveNotes}
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Saving..." : "Save notes"}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="paper-notes-success">
          <Check size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="paper-notes-error">{error}</div>
      )}

      {editing ? (
        <div className="paper-notes-edit-view">
          <div className="paper-notes-tracker">
            <div className="paper-notes-control">
              <label>Status</label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option>To Read</option>
                <option>Reading</option>
                <option>Read</option>
                <option>Important</option>
                <option>Revisit</option>
              </select>
            </div>

            <div className="paper-notes-control">
              <div className="paper-notes-control-label-row">
                <label>Progress</label>
                <span>{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(event) =>
                  setProgress(Number(event.target.value))
                }
              />
            </div>

            <div className="paper-notes-control">
              <label>
                <Tag size={14} /> Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(event) =>
                  setTags(event.target.value)
                }
                placeholder="e.g. Transformers, ViT, Attention"
              />
            </div>
          </div>

          <div className="paper-notes-fields">
            {NOTE_FIELDS.map((field) => (
              <div className="paper-note-field" key={field.key}>
                <label>{field.label}</label>
                <textarea
                  value={notes[field.key]}
                  onChange={(event) =>
                    updateNote(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                  rows={field.key === "notes" ? 5 : 4}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="paper-notes-read-view">
          <div className="paper-notes-summary-row">
            <div>
              <span>Status</span>
              <strong>{status}</strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div>
              <span>Sections with notes</span>
              <strong>{savedFields.length}/8</strong>
            </div>
          </div>

          {tags?.trim() && (
            <div className="paper-notes-tags-row">
              <Tag size={14} />
              {tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
            </div>
          )}

          {savedFields.length > 0 ? (
            <div className="paper-notes-read-grid">
              {NOTE_FIELDS.map((field) => {
                const value = notes[field.key]?.trim();

                if (!value) {
                  return null;
                }

                return (
                  <article
                    className={`paper-notes-read-card ${
                      field.key === "notes"
                        ? "paper-notes-read-card-wide"
                        : ""
                    }`}
                    key={field.key}
                  >
                    <span className="eyebrow">{field.label}</span>
                    <div className="paper-notes-read-content">
                      {value
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="paper-notes-empty-state">
              <Edit3 size={22} />
              <h4>No notes added yet</h4>
              <p>
                Start recording your own understanding of this paper.
              </p>
              <button
                className="primary-button"
                onClick={() => setEditing(true)}
              >
                <Edit3 size={15} />
                Write my notes
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
