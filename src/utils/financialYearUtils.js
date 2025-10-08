import { toast } from '@/components/ui/use-toast';

export const getFinancialYear = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const fyStartYear = month >= 3 ? year : year - 1;
  const fyEndYear = fyStartYear + 1;
  return `${fyStartYear.toString().slice(-2)}-${fyEndYear.toString().slice(-2)}`;
};

export const getFinancialYearDates = (fy) => {
    try {
        if (!fy || typeof fy !== 'string' || !fy.includes('-')) {
            const currentFy = getFinancialYear();
            const startYear = parseInt(`20${currentFy.split('-')[0]}`, 10);
            return {
                start: new Date(startYear, 3, 1),
                end: new Date(startYear + 1, 2, 31, 23, 59, 59),
            };
        }
        const [start, end] = fy.split('-');
        const startYear = parseInt(`20${start}`, 10);
        const endYear = parseInt(`20${end}`, 10);
        return {
            start: new Date(startYear, 3, 1),
            end: new Date(endYear, 2, 31, 23, 59, 59),
        };
    } catch (error) {
        toast({
            title: 'Invalid Financial Year',
            description: 'Could not parse financial year. Using current FY.',
            variant: 'destructive'
        });
        const currentFy = getFinancialYear();
        const startYear = parseInt(`20${currentFy.split('-')[0]}`, 10);
        return {
            start: new Date(startYear, 3, 1),
            end: new Date(startYear + 1, 2, 31, 23, 59, 59),
        };
    }
};

export const generateFutureFinancialYears = (startYear, count = 5) => {
  const years = [];
  let currentYear = startYear;
  for (let i = 0; i < count; i++) {
    years.push(getFinancialYear(new Date(currentYear, 3, 1)));
    currentYear++;
  }
  return years;
};