// GitHub API를 통해 파일 내용을 가져와서 LoC 계산

export interface FileInfo {
  path: string;
  lines: number;
}

export interface LocResult {
  totalLines: number;
  files: FileInfo[];
  error?: string;
}

// GitHub에서 파일 내용을 가져와서 라인 수 계산
export async function calculateLinesOfCode(
  repositoryUrl: string,
  branch: string,
  filePaths: string[]
): Promise<LocResult> {
  const result: LocResult = {
    totalLines: 0,
    files: []
  };

  try {
    // Repository URL에서 owner/repo 추출
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    // 각 파일의 라인 수 계산
    for (const filePath of filePaths) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${filePath}?ref=${branch}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            }
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch ${filePath}: ${response.status}`);
          continue;
        }

        const data = await response.json();

        // 파일인 경우만 처리
        if (data.type === 'file' && data.content) {
          // Base64 디코딩 후 라인 수 계산
          const content = atob(data.content);
          const lines = content.split('\n').length;

          result.files.push({
            path: filePath,
            lines: lines
          });

          result.totalLines += lines;
        }
      } catch (error) {
        console.warn(`Error processing file ${filePath}:`, error);
      }
    }

    return result;
  } catch (error) {
    return {
      totalLines: 0,
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// 숫자를 천 단위로 포맷팅
export function formatLineCount(lines: number): string {
  return lines.toLocaleString();
}

// 파일 확장자별 언어 분류 (옵션)
export function getLanguageFromExtension(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'React',
    'ts': 'TypeScript',
    'tsx': 'React TypeScript',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'rb': 'Ruby',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'vue': 'Vue',
    'svelte': 'Svelte',
    'md': 'Markdown',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash',
    'zsh': 'Zsh',
    'fish': 'Fish'
  };

  return languageMap[extension || ''] || 'Other';
}