export const getStartOfMonth = (year: number, month: number): Date => {
  const date = new Date(year, month - 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getEndOfMonth = (year: number, month: number): Date => {
  const date = new Date(year, month, 0);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const formatDateForSupabase = (date: Date): string => {
  return date.toISOString();
}; 