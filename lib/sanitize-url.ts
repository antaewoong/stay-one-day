export function sanitizeImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  
  // 1) 공백/이중스페이스 제거
  let s = raw.trim().replace(/\s+/g, '');
  
  // 2) '%20%20' 같은 찌꺼기 제거
  s = s.replace(/%20%20/g, '%20').replace(/%20/g, '');
  
  // 3) '/admin/https:...' 같은 접두 오염 제거
  const httpsIdx = s.indexOf('https://');
  const httpIdx = s.indexOf('http://');
  const cutIdx = httpsIdx >= 0 ? httpsIdx : httpIdx;
  if (cutIdx > 0) s = s.slice(cutIdx);
  
  // 4) 프로토콜 없으면 보정
  if (!/^https?:\/\//i.test(s)) return null;
  
  try {
    // URL 검증
    const u = new URL(s);
    // 허용 도메인 화이트리스트
    const allowed = new Set(['images.unsplash.com', 'cdn.stayoneday.co.kr']);
    if (!allowed.has(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}