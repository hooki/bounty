import React, { useState, useMemo } from 'react';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  size?: number;
}

interface FileTreeProps {
  files: GitHubTreeItem[];
  selectedFiles: string[];
  onFileToggle: (filePath: string) => void;
  onDirectoryToggle: (directoryPath: string, allFiles: string[]) => void;
}

export default function FileTree({ files, selectedFiles, onFileToggle, onDirectoryToggle }: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  // 파일 목록을 트리 구조로 변환
  const treeData = useMemo(() => {
    const root: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    // 모든 파일과 디렉토리를 순회
    files.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const node: TreeNode = {
            name: part,
            path: currentPath,
            type: isLast && file.type === 'blob' ? 'file' : 'directory',
            children: isLast && file.type === 'blob' ? undefined : [],
            size: isLast && file.type === 'blob' ? file.size : undefined,
          };

          nodeMap.set(currentPath, node);

          if (parentPath) {
            const parentNode = nodeMap.get(parentPath);
            if (parentNode && parentNode.children) {
              parentNode.children.push(node);
            }
          } else {
            root.push(node);
          }
        }
      });
    });

    // 트리 정렬 (디렉토리 먼저, 그 다음 파일)
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }));
    };

    return sortNodes(root);
  }, [files]);

  // 디렉토리의 모든 파일 경로를 재귀적으로 수집
  const getAllFilesInDirectory = (node: TreeNode): string[] => {
    const files: string[] = [];

    if (node.type === 'file') {
      files.push(node.path);
    } else if (node.children) {
      node.children.forEach(child => {
        files.push(...getAllFilesInDirectory(child));
      });
    }

    return files;
  };

  // 디렉토리 확장/축소 토글
  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  // 파일 또는 디렉토리 선택 처리
  const handleNodeToggle = (node: TreeNode) => {
    if (node.type === 'file') {
      onFileToggle(node.path);
    } else {
      // 디렉토리의 모든 파일 수집
      const allFiles = getAllFilesInDirectory(node);
      onDirectoryToggle(node.path, allFiles);
    }
  };

  // 노드가 선택되었는지 확인
  const isNodeSelected = (node: TreeNode): boolean => {
    if (node.type === 'file') {
      return selectedFiles.includes(node.path);
    } else {
      // 디렉토리의 경우, 모든 하위 파일이 선택되었는지 확인
      const allFiles = getAllFilesInDirectory(node);
      return allFiles.length > 0 && allFiles.every(file => selectedFiles.includes(file));
    }
  };

  // 노드가 부분적으로 선택되었는지 확인 (디렉토리의 일부 파일만 선택됨)
  const isNodePartiallySelected = (node: TreeNode): boolean => {
    if (node.type === 'file') {
      return false;
    }

    const allFiles = getAllFilesInDirectory(node);
    const selectedCount = allFiles.filter(file => selectedFiles.includes(file)).length;
    return selectedCount > 0 && selectedCount < allFiles.length;
  };

  // 트리 노드 렌더링
  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = isNodeSelected(node);
    const isPartiallySelected = isNodePartiallySelected(node);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-50 transition duration-150 ${isSelected ? 'bg-blue-50' : ''
            }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* 확장/축소 아이콘 (디렉토리만) */}
          {node.type === 'directory' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleDirectory(node.path);
              }}
              className="mr-1 p-1 hover:bg-gray-200 rounded"
            >
              {hasChildren ? (
                isExpanded ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )
              ) : (
                <div className="w-3 h-3" />
              )}
            </button>
          )}

          {/* 체크박스 */}
          <input
            type="checkbox"
            checked={isSelected}
            ref={(input) => {
              if (input) {
                input.indeterminate = isPartiallySelected;
              }
            }}
            onChange={(e) => {
              e.stopPropagation();
              handleNodeToggle(node);
            }}
            className="mr-2 text-primary-600 focus:ring-primary-500"
          />

          {/* 아이콘과 이름 영역 - 디렉토리 클릭 시 확장/축소 */}
          <div
            className={`flex items-center flex-1 ${node.type === 'directory' ? 'cursor-pointer' : ''}`}
            onClick={node.type === 'directory' ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleDirectory(node.path);
            } : undefined}
          >
            {/* 아이콘 */}
            <div className="mr-2">
              {node.type === 'directory' ? (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* 파일/디렉토리 이름 */}
            <span className="text-2xl font-mono text-gray-700 flex-1">
              {node.name}
            </span>

            {/* 파일 크기 */}
            {node.type === 'file' && node.size && (
              <span className="text-sm text-gray-500 ml-2">
                {(node.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        {/* 하위 노드 렌더링 */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto bg-white">
      {treeData.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No files found
        </div>
      ) : (
        <div className="py-2">
          {treeData.map(node => renderNode(node))}
        </div>
      )}
    </div>
  );
}