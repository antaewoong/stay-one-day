// Server-safe No-op Provider to satisfy legacy imports.
// 실제 인증/세션은 기존 useSupabaseSessionSync + 서버 라우트에서 처리됨.
export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

// No-op hook
export const useSupabase = () => {
  return { user: null, supabase: null }
}