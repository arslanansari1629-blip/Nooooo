'use client';

import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CodeBlock = dynamic(() => import('./CodeBlock'), {
  ssr: false,
  loading: () => <div className="code-block code-loading">Loading code…</div>,
});

export default function Markdown({ content }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isBlock = match || String(children).includes('\n');
            return isBlock ? (
              <CodeBlock language={match?.[1]}>{children}</CodeBlock>
            ) : (
              <code className="inline-code" {...props}>{children}</code>
            );
          },
          a({ children, ...props }) {
            return <a {...props} target="_blank" rel="noreferrer">{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
