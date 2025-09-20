import React, { useState } from 'react';
import { EnhancedMarkdown } from './GitHubCodeEmbed';

interface IssueFormData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface IssueFormProps {
  projectId: string;
  onSubmit: (data: IssueFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function IssueForm({ onSubmit, onCancel, loading = false }: IssueFormProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    severity: 'medium',
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...formData });
  };

  const severityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gradient-to-r from-green-600 to-green-700 text-white', emoji: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white', emoji: '🟡' },
    { value: 'high', label: 'High', color: 'bg-gradient-to-r from-orange-600 to-orange-700 text-white', emoji: '🟠' },
    { value: 'critical', label: 'Critical', color: 'bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse-fast', emoji: '🔴' },
  ];

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="text-5xl animate-bounce-slow">🔍</div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bug Discovery Report</h2>
          <p className="text-gray-400">Document your security findings for bounty rewards</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
            <span>🏷️</span>
            <span>Vulnerability Title</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
            placeholder="Enter a descriptive title for the security vulnerability"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-4 flex items-center space-x-2">
            <span>⚠️</span>
            <span>Threat Level Assessment</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {severityOptions.map((option) => (
              <label
                key={option.value}
                className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${formData.severity === option.value
                  ? 'border-primary-400 bg-gray-800/50 shadow-lg shadow-primary-500/25'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                  }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={option.value}
                  checked={formData.severity === option.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">{option.emoji}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${option.color}`}>
                    {option.label}
                  </span>
                </div>
                {formData.severity === option.value && (
                  <div className="absolute inset-0 rounded-xl bg-primary-500/10 border-2 border-primary-400"></div>
                )}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-white flex items-center space-x-2">
              <span>📄</span>
              <span>Detailed Analysis</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${!showPreview
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                  : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${showPreview
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                  : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
              >
                👁️ Preview
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="min-h-[300px] p-4 border-2 border-gray-600 rounded-xl bg-gray-800/50">
              {formData.description ? (
                <EnhancedMarkdown>
                  {formData.description}
                </EnhancedMarkdown>
              ) : (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-400 italic">Your analysis preview will appear here...</p>
                </div>
              )}
            </div>
          ) : (
            <textarea
              rows={12}
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 font-mono text-sm"
              placeholder="📝 Document your security findings in markdown format:

## 🎥 Vulnerability Overview
Describe the security issue you discovered...

## 🔄 Reproduction Steps
1. Navigate to the target endpoint
2. Execute the following payload: \`<script>alert('XSS')</script>\`
3. Observe the vulnerability manifestation

## ⚡ Impact Assessment
Explain the potential security implications...

## 🔧 Recommended Solution
Provide mitigation strategies and fixes..."
            />
          )}

          <div className="flex items-center space-x-2 mt-3">
            <span className="text-xs text-gray-400">📝 Supports markdown syntax</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-400">💻 Code blocks: \`\`\`language-name</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-400">🔗 GitHub links auto-embed code</span>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 transition-all duration-300"
          >
            ❌ Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-neon-green to-cyber-500 hover:from-neon-green/80 hover:to-cyber-400 border border-transparent rounded-lg text-sm font-bold text-black transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Submit Discovery</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}