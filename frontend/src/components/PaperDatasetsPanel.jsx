import { useEffect, useState } from "react";
import {
  Check,
  Database,
  Edit3,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://phd-companion-app-backend.vercel.app"
).replace(/\/$/, "");

export const DISEASES = [
  { key: "diabetes", label: "Diabetes" },
  { key: "hypertension", label: "Hypertension" },
  { key: "cvd", label: "CVD" },
  { key: "ckd", label: "CKD" },
  { key: "anaemia", label: "Anaemia" },
  { key: "other", label: "Other" },
];

export const ACCESS_OPTIONS = [
  "Public",
  "Credentialed",
  "Restricted",
  "On request",
  "Unknown",
];

const VALIDATION_OPTIONS = ["Yes", "No", "Unclear"];

const IMAGING_OPTIONS = [
  "Fundus photographs",
  "Fundus + OCT",
  "OCT",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  country: "",
  sample_size: "",
  population: "",
  diseases: [],
  imaging: "Fundus photographs",
  label_definition: "",
  external_validation: "",
  access: "",
  access_note: "",
  notes: "",
};

function splitDiseases(value) {
  return value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function readError(response, fallback) {
  try {
    const data = await response.json();
    return data?.detail || fallback;
  } catch {
    return fallback;
  }
}

function DetailRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="pd-row">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

export default function PaperDatasetsPanel({ paperId }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDatasets() {
      try {
        setLoading(true);
        setError("");
        setMessage("");
        setFormOpen(false);

        const response = await fetch(
          `${API_BASE_URL}/api/datasets/paper/${paperId}`
        );

        if (!response.ok) {
          throw new Error(
            await readError(
              response,
              "Could not load datasets."
            )
          );
        }

        const data = await response.json();

        setDatasets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load datasets.");
      } finally {
        setLoading(false);
      }
    }

    loadDatasets();
  }, [paperId]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleDisease(key) {
    setForm((previous) => ({
      ...previous,
      diseases: previous.diseases.includes(key)
        ? previous.diseases.filter((item) => item !== key)
        : [...previous.diseases, key],
    }));
  }

  function openNew() {
    setMessage("");
    setError("");
    setEditingId(null);
    setForm({ ...EMPTY_FORM, diseases: [] });
    setFormOpen(true);
  }

  function openEdit(dataset) {
    setMessage("");
    setError("");
    setEditingId(dataset.id);
    setForm({
      name: dataset.name || "",
      country: dataset.country || "",
      sample_size: dataset.sample_size || "",
      population: dataset.population || "",
      diseases: splitDiseases(dataset.diseases),
      imaging: dataset.imaging || "Fundus photographs",
      label_definition: dataset.label_definition || "",
      external_validation: dataset.external_validation || "",
      access: dataset.access || "",
      access_note: dataset.access_note || "",
      notes: dataset.notes || "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter the dataset or cohort name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        editingId
          ? `${API_BASE_URL}/api/datasets/${editingId}`
          : `${API_BASE_URL}/api/datasets/paper/${paperId}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            diseases: form.diseases.join(","),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            "Could not save this dataset."
          )
        );
      }

      const saved = await response.json();

      setDatasets((current) =>
        editingId
          ? current.map((item) =>
              item.id === saved.id ? saved : item
            )
          : [...current, saved]
      );

      setMessage(
        editingId
          ? "Dataset updated."
          : "Dataset added."
      );

      closeForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save this dataset.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dataset) {
    const confirmed = window.confirm(
      `Remove "${dataset.name}" from this paper?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/datasets/${dataset.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            "Could not delete this dataset."
          )
        );
      }

      setDatasets((current) =>
        current.filter((item) => item.id !== dataset.id)
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete this dataset.");
    }
  }

  return (
    <section className="pd-panel">
      <div className="pd-header">
        <div>
          <span className="eyebrow">Data sources</span>
          <h3>Datasets &amp; cohorts</h3>
          <p>
            Record each dataset or cohort this paper used, which
            of your five diseases it labels, and how to get access.
          </p>
        </div>

        {!formOpen && (
          <button className="primary-button" onClick={openNew}>
            <Plus size={15} />
            Add dataset
          </button>
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

      {formOpen && (
        <form className="pd-form" onSubmit={handleSave}>
          <div className="pd-grid">
            <div className="pd-field">
              <label>Dataset / cohort name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="e.g. UK Biobank"
                autoFocus
              />
            </div>

            <div className="pd-field">
              <label>Country / region</label>
              <input
                type="text"
                value={form.country}
                onChange={(event) =>
                  updateField("country", event.target.value)
                }
                placeholder="e.g. United Kingdom"
              />
            </div>

            <div className="pd-field">
              <label>Sample size</label>
              <input
                type="text"
                value={form.sample_size}
                onChange={(event) =>
                  updateField("sample_size", event.target.value)
                }
                placeholder="e.g. 48,101 patients / 96,082 images"
              />
            </div>

            <div className="pd-field">
              <label>Imaging</label>
              <select
                value={form.imaging}
                onChange={(event) =>
                  updateField("imaging", event.target.value)
                }
              >
                {IMAGING_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="pd-field pd-wide">
              <label>Population</label>
              <textarea
                rows={2}
                value={form.population}
                onChange={(event) =>
                  updateField("population", event.target.value)
                }
                placeholder="Age range, ethnicity, setting (screening, hospital, population cohort)..."
              />
            </div>

            <div className="pd-field pd-wide">
              <label>Diseases with labels in this dataset</label>
              <div className="pd-chips">
                {DISEASES.map((disease) => (
                  <button
                    type="button"
                    key={disease.key}
                    className={`pd-chip ${
                      form.diseases.includes(disease.key)
                        ? "on"
                        : ""
                    }`}
                    onClick={() => toggleDisease(disease.key)}
                  >
                    {form.diseases.includes(disease.key) && (
                      <Check size={13} />
                    )}
                    {disease.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pd-field pd-wide">
              <label>Label definition</label>
              <textarea
                rows={3}
                value={form.label_definition}
                onChange={(event) =>
                  updateField(
                    "label_definition",
                    event.target.value
                  )
                }
                placeholder="e.g. CKD: eGFR < 60 mL/min/1.73 m². Anaemia: Hb < 12 g/dL (women), < 13 g/dL (men). Hypertension: SBP ≥ 140 or DBP ≥ 90 or on treatment."
              />
            </div>

            <div className="pd-field">
              <label>External validation</label>
              <select
                value={form.external_validation}
                onChange={(event) =>
                  updateField(
                    "external_validation",
                    event.target.value
                  )
                }
              >
                <option value="">Not specified</option>
                {VALIDATION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="pd-field">
              <label>Access</label>
              <select
                value={form.access}
                onChange={(event) =>
                  updateField("access", event.target.value)
                }
              >
                <option value="">Not specified</option>
                {ACCESS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="pd-field pd-wide">
              <label>How to get access (link or steps)</label>
              <input
                type="text"
                value={form.access_note}
                onChange={(event) =>
                  updateField("access_note", event.target.value)
                }
                placeholder="e.g. https://www.ukbiobank.ac.uk/ — apply through the Access Management System"
              />
            </div>

            <div className="pd-field pd-wide">
              <label>Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(event) =>
                  updateField("notes", event.target.value)
                }
                placeholder="Anything else worth remembering about this dataset..."
              />
            </div>
          </div>

          <div className="pd-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={closeForm}
              disabled={saving}
            >
              <X size={15} />
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
              {saving ? "Saving..." : "Save dataset"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="paper-notes-loading">
          <LoaderCircle size={20} className="spin" />
          <span>Loading datasets...</span>
        </div>
      ) : datasets.length === 0 && !formOpen ? (
        <div className="pd-empty">
          <Database size={24} />
          <h4>No datasets recorded for this paper</h4>
          <p>
            Add the dataset or cohort this paper used, so it
            appears in your Dataset Matrix.
          </p>
          <button className="primary-button" onClick={openNew}>
            <Plus size={15} />
            Add dataset
          </button>
        </div>
      ) : (
        <div className="pd-list">
          {datasets.map((dataset) => {
            const diseaseList = splitDiseases(dataset.diseases);
            const note = dataset.access_note || "";

            return (
              <article className="pd-card" key={dataset.id}>
                <div className="pd-card-head">
                  <div>
                    <h4>
                      <Database size={16} />
                      {dataset.name}
                    </h4>

                    <div className="pd-meta">
                      {[
                        dataset.country,
                        dataset.sample_size,
                        dataset.imaging,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>

                  <div className="pd-actions">
                    <button
                      type="button"
                      className="pd-icon"
                      title="Edit"
                      onClick={() => openEdit(dataset)}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      className="pd-icon pd-danger"
                      title="Delete"
                      onClick={() => handleDelete(dataset)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="pd-badges">
                  {DISEASES.filter((disease) =>
                    diseaseList.includes(disease.key)
                  ).map((disease) => (
                    <span className="pd-badge" key={disease.key}>
                      {disease.label}
                    </span>
                  ))}

                  {dataset.external_validation && (
                    <span
                      className={`pd-badge pd-ev pd-ev-${slug(
                        dataset.external_validation
                      )}`}
                    >
                      External validation:{" "}
                      {dataset.external_validation}
                    </span>
                  )}

                  {dataset.access && (
                    <span
                      className={`pd-badge pd-access pd-access-${slug(
                        dataset.access
                      )}`}
                    >
                      {dataset.access}
                    </span>
                  )}
                </div>

                <DetailRow
                  label="Population"
                  value={dataset.population}
                />

                <DetailRow
                  label="Label definition"
                  value={dataset.label_definition}
                />

                {note && (
                  <div className="pd-row">
                    <span>How to get access</span>
                    <p>
                      {/^https?:\/\//.test(note.trim()) ? (
                        <a
                          href={note.trim().split(/\s+/)[0]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {note}
                        </a>
                      ) : (
                        note
                      )}
                    </p>
                  </div>
                )}

                <DetailRow label="Notes" value={dataset.notes} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
