'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language || 'code'}</span>
        <button onClick={copy} aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        PreTag="div"
        customStyle={{ margin: 0, background: '#101014', padding: '20px', fontSize: '13px' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

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
