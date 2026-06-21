'use client';
import ReactMarkdown from 'react-markdown';

const components = {
  h2: (props: React.ComponentProps<'h2'>) => <h2 className="mt-4 mb-2 text-lg font-semibold text-white" {...props} />,
  h3: (props: React.ComponentProps<'h3'>) => <h3 className="mt-3 mb-1 font-semibold text-slate-100" {...props} />,
  p: (props: React.ComponentProps<'p'>) => <p className="mb-3 leading-relaxed text-slate-300" {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-slate-300" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-slate-300" {...props} />,
  li: (props: React.ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  strong: (props: React.ComponentProps<'strong'>) => <strong className="font-semibold text-white" {...props} />,
  em: (props: React.ComponentProps<'em'>) => <em className="italic" {...props} />,
  code: (props: React.ComponentProps<'code'>) => <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-amber-300" {...props} />,
  a: (props: React.ComponentProps<'a'>) => <a className="text-indigo-300 underline" {...props} />,
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-slate-300">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
