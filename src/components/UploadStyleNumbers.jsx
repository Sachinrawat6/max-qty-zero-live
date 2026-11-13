import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

const UploadStyleNumbers = ({ onDataExtracted }) => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  // === Core Parsing Logic ===
  const processFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file');
      setData([]);
      return;
    }

    setIsLoading(true);
    setError('');
    setFileName(file.name);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('The CSV file is empty');
          }

          const headers = results.data[0].map((h) => String(h).trim());
          const styleNumberIndex = headers.indexOf('Style Numbers');

          if (styleNumberIndex === -1) {
            throw new Error('Column "Style Numbers" not found. Please check the CSV header.');
          }

          const extractedData = results.data
            .slice(1)
            .filter((row) => row[styleNumberIndex] && String(row[styleNumberIndex]).trim())
            .map((row) => ({
              styleNumber: String(row[styleNumberIndex]).trim(),
            }));

          if (extractedData.length === 0) {
            throw new Error('No valid style numbers found in the file');
          }

          setData(extractedData);
          setIsLoading(false);

          if (onDataExtracted) {
            onDataExtracted(extractedData);
          }
        } catch (err) {
          setError(err.message);
          setData([]);
          setIsLoading(false);
        }
      },
      error: (err) => {
        setError('Error parsing CSV: ' + err.message);
        setData([]);
        setIsLoading(false);
      },
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    processFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  // === Drag & Drop ===
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleClear = () => {
    setData([]);
    setFileName('');
    setError('');
    if (onDataExtracted) onDataExtracted([]);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* === Header === */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Style Numbers</h3>
          <p className="text-xs text-slate-500">
            Upload CSV file with a <span className="font-mono">Style Numbers</span> column
          </p>
        </div>
        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
          Step 2
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1 min-h-0">
        {/* === Dropzone (shrinks when data is loaded) === */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed transition-colors flex-shrink-0 ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-200 bg-slate-50/50 hover:border-purple-400'
          }`}
        >
          <div
            className={`flex flex-col items-center justify-center px-4 ${
              data.length > 0 ? 'py-5' : 'py-8'
            }`}
          >
            <div
              className={`rounded-full flex items-center justify-center mb-3 transition-colors ${
                data.length > 0 ? 'w-10 h-10' : 'w-14 h-14'
              } ${isDragging ? 'bg-purple-200' : 'bg-purple-100'}`}
            >
              <svg
                className={`text-purple-600 ${data.length > 0 ? 'w-5 h-5' : 'w-7 h-7'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>

            <p className="text-sm text-slate-600 mb-1">
              {isDragging ? 'Drop the file to upload' : 'Drag & drop your CSV here, or'}
            </p>

            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition shadow-sm hover:shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0l-4 4m4-4l4 4"
                  />
                </svg>
                Choose CSV File
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {data.length === 0 && (
              <p className="text-xs text-slate-400 mt-3">Only .csv files are supported</p>
            )}
          </div>
        </div>

        {/* === File Info Bar === */}
        {fileName && !error && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <svg
                className="w-4 h-4 text-slate-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm text-slate-700 truncate font-medium">{fileName}</span>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-medium text-slate-500 hover:text-red-600 transition flex-shrink-0"
            >
              Clear
            </button>
          </div>
        )}

        {/* === Loading State === */}
        {isLoading && (
          <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-blue-800 font-medium">Processing CSV file...</p>
          </div>
        )}

        {/* === Error State === */}
        {error && (
          <div className="mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex-shrink-0">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Upload failed</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* === Success Summary === */}
        {data.length > 0 && !error && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 flex-shrink-0">
            <svg
              className="w-4 h-4 text-emerald-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-emerald-800 font-medium">
              Loaded <span className="font-bold">{data.length}</span> style numbers
            </p>
          </div>
        )}

        {/* === Style Numbers Preview — FIXED HEIGHT SCROLL AREA === */}
        {data.length > 0 && (
          <div className="mt-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Preview
              </p>
              <p className="text-xs text-slate-500">{data.length} total</p>
            </div>

            {/* Fixed-height scrollable chips area */}
            <div className="h-44 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/40 p-3">
              <div className="flex flex-wrap gap-2">
                {data.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-purple-50 text-purple-800 border border-purple-100 px-2.5 py-1 rounded-md text-xs font-mono font-medium"
                  >
                    {item.styleNumber}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UploadStyleNumbers;
