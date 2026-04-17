"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReportData } from './ReportDataProvider';
import { computeDomainStats } from '@/lib/data-auditing/dataHelpers';

const EXCLUDED_DOMAINS = new Set(['dataset']);

export default function Sidebar({ basePath = '/data-auditing/0308' }: { basePath?: string }) {
  const BASE = basePath;
  const { derived } = useReportData();
  const pathname = usePathname();
  if (!derived) return null;

  const { allDomains, byDomainLLM } = derived;
  const visibleDomains = allDomains.filter((d: string) => !EXCLUDED_DOMAINS.has(d));

  return (
    <nav className="da-sidebar">
      <Link
        href={BASE}
        className={`da-sidebar-link ${pathname === BASE ? 'active' : ''}`}
      >
        <span className="da-sidebar-icon">&#9632;</span>
        Overview
      </Link>

      <div className="da-sidebar-section-label">Domains</div>

      {visibleDomains.map((d: string) => {
        const items = byDomainLLM[d] || [];
        const stats = computeDomainStats(items);
        const hasFail = stats.fail > 0;
        const href = `${BASE}/domain/${d}`;

        return (
          <Link
            key={d}
            href={href}
            className={`da-sidebar-link ${pathname === href ? 'active' : ''}`}
          >
            <span className={`da-sidebar-dot ${hasFail ? 'da-dot-fail' : 'da-dot-pass'}`} />
            <span className="da-sidebar-domain-name">{d}</span>
            <span className="da-sidebar-count">{items.length}</span>
          </Link>
        );
      })}
    </nav>
  );
}
