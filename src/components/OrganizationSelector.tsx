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
      {/* 선택된 조직들을 칩/태그 형태로 표시 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            Selected Organizations ({selectedOrgs.length})
          </span>
          {selectedOrgs.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedOrgs.length === 0 ? (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
            <span className="text-sm text-gray-400">
              No organizations selected. Will use owner's organization by default.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedOrgs.map(org => (
              <span
                key={org}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                           bg-gradient-to-r from-gray-700 to-gray-800
                           border border-gray-600 hover:border-gray-500
                           transition-all duration-200"
              >
                <span className="text-sm font-medium text-white">🏢 {org}</span>
                <button
                  onClick={() => removeOrganization(org)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="Remove organization"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 검색 입력창 */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="🔍 Search and add organizations..."
            className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-600
                       rounded-lg text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       transition-all duration-300"
            disabled={loading}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* 검색 결과 드롭다운 */}
        {showDropdown && searchTerm && filteredOrgs.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-600
                          rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredOrgs.map(org => (
              <button
                key={org}
                onClick={() => addOrganization(org)}
                className="w-full px-4 py-3 text-left hover:bg-gray-700
                           transition-colors flex items-center justify-between group"
              >
                <span className="text-white">🏢 {org}</span>
                <span className="text-gray-400 group-hover:text-primary-400 text-sm">
                  Click to add
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {showDropdown && searchTerm && filteredOrgs.length === 0 && !loading && (
          <div className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-600
                          rounded-lg shadow-lg px-4 py-3">
            <span className="text-gray-400 text-sm">No organizations found matching "{searchTerm}"</span>
          </div>
        )}
      </div>
    </div>
  );
}