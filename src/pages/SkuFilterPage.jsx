import React, { useState, useMemo } from 'react';
import UploadListing from '../components/UploadListing';
import UploadStyleNumbers from '../components/UploadStyleNumbers';

const SkuFilterPage = () => {
  const [listingData, setListingData] = useState([]);
  const [styleNumbers, setStyleNumbers] = useState([]);

  const handleListingDataExtracted = (data) => setListingData(data);
  const handleStyleNumbersExtracted = (data) => setStyleNumbers(data);

  const extractStyleNumber = (sku) => {
    if (!sku) return null;
    const match = String(sku).match(/^\d{5}/);
    return match ? match[0] : null;
  };

  const filteredData = useMemo(() => {
    if (styleNumbers.length === 0 || listingData.length === 0) {
      return { maxQtyZero: [], maxQtyLive: [] };
    }

    const styleNumberSet = new Set(styleNumbers.map((item) => item.styleNumber));

    const filtered = listingData.filter((item) => {
      const styleNum = extractStyleNumber(item.productSkuCode);
      return styleNum && styleNumberSet.has(styleNum);
    });

    const maxQtyZero = filtered.filter((item) => parseInt(item.channelMaxListedQty, 10) === 0);
    const maxQtyLive = filtered.filter((item) => parseInt(item.channelMaxListedQty, 10) === -1);

    return { maxQtyZero, maxQtyLive };
  }, [listingData, styleNumbers]);

  // === TOGGLE HANDLERS ===
  const applyMaxQty = (value) => {
    if (styleNumbers.length === 0 || listingData.length === 0) {
      alert('Please upload both channel listings and style numbers first.');
      return;
    }
    const styleNumberSet = new Set(styleNumbers.map((item) => item.styleNumber));
    setListingData((prev) =>
      prev.map((item) => {
        const styleNum = extractStyleNumber(item.productSkuCode);
        return styleNum && styleNumberSet.has(styleNum)
          ? { ...item, channelMaxListedQty: value }
          : item;
      })
    );
  };

  const handleSetZeroMaxQty = () => applyMaxQty(0);
  const handleSetLiveMaxQty = () => applyMaxQty(-1);

  // === DOWNLOAD ===
  const downloadCSV = (data, filename) => {
    console.log(data);
    if (data.length === 0) {
      alert('No data to download');
      return;
    }
    const headers = ['Channel ID', 'Channel Listing ID', 'Max Listed Qty'];
    const rows = data.map((item) => [
      item.channelId,
      item.channelListingId,
      item.channelMaxListedQty,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMaxQtyZero = () =>
    downloadCSV(filteredData.maxQtyZero, 'BulkUpdateMaxListedQtyForChannelListing.csv');
  const handleDownloadMaxQtyLive = () =>
    downloadCSV(filteredData.maxQtyLive, 'BulkUpdateMaxListedQtyForChannelListing.csv');

  const totalMatched = filteredData.maxQtyZero.length + filteredData.maxQtyLive.length;
  const bothUploaded = listingData.length > 0 && styleNumbers.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* === Top App Bar === */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold text-slate-900">SKU Filter Manager</h1>
              <p className="text-[11px] text-slate-500">
                Channel listing &amp; style number reconciliation
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {listingData.length} listings
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              {styleNumbers.length} styles
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {totalMatched} matched
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-5">
        {/* === Upload Grid === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <UploadListing onDataExtracted={handleListingDataExtracted} />
          <UploadStyleNumbers onDataExtracted={handleStyleNumbersExtracted} />
        </div>

        {/* === Workspace: Preview (left) + Actions/Downloads (right) === */}
        {bothUploaded && totalMatched > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT (2 cols): Preview tables */}
            <div className="lg:col-span-2 space-y-4">
              {filteredData.maxQtyZero.length > 0 && (
                <PreviewTable
                  title="Max Qty Zero"
                  count={filteredData.maxQtyZero.length}
                  data={filteredData.maxQtyZero}
                  accent="orange"
                />
              )}
              {filteredData.maxQtyLive.length > 0 && (
                <PreviewTable
                  title="Max Qty Live"
                  count={filteredData.maxQtyLive.length}
                  data={filteredData.maxQtyLive}
                  accent="emerald"
                />
              )}
            </div>

            {/* RIGHT (1 col): Actions + Downloads combined */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:sticky lg:top-16">
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Actions &amp; Downloads</h3>
                  <span className="text-[11px] text-slate-400">{totalMatched} matched</span>
                </div>

                <div className="p-3 space-y-3">
                  {/* === TOGGLE BUTTONS === */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Apply Max Qty Rule
                    </p>
                    <div className="space-y-2">
                      {/* Zero */}
                      <button
                        onClick={handleSetZeroMaxQty}
                        className="group w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2 text-left min-w-0">
                          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs leading-tight">Zero Max Qty</p>
                            <p className="text-[10px] text-orange-100 leading-tight">
                              Set matched SKUs to <span className="font-mono">0</span>
                            </p>
                          </div>
                        </div>
                        <svg
                          className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>

                      {/* Live */}
                      <button
                        onClick={handleSetLiveMaxQty}
                        className="group w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm hover:shadow transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2 text-left min-w-0">
                          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs leading-tight">Live Max Qty</p>
                            <p className="text-[10px] text-emerald-100 leading-tight">
                              Set matched SKUs to <span className="font-mono">-1</span>
                            </p>
                          </div>
                        </div>
                        <svg
                          className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100"></div>

                  {/* === DOWNLOAD BUTTONS === */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Download CSV
                    </p>
                    <div className="space-y-2">
                      {/* Zero download */}
                      <button
                        onClick={handleDownloadMaxQtyZero}
                        disabled={filteredData.maxQtyZero.length === 0}
                        className="group w-full flex items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 disabled:bg-slate-50 disabled:border-slate-200 disabled:cursor-not-allowed px-3 py-2.5 transition text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-orange-500 group-disabled:bg-slate-300 flex items-center justify-center flex-shrink-0 text-white">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 leading-tight">
                              Max Qty Zero
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {filteredData.maxQtyZero.length} records
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-orange-700 group-disabled:text-slate-400 flex-shrink-0">
                          CSV
                        </span>
                      </button>

                      {/* Live download */}
                      <button
                        onClick={handleDownloadMaxQtyLive}
                        disabled={filteredData.maxQtyLive.length === 0}
                        className="group w-full flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-50 disabled:border-slate-200 disabled:cursor-not-allowed px-3 py-2.5 transition text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-emerald-500 group-disabled:bg-slate-300 flex items-center justify-center flex-shrink-0 text-white">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 leading-tight">
                              Max Qty Live
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {filteredData.maxQtyLive.length} records
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 group-disabled:text-slate-400 flex-shrink-0">
                          CSV
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Empty State === */}
        {!bothUploaded && (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl px-6 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">No data yet</h3>
            <p className="text-xs text-slate-500">
              Upload both channel listings and style numbers to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

/* === Compact Preview Table === */
const PreviewTable = ({ title, count, data, accent }) => {
  const styles = {
    orange: {
      badge: 'bg-orange-100 text-orange-800',
      dot: 'bg-orange-500',
    },
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800',
      dot: 'bg-emerald-500',
    },
  }[accent];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
          {count} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['#', 'Channel ID', 'Listing ID', 'SKU Code', 'Qty'].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slice(0, 5).map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-xs text-slate-500">{index + 1}</td>
                <td className="px-3 py-2 text-xs font-medium text-slate-900">{item.channelId}</td>
                <td className="px-3 py-2 text-xs text-slate-700">{item.channelListingId}</td>
                <td className="px-3 py-2">
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {item.productSkuCode}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`${styles.badge} px-2 py-0.5 rounded-full text-[11px] font-semibold`}
                  >
                    {item.channelMaxListedQty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 5 && (
        <div className="bg-slate-50 px-3 py-2 text-[11px] text-slate-500 border-t border-slate-100">
          Showing 5 of {data.length}
        </div>
      )}
    </div>
  );
};

export default SkuFilterPage;
