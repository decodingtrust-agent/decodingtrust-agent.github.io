"use client";

export function Badge({ type, text }: { type: string; text: string }) {
  return <span className={`da-badge da-badge-${type}`}>{text}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  return <span className={`da-type-badge da-type-${type}`}>{type}</span>;
}

export function SevBadge({ severity }: { severity: string }) {
  return <span className={`da-sev-badge da-sev-${severity}`}>{severity}</span>;
}

export function ResultTag({ result, severity }: { result: string; severity: string }) {
  let effective = result;
  if (result === 'fail' && (severity === 'low' || severity === 'medium')) {
    effective = 'warning';
  }
  return <span className={`da-result-tag da-result-${effective}`}>{effective.toUpperCase()}</span>;
}
