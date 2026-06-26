// Fixed current date untuk sistem (Juni 14, 2026 - Sabtu)
const SYSTEM_DATE = '2026-06-14';

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date(SYSTEM_DATE);
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date(SYSTEM_DATE);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
  weekEnd.setHours(23, 59, 59, 999);
  
  return date >= weekStart && date <= weekEnd;
}

export function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date(SYSTEM_DATE);
  return date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('id-ID', options);
}

export function getDaysInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: string[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().split('T')[0]);
  }
  
  return days;
}

export function getMonthsInRange(startMonth: number, count: number): { id: string; month: string; year: number }[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const result: { id: string; month: string; year: number }[] = [];
  const today = new Date(SYSTEM_DATE);
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    result.push({
      id: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      month: months[monthIndex],
      year: year
    });
  }
  
  return result;
}

export function getWeekDays(): { id: string; day: string; date: string }[] {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const result: { id: string; day: string; date: string }[] = [];
  const today = new Date(SYSTEM_DATE);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    result.push({
      id: date.toISOString().split('T')[0],
      day: days[i],
      date: date.toISOString().split('T')[0]
    });
  }
  
  return result;
}

export function getCurrentSystemDate(): string {
  return SYSTEM_DATE;
}
