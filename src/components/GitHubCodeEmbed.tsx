import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { embedGitHubCodeInMarkdown } from '../utils/githubEmbedding';

interface GitHubCodeEmbedProps {
  content: string;
  className?: string;
}

export default function GitHubCodeEmbed({ content, className }: GitHubCodeEmbedProps) {
  const [processedContent, setProcessedContent] = useState<string>(content);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processContent = async () => {
      // GitHub 링크가 포함되어 있는지 확인
      const hasGitHubLinks = /https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\//.test(content);

      if (!hasGitHubLinks) {
        setProcessedContent(content);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const embeddedContent = await embedGitHubCodeInMarkdown(content);
        setProcessedContent(embeddedContent);
      } catch (err) {
        console.error('Error processing GitHub links:', err);
        setError(err instanceof Error ? err.message : 'Failed to embed GitHub code');
        setProcessedContent(content); // 원본 내용으로 fallback
      } finally {
        setLoading(false);
      }
    };

    processContent();
  }, [content]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className || ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">🔗 Embedding GitHub code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border-l-4 border-yellow-500 bg-yellow-900/50 p-4 rounded ${className || ''}`}>
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-300">
              ⚠️ {error}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Showing original content without GitHub code embedding.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const inline = props.inline;
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={tomorrow as any}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-800 text-neon-green px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              a({ href, children, ...props }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-400 hover:text-cyber-300 underline"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // 테이블 스타일링 (에러 케이스용)
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-700 bg-gray-800 rounded-lg shadow-lg">
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-gray-700">{children}</thead>;
              },
              tbody({ children }) {
                return <tbody className="bg-gray-800 divide-y divide-gray-700">{children}</tbody>;
              },
              tr({ children }) {
                return <tr className="hover:bg-gray-700 transition-colors duration-200">{children}</tr>;
              },
              th({ children }) {
                return (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {children}
                  </td>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = props.inline;
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow as any}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // GitHub 링크 스타일링
          a({ href, children, ...props }) {
            const isGitHubLink = href?.includes('github.com');
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${isGitHubLink
                  ? 'text-cyber-400 hover:text-cyber-300 font-medium flex items-center space-x-1'
                  : 'text-primary-400 hover:text-primary-300'
                  } transition-colors duration-200`}
                {...props}
              >
                {isGitHubLink && <span>🔗</span>}
                <span>{children}</span>
              </a>
            );
          },
          // 코드 블록 헤더 스타일링
          p({ children }) {
            const content = String(children);
            // GitHub 코드 블록 헤더 감지
            if (content.includes('📄') && content.includes('🔗 View on GitHub')) {
              return (
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-2 rounded-t-lg border border-gray-600 flex items-center justify-between text-sm">
                  <span className="text-white font-medium">{children}</span>
                </div>
              );
            }
            return <p>{children}</p>;
          },
          // 테이블 스타일링
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-700 bg-gray-800 rounded-lg shadow-lg">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-gray-700">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-gray-700 transition-colors duration-200">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {children}
              </td>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// 기존 마크다운 렌더링과 호환되는 래퍼 컴포넌트
export function EnhancedMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <GitHubCodeEmbed
      content={children}
      className={`prose prose-sm max-w-none prose-invert ${className || ''}`}
    />
  );
}