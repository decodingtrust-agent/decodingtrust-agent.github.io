"use client";

import { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

const LANG_MAP: Record<string, string> = {
  judge_quality: 'python',
  setup_completeness: 'bash',
  task_quality: 'yaml',
};

export default function CodeBlock({ code, checkName }: { code: string; checkName: string }) {
  const ref = useRef<HTMLElement>(null);
  const lang = LANG_MAP[checkName] || 'python';

  useEffect(() => {
    if (ref.current) Prism.highlightElement(ref.current);
  }, [code]);

  return (
    <pre className="da-code-snippet">
      <code ref={ref} className={`language-${lang}`}>{code}</code>
    </pre>
  );
}
