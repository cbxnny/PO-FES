import { useState } from 'react';
import { parseSpreadsheet } from '../utils/spreadsheetParser';
import { bulkImportUsers } from '../data/usersApi';

// Coordinator-only bulk account import, shown as a modal (matches the
// styling of CommentForClientModal / the rating-criteria modal elsewhere
// in the app). Upload a .csv/.xlsx with columns firstName, lastName,
// email, role — each row gets an email invite, no password ever passes
// through this component or the backend.
const BulkImportModal = ({ onClose }) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError('');
    setImportResult(null);

    try {
      const parsedRows = await parseSpreadsheet(file);
      setRows(parsedRows);
    } catch (err) {
      setRows([]);
      setParseError(err.message);
    }
  };

  const handleImport = async () => {
    setIsSubmitting(true);
    setImportResult(null);

    try {
      const result = await bulkImportUsers(rows);
      setImportResult(result);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div className="feedback-modal-overlay">
      <section className="feedback-modal-card feedback-modal-card-wide">
        <div className="feedback-modal-header">
          <div>
            <h2>Import Accounts</h2>
            <p className="tutor-comment-modal-subtitle">
              Upload a .csv or .xlsx file with columns: firstName, lastName, email, role.
              Each new account receives an email invite to set their own password.
            </p>
          </div>

          <button
            type="button"
            className="feedback-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className="feedback-modal-body">
          <div className="qut-field">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </div>

          {fileName && <p>Selected file: {fileName}</p>}
          {parseError && <p className="auth-error">{parseError}</p>}

          {rows.length > 0 && !importResult && (
            <>
              <p>{rows.length} row(s) ready to import.</p>
              <table className="qut-table">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.firstName}</td>
                      <td>{row.lastName}</td>
                      <td>{row.email}</td>
                      <td>{row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {importResult?.error && <p className="auth-error">{importResult.error}</p>}

          {importResult && !importResult.error && (
            <div>
              <h3>Import Results</h3>
              <p>
                {importResult.succeeded} succeeded, {importResult.failed} failed
                (of {importResult.total} total).
              </p>
              <table className="qut-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.results.map((r) => (
                    <tr key={r.row}>
                      <td>{r.row}</td>
                      <td>{r.email}</td>
                      <td>{r.status}</td>
                      <td>{r.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="tutor-comment-modal-actions">
          <button
            type="button"
            className="qut-btn qut-btn-outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>

          {rows.length > 0 && !importResult && (
            <button
              type="button"
              className="qut-btn qut-btn-primary"
              onClick={handleImport}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Importing...' : `Import ${rows.length} account(s)`}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default BulkImportModal;
