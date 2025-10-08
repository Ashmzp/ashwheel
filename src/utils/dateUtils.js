import { format as dateFnsFormat, startOfMonth, endOfMonth } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return dateFnsFormat(d, 'dd-MM-yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN');
};

export const formatDateTimeForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (num) => num.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const getStockDays = (purchaseDate) => {
  if (!purchaseDate) return 0;
  const today = new Date();
  const purchase = new Date(purchaseDate);
  const diffTime = Math.abs(today - purchase);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getStockDaysClass = (days) => {
  if (days <= 30) return 'stock-days-new';
  if (days <= 90) return 'stock-days-medium';
  return 'stock-days-old';
};

export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentMonthDateRange = () => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return {
    start: dateFnsFormat(start, 'yyyy-MM-dd'),
    end: dateFnsFormat(end, 'yyyy-MM-dd'),
  };
};

export const addDaysToDate = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

export const isDateInRange = (date, startDate, endDate) => {
  if (!date) return false;
  const d = new Date(date);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};