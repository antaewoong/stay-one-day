import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user has admin privileges (you can implement proper admin check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Read the schema fix SQL file
    const sqlPath = join(process.cwd(), 'lib', 'fix-database-schema.sql')
    const sqlCommands = readFileSync(sqlPath, 'utf8')
    
    // Split commands and execute them one by one
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    const results = []
    
    for (const command of commands) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_command: command 
        })
        
        if (error) {
          console.warn('SQL Command warning:', error.message)
          // Continue with other commands even if some fail
        }
        
        results.push({
          command: command.substring(0, 100) + '...',
          success: !error,
          error: error?.message
        })
      } catch (cmdError) {
        console.error('Command execution error:', cmdError)
        results.push({
          command: command.substring(0, 100) + '...',
          success: false,
          error: 'Execution failed'
        })
      }
    }

    return NextResponse.json({
      message: '데이터베이스 스키마 수정이 완료되었습니다.',
      results,
      totalCommands: commands.length,
      successCount: results.filter(r => r.success).length
    })

  } catch (error) {
    console.error('스키마 수정 오류:', error)
    return NextResponse.json(
      { error: '스키마 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}