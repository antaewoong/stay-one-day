export default function customImageLoader({ src, width, quality }) {
  // Supabase 이미지는 최적화 없이 그대로 반환
  if (src.includes('supabase.co') || src.includes('storage/v1/object/public')) {
    return src
  }
  
  // 다른 이미지는 기본 최적화 적용
  return `${src}?w=${width}&q=${quality || 75}`
}