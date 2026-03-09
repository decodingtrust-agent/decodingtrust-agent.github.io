"use client";

import CodeBlock from './CodeBlock';

export default function IssueDetail({ issue, checkName }: { issue: any; checkName: string }) {
  return (
    <div className="da-issue-detail" id={issue.id || undefined}>
      <div className="da-issue-top">
        {issue.id && <span className="da-issue-id">{issue.id}</span>}
        <p className="da-issue-desc">{issue.description || 'No description'}</p>
      </div>
      {issue.reference_code_snippet && (
        <CodeBlock code={issue.reference_code_snippet} checkName={checkName} />
      )}
    </div>
  );
}
