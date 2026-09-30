export const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatElapsed = (seconds) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const formatTPlus = (activatedAt, eventAt) => {
  const diff = Math.floor((new Date(eventAt) - new Date(activatedAt)) / 1000);
  return `T+${formatElapsed(diff)}`;
};

export const formatCurrency = (inr) => {
  if (isNaN(inr)) return '₹0.0L';
  return `₹${(inr / 100000).toFixed(1)}L`;
};

export const formatHazardLabel = (score) => {
  if (score >= 0.85) return 'Very High Risk';
  if (score >= 0.70) return 'High Risk';
  if (score >= 0.55) return 'Medium Risk';
  return 'Low Risk — Monitoring';
};

export const formatTierLabel = (tier) => {
  const mapping = {
    IMMEDIATE: 'Evacuate Now',
    Immediate: 'Evacuate Now',
    SHORT_TERM: 'Needs Attention',
    'Short-term': 'Needs Attention',
    MEDIUM_TERM: 'Plan Relocation',
    'Medium-term': 'Plan Relocation',
    MONITOR: 'Keep Watching',
    Monitor: 'Keep Watching'
  };
  return mapping[tier] || tier;
};
