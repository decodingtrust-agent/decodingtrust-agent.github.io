export function getEffectiveResult(result: string, severity: string): string {
  if (result === 'fail' && (severity === 'low' || severity === 'medium')) {
    return 'warning';
  }
  return result;
}

export function getDomain(taskPath: string): string {
  return (taskPath || '').split('/')[0] || 'unknown';
}

export function groupByDomain(llmResults: any[]): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const r of llmResults) {
    const d = getDomain(r.task_path);
    (map[d] = map[d] || []).push(r);
  }
  return map;
}

export function groupRulesByDomain(ruleResults: any): Record<string, any[]> {
  if (!ruleResults) return {};
  const map: Record<string, any[]> = {};
  for (const issue of ruleResults.issues || []) {
    const d = getDomain(issue.path);
    (map[d] = map[d] || []).push(issue);
  }
  return map;
}

export function computeDomainStats(results: any[]) {
  let pass = 0, fail = 0, warning = 0, error = 0;
  for (const r of results) {
    for (const c of Object.values(r.checks || {}) as any[]) {
      const eff = getEffectiveResult(c.result, c.severity);
      if (eff === 'pass') pass++;
      else if (eff === 'warning') warning++;
      else if (eff === 'fail') fail++;
      else error++;
    }
  }
  return { pass, fail, warning, error, instances: results.length };
}

export function filterInstance(result: any, filters: any): boolean {
  const search = (filters.search || '').toLowerCase();

  if (search) {
    const pathMatch = result.task_path.toLowerCase().includes(search);
    const contentMatch = Object.values(result.checks || {}).some((c: any) =>
      (c.summary || '').toLowerCase().includes(search) ||
      (c.issues || []).some((i: any) =>
        (i.description || '').toLowerCase().includes(search) ||
        (i.id || '').toLowerCase().includes(search)
      )
    );
    if (!pathMatch && !contentMatch) return false;
  }

  if (filters.taskType && filters.taskType !== 'all') {
    if (result.task_type !== filters.taskType) return false;
  }

  if (filters.result === 'all' && filters.severity === 'all' && filters.check === 'all') {
    return true;
  }

  return Object.entries(result.checks || {}).some(([name, c]: [string, any]) => {
    const eff = getEffectiveResult(c.result, c.severity);
    if (filters.result !== 'all' && eff !== filters.result) return false;
    if (filters.severity !== 'all' && c.severity !== filters.severity) return false;
    if (filters.check !== 'all' && name !== filters.check) return false;
    return true;
  });
}

export function filterRuleIssue(issue: any, filters: any): boolean {
  const search = (filters.search || '').toLowerCase();
  if (search) {
    if (!issue.path.toLowerCase().includes(search) &&
        !issue.message.toLowerCase().includes(search) &&
        !(issue.id || '').toLowerCase().includes(search)) return false;
  }
  if (filters.result !== 'all' && filters.result !== 'fail') return false;
  if (filters.check !== 'all' && filters.check !== 'rule') return false;
  return true;
}
