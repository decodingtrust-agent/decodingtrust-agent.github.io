"use client";

export default function StatCard({ value, label, color }: { value: any; label: string; color?: string }) {
  return (
    <div className="da-stat-card">
      <div className={`da-stat-number ${color || ''}`}>{value}</div>
      <div className="da-stat-label">{label}</div>
    </div>
  );
}
