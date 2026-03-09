"use client";

export default function FilterBar({ filters, onChange, totalVisible, totalAll }: {
  filters: any;
  onChange: (f: any) => void;
  totalVisible: number;
  totalAll: number;
}) {
  const set = (key: string, val: string) => onChange({ ...filters, [key]: val });

  return (
    <div className="da-filter-bar">
      <label>Result:</label>
      <select value={filters.result} onChange={e => set('result', e.target.value)}>
        <option value="all">All</option>
        <option value="fail">Fail</option>
        <option value="warning">Warning</option>
        <option value="pass">Pass</option>
        <option value="error">Error</option>
      </select>

      <label>Severity:</label>
      <select value={filters.severity} onChange={e => set('severity', e.target.value)}>
        <option value="all">All</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <label>Check:</label>
      <select value={filters.check} onChange={e => set('check', e.target.value)}>
        <option value="all">All</option>
        <option value="setup_completeness">Setup</option>
        <option value="task_quality">Task Quality</option>
        <option value="judge_quality">Judge Quality</option>
        <option value="rule">Rule Checker</option>
      </select>

      <label>Type:</label>
      <select value={filters.taskType} onChange={e => set('taskType', e.target.value)}>
        <option value="all">All</option>
        <option value="benign">Benign</option>
        <option value="direct">Direct</option>
        <option value="indirect">Indirect</option>
      </select>

      <input
        type="text"
        className="da-search-input"
        placeholder="Search paths, IDs, descriptions..."
        value={filters.search}
        onChange={e => set('search', e.target.value)}
      />

      <span className="da-filter-count">{totalVisible} / {totalAll}</span>
    </div>
  );
}
