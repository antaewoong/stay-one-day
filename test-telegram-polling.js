const TELEGRAM_BOT_TOKEN = '8209176642:AAHU7Buq5Lo2IIdAtT8UkrQswYHzMM_gow0'

async function getUpdates() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`)
    const data = await response.json()
    
    if (data.ok && data.result.length > 0) {
      console.log('📨 받은 메시지들:')
      data.result.forEach(update => {
        if (update.message) {
          console.log(`- ${update.message.from.first_name}: ${update.message.text}`)
        }
      })
    } else {
      console.log('📭 새 메시지 없음')
    }
  } catch (error) {
    console.error('❌ 에러:', error.message)
  }
}

async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })
    
    const data = await response.json()
    if (data.ok) {
      console.log('✅ 메시지 전송 성공!')
    } else {
      console.log('❌ 메시지 전송 실패:', data.description)
    }
  } catch (error) {
    console.error('❌ 전송 에러:', error.message)
  }
}

console.log('🤖 텔레그램 봇 테스트 시작...')
console.log('📱 텔레그램에서 봇에게 메시지를 보내세요!')

// 테스트: 봇에게 메시지를 보내면 "Hello!"로 답장
setInterval(async () => {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`)
  const data = await response.json()
  
  if (data.ok && data.result.length > 0) {
    const lastUpdate = data.result[data.result.length - 1]
    if (lastUpdate.message) {
      const chatId = lastUpdate.message.chat.id
      const text = lastUpdate.message.text
      const userName = lastUpdate.message.from.first_name
      
      console.log(`📨 ${userName}: ${text}`)
      
      // 간단한 응답
      if (text.includes('/start')) {
        await sendMessage(chatId, '🤖 안녕하세요! 텔레그램 봇 테스트 중입니다!')
      } else {
        await sendMessage(chatId, `${userName}님이 "${text}"라고 하셨네요! 봇이 정상 작동 중입니다! 🎉`)
      }
      
      // 메시지 확인했으니 삭제 (다음 polling에서 중복 방지)
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdate.update_id + 1}`)
    }
  }
}, 2000)