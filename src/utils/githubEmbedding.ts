export interface GitHubLinkInfo {
  owner: string
  repo: string
  branch: string
  path: string
  startLine?: number
  endLine?: number
  url: string
}

export interface GitHubCodeSnippet {
  content: string
  language: string
  startLine: number
  endLine: number
  totalLines: number
  url: string
  path: string
}

/**
 * GitHub 링크에서 정보를 추출합니다
 * 지원하는 형식:
 * - https://github.com/owner/repo/blob/branch/path/file.ext
 * - https://github.com/owner/repo/blob/branch/path/file.ext#L10-L20
 * - https://github.com/owner/repo/blob/branch/path/file.ext#L10
 */
export function parseGitHubLink(url: string): GitHubLinkInfo | null {
  try {
    const githubLinkRegex =
      /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+?)(?:#L(\d+)(?:-L(\d+))?)?$/
    const match = url.match(githubLinkRegex)

    if (!match) return null

    const [, owner, repo, branch, path, startLineStr, endLineStr] = match

    const startLine = startLineStr ? parseInt(startLineStr, 10) : undefined
    const endLine = endLineStr ? parseInt(endLineStr, 10) : startLine

    return {
      owner,
      repo,
      branch,
      path,
      startLine,
      endLine,
      url: url.split("#")[0], // 라인 정보 제거
    }
  } catch (error) {
    console.error("Error parsing GitHub link:", error)
    return null
  }
}

/**
 * GitHub API를 사용해서 파일 내용을 가져옵니다
 */
export async function fetchGitHubFileContent(
  linkInfo: GitHubLinkInfo
): Promise<GitHubCodeSnippet | null> {
  try {
    const { owner, repo, branch, path, startLine, endLine, url } = linkInfo

    // GitHub API로 파일 내용 가져오기
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`


    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "BugBounty-Platform",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(
        `GitHub API error: ${response.status} ${response.statusText}`,
        errorData
      );

      if (response.status === 403 && errorData?.message?.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }

      if (response.status === 404) {
        throw new Error('File not found on GitHub. Please check the URL.');
      }

      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()

    if (data.type !== "file" || !data.content) {
      console.error("Invalid file data from GitHub API")
      return null
    }

    // Base64 디코딩
    const content = atob(data.content.replace(/\n/g, ""))
    const lines = content.split("\n")

    // 라인 범위 처리
    const actualStartLine = startLine || 1
    const actualEndLine = endLine || lines.length

    // 요청된 라인 범위 추출
    const selectedLines = lines.slice(actualStartLine - 1, actualEndLine)
    const selectedContent = selectedLines.join("\n")

    // 파일 확장자로 언어 감지
    const language = detectLanguage(path)

    return {
      content: selectedContent,
      language,
      startLine: actualStartLine,
      endLine: actualEndLine,
      totalLines: lines.length,
      url,
      path,
    }
  } catch (error) {
    console.error("Error fetching GitHub file content:", error)
    return null
  }
}

/**
 * 파일 확장자로 프로그래밍 언어를 감지합니다
 */
function detectLanguage(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    swift: "swift",
    kt: "kotlin",
    dart: "dart",
    scala: "scala",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    ini: "ini",
    cfg: "ini",
    conf: "ini",
    md: "markdown",
    markdown: "markdown",
    sql: "sql",
    graphql: "graphql",
    dockerfile: "dockerfile",
    makefile: "makefile",
    r: "r",
    matlab: "matlab",
    m: "matlab",
    tex: "latex",
    latex: "latex",
    vim: "vim",
    lua: "lua",
    perl: "perl",
    pl: "perl",
    asm: "assembly",
    s: "assembly",
    sol: "solidity",
    solidity: "solidity",
  }

  return languageMap[extension || ""] || "text"
}

/**
 * 텍스트에서 GitHub 링크를 감지하고 정보를 추출합니다
 */
export function detectGitHubLinks(text: string): GitHubLinkInfo[] {
  const githubLinkRegex =
    /https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/[^\/]+\/[^\s)]+(?:#L\d+(?:-L\d+)?)?/g
  const matches = text.match(githubLinkRegex) || []

  return matches
    .map((url) => parseGitHubLink(url))
    .filter((info): info is GitHubLinkInfo => info !== null)
}

/**
 * GitHub 링크가 포함된 마크다운 텍스트를 코드 임베딩이 포함된 텍스트로 변환합니다
 */
export async function embedGitHubCodeInMarkdown(
  markdown: string
): Promise<string> {
  const gitHubLinks = detectGitHubLinks(markdown)

  if (gitHubLinks.length === 0) {
    return markdown
  }

  let result = markdown

  for (const linkInfo of gitHubLinks) {
    try {
      const snippet = await fetchGitHubFileContent(linkInfo)

      if (snippet) {
        const codeBlock = generateCodeBlock(snippet)

        // 원본 링크를 코드 블록으로 교체
        const originalLink = linkInfo.url +
          (linkInfo.startLine
            ? `#L${linkInfo.startLine}` +
              (linkInfo.endLine && linkInfo.endLine !== linkInfo.startLine
                ? `-L${linkInfo.endLine}`
                : "")
            : "");

        const linkPattern = new RegExp(escapeRegExp(originalLink), "g")
        result = result.replace(linkPattern, codeBlock)
      }
    } catch (error) {
      console.error("Error embedding GitHub code:", error)
      // 오류 발생 시 원본 링크 유지
    }
  }

  return result
}

/**
 * 코드 스니펫을 마크다운 코드 블록으로 변환합니다
 */
function generateCodeBlock(snippet: GitHubCodeSnippet): string {
  const { content, language, startLine, endLine, path, url } = snippet

  const githubUrl = `${url}#L${startLine}${endLine !== startLine ? `-L${endLine}` : ""}`
  const fileName = path.split('/').pop() || path
  const lineInfo = `Lines ${startLine}-${endLine}`

  // HTML 구조로 변경하여 오버레이 가능하게 함
  return `<div class="github-code-container">
<a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="github-code-link">
<svg class="github-icon" fill="currentColor" viewBox="0 0 16 16">
<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
</svg>
<span class="file-name">${fileName}</span>
<span class="line-info">${lineInfo}</span>
</a>

\`\`\`${language}
${content}
\`\`\`
</div>

`
}

/**
 * 정규표현식에서 특수문자를 이스케이프합니다
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
