/**
 * CSV Import Component
 * Handles bulk import of talents and credits using PapaParse
 */

import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface CSVImportProps {
  mode: 'talents' | 'credits';
  onImportComplete?: (count: number) => void;
  endpoint: string;
}

interface ParsedRow {
  [key: string]: string;
}

const CSVImport: React.FC<CSVImportProps> = ({
  mode,
  onImportComplete,
  endpoint,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const talentColumns = ['name', 'gender', 'height', 'bio'];
  const creditColumns = ['title', 'company', 'date', 'description'];
  const requiredColumns = mode === 'talents' ? talentColumns : creditColumns;

  /**
   * Parse CSV file
   */
  const parseCSV = async (file: File) => {
    return new Promise<ParsedRow[]>((resolve, reject) => {
      // Dynamically import PapaParse
      // @ts-ignore
      import('papaparse').then(({ default: Papa }: any) => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (results: any) => {
            if (results.errors.length > 0) {
              reject(new Error('CSV parsing error'));
              return;
            }
            resolve(results.data);
          },
          error: (error: any) => {
            reject(error);
          },
        });
      });
    });
  };

  /**
   * Handle file selection
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setSuccess(null);

      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }

      setFile(selectedFile);
      setLoading(true);

      const data = await parseCSV(selectedFile);

      // Validate columns
      if (data.length === 0) {
        setError('CSV file is empty');
        return;
      }

      const headers = Object.keys(data[0] || {});
      const missingColumns = requiredColumns.filter(
        (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase())
      );

      if (missingColumns.length > 0) {
        setError(
          `Missing required columns: ${missingColumns.join(', ')}. ` +
            `Expected: ${requiredColumns.join(', ')}`
        );
        return;
      }

      // Validate data
      const invalidRows = data.filter((row) =>
        requiredColumns.some((col) => !row[col]?.trim())
      );

      if (invalidRows.length > 0) {
        setError(
          `Found ${invalidRows.length} rows with missing required data`
        );
        return;
      }

      if (data.length > 100) {
        setError('Cannot import more than 100 rows at once. Split your CSV.');
        return;
      }

      setParsedData(data);
      setSuccess(
        `Ready to import ${data.length} ${mode === 'talents' ? 'talent' : 'credit'}${
          data.length !== 1 ? 's' : ''
        }`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload parsed data to backend
   */
  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);

      const payload =
        mode === 'talents'
          ? { talents: parsedData }
          : { credits: parsedData };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || '',
          'x-user-role': localStorage.getItem('userRole') || '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      setSuccess(
        `Successfully imported ${result.importedCount} ${
          mode === 'talents' ? 'talent' : 'credit'
        }${result.importedCount !== 1 ? 's' : ''}`
      );
      setParsedData([]);
      setFile(null);

      if (onImportComplete) {
        onImportComplete(result.importedCount);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Download template CSV
   */
  const downloadTemplate = () => {
    const headers = requiredColumns.join(',');
    const sampleRows =
      mode === 'talents'
        ? [
            'John Doe,Male,180,Professional actor and voice artist',
            'Jane Smith,Female,165,Model with international experience',
          ]
        : [
            'Commercial Shoot,Nike,2023-01,30 second TV commercial',
            'Brand Ambassador,Coca Cola,2023-02,Social media campaign',
          ];

    const csv = [headers, ...sampleRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mode}-template.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">
          Required columns: {requiredColumns.join(', ')}
        </p>
        <button
          onClick={downloadTemplate}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Download CSV Template →
        </button>
      </div>

      {/* File Upload */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-3"
        >
          <Upload className="text-gray-400" size={32} />
          <div className="text-center">
            <p className="text-gray-900 font-medium">
              {file ? `Selected: ${file.name}` : 'Click to select CSV file'}
            </p>
            <p className="text-gray-500 text-sm">
              {loading ? 'Parsing...' : 'Or drag and drop'}
            </p>
          </div>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Preview ({parsedData.length} rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    {requiredColumns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left font-medium text-gray-900 text-xs uppercase"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      {requiredColumns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-2 text-gray-700 truncate"
                        >
                          {(row[col] as string) || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 5 && (
              <p className="text-gray-600 text-xs mt-2">
                ... and {parsedData.length - 5} more rows
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || parsedData.length === 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={20} />
                Import {parsedData.length} Row
                {parsedData.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
