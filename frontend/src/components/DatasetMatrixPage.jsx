import { useEffect, useMemo, useState } from "react";
import {
  Database,
  Download,
  LoaderCircle,
  Search,
} from "lucide-react";

import {
  ACCESS_OPTIONS,
  DISEASES,
} from "./PaperDatasetsPanel.jsx";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://phd-companion-app-backend.vercel.app"
).replace(/\/$/, "");

const FIVE = DISEASES.filter((d) => d.key !== "other");

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

function isAccessible(row) {
  return (
    row.access === "Public" ||
    row.access === "Credentialed"
  );
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function DatasetMatrixPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [multiOnly, setMultiOnly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/datasets/`
        );

        if (!response.ok) {
          throw new Error("Could not load your datasets.");
        }

        const data = await response.json();

        setRows(
          Array.isArray(data)
            ? data.map((row) => ({
                ...row,
                diseaseList: splitDiseases(row.diseases),
              }))
            : []
        );
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load your datasets.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function fiveCount(row) {
    return FIVE.filter((d) =>
      row.diseaseList.includes(d.key)
    ).length;
  }

  const summary = useMemo(
    () =>
      FIVE.map((disease) => {
        const matching = rows.filter((row) =>
          row.diseaseList.includes(disease.key)
        );

        return {
          ...disease,
          total: matching.length,
          accessible: matching.filter(isAccessible).length,
        };
      }),
    [rows]
  );

  const multiCount = useMemo(
    () => rows.filter((row) => fiveCount(row) >= 2).length,
    [rows]
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (
          text &&
          ![
            row.name,
            row.country,
            row.paper_title,
            row.label_definition,
          ]
            .filter(Boolean)
            .some((value) =>
              value.toLowerCase().includes(text)
            )
        ) {
          return false;
        }

        if (
          diseaseFilter !== "all" &&
          !row.diseaseList.includes(diseaseFilter)
        ) {
          return false;
        }

        if (accessFilter !== "all" && row.access !== accessFilter) {
          return false;
        }

        if (multiOnly && fiveCount(row) < 2) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          fiveCount(b) - fiveCount(a) ||
          a.name.localeCompare(b.name)
      );
  }, [rows, query, diseaseFilter, accessFilter, multiOnly]);

  function downloadCsv() {
    const header = [
      "Dataset",
      "Country",
      "Sample size",
      "Imaging",
      "Population",
      ...FIVE.map((d) => d.label),
      "Label definition",
      "External validation",
      "Access",
      "How to get access",
      "Paper",
      "Year",
      "Notes",
    ];

    const lines = filtered.map((row) =>
      [
        row.name,
        row.country,
        row.sample_size,
        row.imaging,
        row.population,
        ...FIVE.map((d) =>
          row.diseaseList.includes(d.key) ? "Yes" : ""
        ),
        row.label_definition,
        row.external_validation,
        row.access,
        row.access_note,
        row.paper_title,
        row.paper_year,
        row.notes,
      ]
        .map(csvCell)
        .join(",")
    );

    const blob = new Blob(
      ["\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "dataset-matrix.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <section className="page-header-row">
        <div>
          <span className="eyebrow">Data feasibility</span>
          <h2>Dataset Matrix</h2>
          <p className="welcome-subtitle">
            Every dataset and cohort from your papers, and which
            of the five diseases each one can support.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={downloadCsv}
          disabled={filtered.length === 0}
        >
          <Download size={15} />
          Download CSV
        </button>
      </section>

      {loading && (
        <div className="inline-status">
          <LoaderCircle size={18} className="spin" />
          Loading datasets...
        </div>
      )}

      {error && <div className="soft-notice">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="pd-empty">
          <Database size={24} />
          <h4>No datasets recorded yet</h4>
          <p>
            Open a paper, go to its Datasets tab, and add the
            dataset or cohort it used. They will appear here.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="pd-summary">
            {summary.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`pd-summary-card ${
                  diseaseFilter === item.key ? "on" : ""
                }`}
                onClick={() =>
                  setDiseaseFilter(
                    diseaseFilter === item.key ? "all" : item.key
                  )
                }
              >
                <span>{item.label}</span>
                <strong>{item.total}</strong>
                <small>
                  {item.accessible} accessible
                </small>
              </button>
            ))}

            <button
              type="button"
              className={`pd-summary-card ${
                multiOnly ? "on" : ""
              }`}
              onClick={() => setMultiOnly(!multiOnly)}
            >
              <span>2+ diseases</span>
              <strong>{multiCount}</strong>
              <small>multi-disease</small>
            </button>
          </div>

          <div className="pd-filters">
            <div className="pd-search">
              <Search size={15} />
              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search dataset, country, paper..."
              />
            </div>

            <select
              value={accessFilter}
              onChange={(event) =>
                setAccessFilter(event.target.value)
              }
              aria-label="Filter by access"
            >
              <option value="all">Any access</option>
              {ACCESS_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>

            <span className="pd-count">
              {filtered.length} of {rows.length} entries
            </span>
          </div>

          <div className="pd-table-wrap">
            <table className="pd-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Country</th>
                  <th>Size</th>

                  {FIVE.map((disease) => (
                    <th key={disease.key} className="pd-center">
                      {disease.label}
                    </th>
                  ))}

                  <th>Ext. val.</th>
                  <th>Access</th>
                  <th>Paper</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>

                    <td>{row.country || "—"}</td>
                    <td>{row.sample_size || "—"}</td>

                    {FIVE.map((disease) => (
                      <td key={disease.key} className="pd-center">
                        {row.diseaseList.includes(disease.key) ? (
                          <span className="pd-tick">✓</span>
                        ) : (
                          <span className="pd-dash">–</span>
                        )}
                      </td>
                    ))}

                    <td>{row.external_validation || "—"}</td>

                    <td>
                      {row.access ? (
                        <span
                          className={`pd-badge pd-access pd-access-${slug(
                            row.access
                          )}`}
                        >
                          {row.access}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="pd-paper">
                      {row.paper_title}
                      {row.paper_year ? ` (${row.paper_year})` : ""}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9 + FIVE.length - 5} className="pd-none">
                      No entries match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
