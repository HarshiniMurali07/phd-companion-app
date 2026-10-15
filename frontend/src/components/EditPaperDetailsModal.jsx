import { useEffect, useState } from "react";
import { LoaderCircle, Save, X } from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://phd-companion-app-backend.vercel.app"
).replace(/\/$/, "");

export default function EditPaperDetailsModal({
  paper,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState(paper?.title || "");
  const [authors, setAuthors] = useState(paper?.authors || "");
  const [year, setYear] = useState(
    paper?.year ? String(paper.year) : ""
  );
  const [journal, setJournal] = useState(paper?.journal || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener("keydown", handleKey);
  }, [onClose, saving]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("The title cannot be empty.");
      return;
    }

    const yearText = year.trim();

    if (yearText && !/^\d{4}$/.test(yearText)) {
      setError("Year must be a 4-digit number, e.g. 2023.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/papers/${paper.id}/details`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            authors: authors.trim(),
            year: yearText ? Number(yearText) : null,
            journal: journal.trim(),
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        // No JSON body.
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || "Could not save the details."
        );
      }

      onSaved({
        title: data.title,
        authors: data.authors,
        year: data.year,
        journal: data.journal,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save the details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="pd-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form className="pd-modal" onSubmit={handleSubmit}>
        <div className="pd-modal-head">
          <div>
            <span className="eyebrow">Paper details</span>
            <h3>Edit details</h3>
            <p>
              Correct anything the automatic extraction got wrong.
              Your notes and PDF are not affected.
            </p>
          </div>

          <button
            type="button"
            className="pd-icon"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="pd-modal-fields">
          <div className="pd-field">
            <label>Title</label>
            <textarea
              rows={3}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="pd-field">
            <label>Authors</label>
            <textarea
              rows={2}
              value={authors}
              onChange={(event) => setAuthors(event.target.value)}
              placeholder="e.g. Yukun Zhou, Siegfried K. Wagner, ..."
              disabled={saving}
            />
          </div>

          <div className="pd-modal-row">
            <div className="pd-field">
              <label>Year</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="2023"
                disabled={saving}
              />
            </div>

            <div className="pd-field">
              <label>Journal / venue</label>
              <input
                type="text"
                value={journal}
                onChange={(event) => setJournal(event.target.value)}
                placeholder="e.g. Nature"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="paper-notes-error">{error}</div>
        )}

        <div className="pd-form-actions">
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
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Saving..." : "Save details"}
          </button>
        </div>
      </form>
    </div>
  );
}
