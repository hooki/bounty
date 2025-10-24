import React, { useState, useEffect, useRef } from 'react';
import { useOrganizations } from '../hooks/useOrganizations';

interface OrganizationSelectorProps {
  selectedOrgs: string[];
  onOrgsChange: (orgs: string[]) => void;
  className?: string;
}

export default function OrganizationSelector({
  selectedOrgs,
  onOrgsChange,
  className = ""
}: OrganizationSelectorProps) {
  const { availableOrganizations, loading } = useOrganizations();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOrgs, setFilteredOrgs] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 검색어에 매칭되는 조직 필터링
  useEffect(() => {
    const filtered = availableOrganizations.filter(org =>
      org.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedOrgs.includes(org)
    );
    setFilteredOrgs(filtered);
  }, [searchTerm, availableOrganizations, selectedOrgs]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addOrganization = (org: string) => {
    if (!selectedOrgs.includes(org)) {
      onOrgsChange([...selectedOrgs, org]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeOrganization = (org: string) => {
    onOrgsChange(selectedOrgs.filter(o => o !== org));
  };

  const clearAll = () => {
    onOrgsChange([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Organizations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-medium text-pixel-text">
            Selected Organizations ({selectedOrgs.length})
          </span>
          {selectedOrgs.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-pixel-text-muted hover:text-pixel-danger transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedOrgs.length === 0 ? (
          <div className="p-4 bg-pixel-bg border-2 border-pixel-border text-center">
            <span className="text-2xl text-pixel-text-muted">
              No organizations selected. Will use owner's organization by default.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedOrgs.map(org => (
              <span
                key={org}
                className="inline-flex items-center gap-2 px-3 py-1.5
                           bg-pixel-bg border-2 border-pixel-border hover:border-pixel-accent
                           transition-colors"
              >
                <span className="text-2xl font-medium text-pixel-text">{org}</span>
                <button
                  onClick={() => removeOrganization(org)}
                  className="text-pixel-text-muted hover:text-pixel-danger transition-colors"
                  title="Remove organization"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search organizations..."
            className="w-full pixel-input text-2xl pl-10"
            disabled={loading}
          />
          <div className="absolute left-3 top-3 text-pixel-text-muted">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pixel-accent"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchTerm && filteredOrgs.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-pixel-bg border-2 border-pixel-border
                          max-h-48 overflow-y-auto">
            {filteredOrgs.map(org => (
              <button
                key={org}
                onClick={() => addOrganization(org)}
                className="w-full px-4 py-3 text-left hover:bg-pixel-bg-light
                           transition-colors flex items-center justify-between group"
              >
                <span className="text-pixel-text">{org}</span>
                <span className="text-pixel-text-muted group-hover:text-pixel-accent text-2xl">
                  Click to add
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showDropdown && searchTerm && filteredOrgs.length === 0 && !loading && (
          <div className="absolute z-20 w-full mt-2 bg-pixel-bg border-2 border-pixel-border px-4 py-3">
            <span className="text-pixel-text-muted text-2xl">No organizations found matching "{searchTerm}"</span>
          </div>
        )}
      </div>
    </div>
  );
}