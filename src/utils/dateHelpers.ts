export const getStartOfMonth = (year: number, month: number): Date => {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
};

export const getEndOfMonth = (year: number, month: number): Date => {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
};

export const formatDateForSupabase = (date: Date): string => {
  return date.toISOString().split('.')[0]+'Z';
};

export const getCurrentMonthDates = () => {
  const now = new Date();
  return {
    start: getStartOfMonth(now.getFullYear(), now.getMonth() + 1),
    end: getEndOfMonth(now.getFullYear(), now.getMonth() + 1)
  };
}; 