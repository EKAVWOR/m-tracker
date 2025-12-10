export const formatNumber = (n = 0) =>
  Math.abs(Math.round(Number(n) || 0))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");