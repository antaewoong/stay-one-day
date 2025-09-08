// 숙소 가격 계산 유틸리티

interface AccommodationPricing {
  base_price: number;
  weekend_price: number;
  peak_season_price: number;
}

interface HolidayInfo {
  date: string;
  name: string;
  isHoliday: boolean;
}

// 성수기 기간 정의 (예시)
const PEAK_SEASONS = [
  { start: '07-15', end: '08-31' }, // 여름휴가철
  { start: '12-23', end: '01-03' }, // 연말연시
  { start: '04-30', end: '05-05' }, // 어린이날 연휴
  { start: '09-28', end: '10-03' }, // 추석 연휴 (매년 변동)
];

// 주말인지 확인 (금, 토, 일)
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // 일요일(0), 금요일(5), 토요일(6)
}

// 성수기인지 확인
export function isPeakSeason(date: Date, holidays: HolidayInfo[] = []): boolean {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${month}-${day}`;
  
  // 공휴일인지 확인
  const dateStr = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === dateStr && holiday.isHoliday);
  
  if (isHoliday) {
    return true;
  }
  
  // 정의된 성수기 기간에 포함되는지 확인
  return PEAK_SEASONS.some(season => {
    const startMonth = parseInt(season.start.split('-')[0]);
    const startDay = parseInt(season.start.split('-')[1]);
    const endMonth = parseInt(season.end.split('-')[0]);
    const endDay = parseInt(season.end.split('-')[1]);
    
    const currentMonth = date.getMonth() + 1;
    const currentDay = date.getDate();
    
    // 연말연시처럼 년도를 넘나드는 경우 처리
    if (startMonth > endMonth) {
      return (currentMonth > startMonth || currentMonth < endMonth) ||
             (currentMonth === startMonth && currentDay >= startDay) ||
             (currentMonth === endMonth && currentDay <= endDay);
    } else {
      return (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) &&
             (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay));
    }
  });
}

// 특정 날짜의 가격 계산
export function calculateDayPrice(
  date: Date, 
  pricing: AccommodationPricing, 
  holidays: HolidayInfo[] = []
): number {
  // 성수기 > 주말 > 기본 요금 순으로 우선순위
  if (isPeakSeason(date, holidays)) {
    return pricing.peak_season_price;
  }
  
  if (isWeekend(date)) {
    return pricing.weekend_price;
  }
  
  return pricing.base_price;
}

// 기간별 총 가격 계산
export function calculateTotalPrice(
  startDate: Date,
  endDate: Date,
  pricing: AccommodationPricing,
  holidays: HolidayInfo[] = []
): { totalPrice: number; breakdown: Array<{ date: string; price: number; type: 'base' | 'weekend' | 'peak' }> } {
  const breakdown: Array<{ date: string; price: number; type: 'base' | 'weekend' | 'peak' }> = [];
  let totalPrice = 0;
  
  const currentDate = new Date(startDate);
  
  // 체크아웃 날짜 전까지 계산 (체크아웃 당일은 제외)
  while (currentDate < endDate) {
    const dayPrice = calculateDayPrice(currentDate, pricing, holidays);
    let priceType: 'base' | 'weekend' | 'peak' = 'base';
    
    if (isPeakSeason(currentDate, holidays)) {
      priceType = 'peak';
    } else if (isWeekend(currentDate)) {
      priceType = 'weekend';
    }
    
    breakdown.push({
      date: currentDate.toISOString().split('T')[0],
      price: dayPrice,
      type: priceType
    });
    
    totalPrice += dayPrice;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { totalPrice, breakdown };
}

// 가격 타입별 라벨
export function getPriceTypeLabel(type: 'base' | 'weekend' | 'peak'): string {
  switch (type) {
    case 'base':
      return '기본 요금';
    case 'weekend':
      return '주말 요금';
    case 'peak':
      return '성수기 요금';
    default:
      return '기본 요금';
  }
}

// 날짜별 가격 타입 확인
export function getPriceType(date: Date, holidays: HolidayInfo[] = []): 'base' | 'weekend' | 'peak' {
  if (isPeakSeason(date, holidays)) {
    return 'peak';
  }
  
  if (isWeekend(date)) {
    return 'weekend';
  }
  
  return 'base';
}