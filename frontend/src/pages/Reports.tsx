import { useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp } from 'lucide-react';

interface ReportParams {
  type: string;
  startDate: string;
  endDate: string;
  format: string;
}

export function Reports() {
  const [reportParams, setReportParams] = useState<ReportParams>({
    type: 'summary',
    startDate: '2026-04-01',
    endDate: '2026-05-06',
    format: 'pdf',
  });

  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'summary', label: 'Overall Summary Report', description: 'Comprehensive overview of all activities' },
    { value: 'food-listings', label: 'Food Listings Report', description: 'Detailed food sharing records' },
    { value: 'user-activity', label: 'User Activity Report', description: 'User participation and engagement metrics' },
    { value: 'location-activity', label: 'Location Activity Report', description: 'Distribution location statistics' },
    { value: 'waste-reduction', label: 'Food Waste Reduction Report', description: 'Environmental impact analysis' },
  ];

  const recentReports = [
    { id: 1, name: 'April 2026 Summary Report', type: 'summary', date: '2026-05-01', size: '2.4 MB', format: 'PDF' },
    { id: 2, name: 'Q1 2026 User Activity', type: 'user-activity', date: '2026-04-01', size: '1.8 MB', format: 'PDF' },
    { id: 3, name: 'March Food Listings', type: 'food-listings', date: '2026-04-01', size: '3.2 MB', format: 'CSV' },
    { id: 4, name: 'Location Analysis Q1', type: 'location-activity', date: '2026-03-31', size: '1.5 MB', format: 'PDF' },
  ];

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      alert(`Report generated successfully!\nType: ${reportParams.type}\nPeriod: ${reportParams.startDate} to ${reportParams.endDate}\nFormat: ${reportParams.format.toUpperCase()}`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#212121]">Generate Reports</h1>
        <p className="text-[#9E9E9E] mt-1">Create custom reports based on your data analytics needs</p>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <FileText size={24} className="text-[#2E7D32]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#212121]">Report Configuration</h2>
            <p className="text-sm text-[#9E9E9E]">Configure your report parameters below</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Type */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#212121] mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    reportParams.type === type.value
                      ? 'border-[#2E7D32] bg-[#E8F5E9]'
                      : 'border-gray-200 hover:border-[#2E7D32]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportParams.type === type.value}
                    onChange={(e) => setReportParams({ ...reportParams, type: e.target.value })}
                    className="mt-1 accent-[#2E7D32]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#212121]">{type.label}</p>
                    <p className="text-xs text-[#9E9E9E] mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[#212121] mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
              <input
                type="date"
                value={reportParams.startDate}
                onChange={(e) => setReportParams({ ...reportParams, startDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#212121] mb-2">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
              <input
                type="date"
                value={reportParams.endDate}
                onChange={(e) => setReportParams({ ...reportParams, endDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              />
            </div>
          </div>

          {/* Export Format */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#212121] mb-2">
              Export Format
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg cursor-pointer transition-all flex-1 justify-center">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={reportParams.format === 'pdf'}
                  onChange={(e) => setReportParams({ ...reportParams, format: e.target.value })}
                  className="accent-[#2E7D32]"
                />
                <span className={`text-sm font-medium ${
                  reportParams.format === 'pdf' ? 'text-[#2E7D32]' : 'text-[#9E9E9E]'
                }`}>
                  PDF Document
                </span>
              </label>
              <label className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg cursor-pointer transition-all flex-1 justify-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={reportParams.format === 'csv'}
                  onChange={(e) => setReportParams({ ...reportParams, format: e.target.value })}
                  className="accent-[#2E7D32]"
                />
                <span className={`text-sm font-medium ${
                  reportParams.format === 'csv' ? 'text-[#2E7D32]' : 'text-[#9E9E9E]'
                }`}>
                  CSV Spreadsheet
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full md:w-auto px-8 py-3 bg-[#2E7D32] text-white rounded-lg hover:bg-[#1B5E20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download size={20} />
                Generate & Download Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#212121]">Recent Reports</h2>
          <p className="text-sm text-[#9E9E9E] mt-1">Previously generated reports available for download</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentReports.map((report) => (
            <div key={report.id} className="px-6 py-4 hover:bg-[#F9FBF9] transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                    <FileText size={20} className="text-[#2E7D32]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#212121]">{report.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#9E9E9E]">{report.date}</span>
                      <span className="text-xs text-[#9E9E9E]">•</span>
                      <span className="text-xs text-[#9E9E9E]">{report.size}</span>
                      <span className="text-xs text-[#9E9E9E]">•</span>
                      <span className="text-xs px-2 py-1 rounded bg-[#F1F8E9] text-[#2E7D32]">{report.format}</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm text-[#2E7D32] hover:bg-[#E8F5E9] rounded-lg transition-colors flex items-center gap-2">
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Preview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-xl p-6 border border-[#2E7D32]/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#2E7D32]" />
            <h3 className="text-sm font-medium text-[#1B5E20]">Data Coverage</h3>
          </div>
          <p className="text-2xl font-semibold text-[#1B5E20]">324 Records</p>
          <p className="text-xs text-[#558B2F] mt-1">For selected period</p>
        </div>

        <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-xl p-6 border border-[#2E7D32]/20">
          <div className="flex items-center gap-3 mb-2">
            <Filter size={20} className="text-[#2E7D32]" />
            <h3 className="text-sm font-medium text-[#1B5E20]">Active Filters</h3>
          </div>
          <p className="text-2xl font-semibold text-[#1B5E20]">36 Days</p>
          <p className="text-xs text-[#558B2F] mt-1">Date range selected</p>
        </div>

        <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-xl p-6 border border-[#2E7D32]/20">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={20} className="text-[#2E7D32]" />
            <h3 className="text-sm font-medium text-[#1B5E20]">Report Size</h3>
          </div>
          <p className="text-2xl font-semibold text-[#1B5E20]">~2.1 MB</p>
          <p className="text-xs text-[#558B2F] mt-1">Estimated file size</p>
        </div>
      </div>
    </div>
  );
}
