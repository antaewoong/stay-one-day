/**
 * 배열 안전 처리 유틸리티
 * undefined/null을 안전하게 빈 배열로 변환
 */
export const safe = <T,>(v: T[] | null | undefined): T[] => Array.isArray(v) ? v : [];

/**
 * API 응답을 안전한 배열로 변환
 */
export const mustArray = <T>(v: any): T[] => Array.isArray(v) ? v : [];

/**
 * 객체의 배열 프로퍼티를 안전하게 접근
 */
export const safeAccess = <T>(obj: any, key: string): T[] => safe(obj?.[key]);