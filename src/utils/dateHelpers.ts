export const getStartOfMonth = (year: number, month: number): Date => {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date;
};

export const getEndOfMonth = (year: number, month: number): Date => {
  const date = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return date;
};

export const formatDateForSupabase = (date: Date): string => {
  return date.toISOString();
};

export const getCurrentMonthDates = () => {
  const now = new Date();
  return {
    start: getStartOfMonth(now.getFullYear(), now.getMonth() + 1),
    end: getEndOfMonth(now.getFullYear(), now.getMonth() + 1)
  };
}; 