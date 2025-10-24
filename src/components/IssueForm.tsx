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
    { value: 'low', label: 'Low', color: 'bg-pixel-success text-white border-pixel-success' },
    { value: 'medium', label: 'Medium', color: 'bg-pixel-warning text-pixel-bg border-pixel-warning' },
    { value: 'high', label: 'High', color: 'bg-orange-600 text-white border-orange-600' },
    { value: 'critical', label: 'Critical', color: 'bg-pixel-danger text-white border-pixel-danger' },
  ];

  return (
    <div className="pixel-card p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-pixel text-pixel-text mb-2">Issue Report</h2>
        <p className="text-pixel-text-muted">Document your findings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block font-medium text-pixel-text mb-3">
            Issue Title
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="pixel-input w-full"
            placeholder="Enter a descriptive title"
          />
        </div>

        <div>
          <label className="block font-medium text-pixel-text mb-4">
            Severity Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {severityOptions.map((option) => (
              <label
                key={option.value}
                className={`relative flex items-center justify-center p-4 border-2 cursor-pointer transition-colors ${formData.severity === option.value
                  ? 'border-pixel-accent bg-pixel-bg-light'
                  : 'border-pixel-border hover:border-pixel-text-muted bg-pixel-bg'
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
                  <span className={`inline-block px-3 py-1 font-bold border ${option.color}`}>
                    {option.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block font-medium text-pixel-text">
              Description
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 font-medium transition-colors ${!showPreview
                  ? 'pixel-btn-primary'
                  : 'pixel-btn-secondary'
                  }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 font-medium transition-colors ${showPreview
                  ? 'pixel-btn-primary'
                  : 'pixel-btn-secondary'
                  }`}
              >
                Preview
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="min-h-[300px] p-4 border-2 border-pixel-border bg-pixel-bg">
              {formData.description ? (
                <EnhancedMarkdown>
                  {formData.description}
                </EnhancedMarkdown>
              ) : (
                <div className="text-center py-16">
                  <p className="text-pixel-text-muted italic">Preview will appear here...</p>
                </div>
              )}
            </div>
          ) : (
            <textarea
              rows={12}
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full pixel-input font-sans antialiased"
              placeholder="Document your findings in markdown format:

## Overview
Describe the issue...

## Reproduction Steps
1. Step one
2. Step two
3. Observe the result

## Impact
Explain the implications...

## Solution
Provide recommendations..."
            />
          )}

          <div className="flex items-center space-x-2 mt-3">
            <span className="text-base text-pixel-text-muted">Supports markdown syntax</span>
            <span className="text-base text-pixel-text-muted">|</span>
            <span className="text-base text-pixel-text-muted">Code blocks: ```language-name</span>
            <span className="text-base text-pixel-text-muted">|</span>
            <span className="text-base text-pixel-text-muted">GitHub links auto-embed</span>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t-4 border-pixel-border">
          <button
            type="button"
            onClick={onCancel}
            className="pixel-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="pixel-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}