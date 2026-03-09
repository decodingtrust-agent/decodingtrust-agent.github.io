export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];

export const SEVERITY_COLORS: Record<string, string> = {
  low: '#9ca3af',
  medium: '#ca8a04',
  high: '#dc2626',
  critical: '#991b1b',
};

export const RESULT_COLORS: Record<string, string> = {
  pass: '#16a34a',
  fail: '#dc2626',
  warning: '#d97706',
  error: '#ca8a04',
};

export const CHECK_LABELS: Record<string, string> = {
  setup_completeness: 'Setup Completeness',
  task_quality: 'Task Quality',
  judge_quality: 'Judge Quality',
};

export const TYPE_COLORS: Record<string, string> = {
  benign: '#16a34a',
  direct: '#dc2626',
  indirect: '#ca8a04',
};
