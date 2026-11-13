import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

const UploadListing = ({ onDataExtracted }) => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef(null);

  const MAX_PREVIEW = 5;

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
    setShowAll(false);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('The CSV file is empty');
          }

          const headers = results.data[0].map((h) => String(h).trim());

          const channelIdIndex = headers.indexOf('Channel ID');
          const channelListingIdIndex = headers.indexOf('Channel Listing Id');
          const productSkuCodeIndex = headers.indexOf('Product SkuCode');
          const channelListingQtyIndex = headers.indexOf('Channel Listed Qty');
          const channelMaxListedQtyIndex = headers.indexOf('Channel Max Listed Qty');

          // Validate required columns
          if (channelIdIndex === -1 || channelListingIdIndex === -1 || productSkuCodeIndex === -1) {
            throw new Error(
              'Required columns missing. Expected: "Channel ID", "Channel Listing Id", "Product SkuCode".'
            );
          }

          const extractedData = results.data
            .slice(1)
            .map((row) => ({
              channelId: row[channelIdIndex] || '-',
              channelListingId: row[channelListingIdIndex] || '-',
              productSkuCode: row[productSkuCodeIndex] || '-',
              channelListedQty:
                channelListingQtyIndex !== -1 ? row[channelListingQtyIndex] || '0' : '0',
              channelMaxListedQty:
                channelMaxListedQtyIndex !== -1 ? row[channelMaxListedQtyIndex] || '0' : '0',
            }))
            .filter(
              (item) =>
                item.channelId !== '-' ||
                item.channelListingId !== '-' ||
                item.productSkuCode !== '-'
            );

          if (extractedData.length === 0) {
            throw new Error('No valid listing records found in the file');
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
    setShowAll(false);
    if (onDataExtracted) onDataExtracted([]);
  };

  const visibleData = showAll ? data : data.slice(0, MAX_PREVIEW);
  const hiddenCount = data.length - visibleData.length;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* === Header === */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Channel Listings</h3>
          <p className="text-xs text-slate-500">Upload channel listing CSV file</p>
        </div>
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          Step 1
        </span>
      </div>

      <div className="p-6">
        {/* === Dropzone === */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-slate-50/50 hover:border-blue-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                isDragging ? 'bg-blue-200' : 'bg-blue-100'
              }`}
            >
              <svg
                className="w-7 h-7 text-blue-600"
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
            </div>

            <p className="text-sm text-slate-600 mb-1">
              {isDragging ? 'Drop the file to upload' : 'Drag & drop your CSV here, or'}
            </p>

            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition shadow-sm hover:shadow-md">
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

            <p className="text-xs text-slate-400 mt-3">Only .csv files are supported</p>
          </div>
        </div>

        {/* === File Info Bar === */}
        {fileName && !error && (
          <div className="mt-4 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
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
          <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
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
          <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
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
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
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
              Loaded <span className="font-bold">{data.length}</span> listing records
            </p>
          </div>
        )}

        {/* === Data Preview === */}
        {data.length > 0 && (
          <div className="mt-5 rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Preview
              </p>
              <p className="text-xs text-slate-500">
                Showing {visibleData.length} of {data.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-slate-200">
                  <tr>
                    {['#', 'Channel ID', 'Listing ID', 'SKU Code'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleData.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-semibold">
                          {item.channelId}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{item.channelListingId}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.productSkuCode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preview toggle */}
            {(hiddenCount > 0 || showAll) && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {showAll
                    ? `Showing all ${data.length} records`
                    : `+${hiddenCount} more records hidden`}
                </p>
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {showAll ? 'Show less' : 'Show all'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* === Empty Hint (compact) === */}
        {!isLoading && data.length === 0 && !error && !fileName && (
          <p className="mt-4 text-xs text-slate-400 text-center">
            Supported columns: Channel ID, Channel Listing Id, Product SkuCode, Channel Listed Qty,
            Channel Max Listed Qty
          </p>
        )}
      </div>
    </section>
  );
};

export default UploadListing;
