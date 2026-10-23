export const isPositiveInt = (v: string) => {
  const t = v.trim();
  return /^\d+$/.test(t) && Number(t) > 0;
};

export const isNonNegativeInt = (v: string) => {
  const t = v.trim();
  return /^\d+$/.test(t) && Number(t) >= 0;
};
