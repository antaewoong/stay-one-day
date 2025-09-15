/**
 * FFmpeg 영상 스티칭 파이프라인
 * 6샷 클립 → 24-30초 세로 영상 합성
 */

import { execSync, spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

interface StitchVideoRequest {
  clips: string[] // 런웨이에서 생성된 비디오 URL들
  templateVars: Record<string, any> // 템플릿 변수 (텍스트 오버레이용)
  outputPath: string // 최종 출력 파일 경로
  options?: {
    resolution?: string // 기본: 1080x1920
    framerate?: number  // 기본: 30fps
    maxFileSize?: number // MB 단위, 기본: 80MB
    crossfadeDuration?: number // 초단위, 기본: 0.3초
    addBrandLogo?: boolean // 브랜드 로고 추가 여부
  }
}

interface StitchVideoResult {
  success: boolean
  outputPath?: string
  duration?: number // 초단위
  fileSize?: number // 바이트
  error?: string
  details?: any
}

/**
 * 비디오 클립들을 하나로 합성
 */
export async function stitchVideoClips(request: StitchVideoRequest): Promise<StitchVideoResult> {
  const startTime = Date.now()

  try {
    console.log(`[FFMPEG] 스티칭 시작: ${request.clips.length}개 클립`)

    // 1. FFmpeg 설치 확인
    await checkFFmpegInstallation()

    // 2. 임시 디렉토리 준비
    const tempDir = `/tmp/video_${Date.now()}`
    await fs.mkdir(tempDir, { recursive: true })

    // 3. 클립 다운로드 및 전처리
    const processedClips = await downloadAndProcessClips(request.clips, tempDir)

    // 4. 스티칭 실행
    const stitchResult = await performStitching({
      ...request,
      clips: processedClips,
      tempDir
    })

    // 5. 후처리 (크기 최적화, 로고 추가)
    const finalResult = await postProcessVideo(stitchResult.outputPath!, request)

    // 6. 임시 파일 정리
    await cleanupTempFiles(tempDir)

    const duration = Date.now() - startTime
    console.log(`[FFMPEG] 스티칭 완료: ${duration}ms`)

    return finalResult

  } catch (error) {
    console.error('[FFMPEG] 스티칭 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }
  }
}

/**
 * FFmpeg 설치 확인
 */
async function checkFFmpegInstallation(): Promise<void> {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
  } catch (error) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg로 설치하세요.')
  }
}

/**
 * 런웨이 클립 다운로드 및 전처리
 */
async function downloadAndProcessClips(clipUrls: string[], tempDir: string): Promise<string[]> {
  const processedClips: string[] = []

  for (let i = 0; i < clipUrls.length; i++) {
    const url = clipUrls[i]
    const clipPath = path.join(tempDir, `clip_${i}.mp4`)
    const processedPath = path.join(tempDir, `processed_${i}.mp4`)

    console.log(`[FFMPEG] 클립 다운로드: ${i + 1}/${clipUrls.length}`)

    // 다운로드
    await downloadFile(url, clipPath)

    // 전처리 (리사이즈, 프레임레이트 표준화)
    await preprocessClip(clipPath, processedPath, {
      resolution: '1080x1920',
      framerate: 30,
      duration: 5 // 각 클립을 5초로 표준화
    })

    processedClips.push(processedPath)
  }

  return processedClips
}

/**
 * 파일 다운로드
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = `curl -L -o "${outputPath}" "${url}"`

    const process = spawn('sh', ['-c', cmd], { stdio: 'pipe' })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`파일 다운로드 실패: ${url}`))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 개별 클립 전처리
 */
async function preprocessClip(
  inputPath: string,
  outputPath: string,
  options: { resolution: string; framerate: number; duration: number }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-i', inputPath,
      '-vf', `scale=${options.resolution}:force_original_aspect_ratio=decrease,pad=${options.resolution}:(ow-iw)/2:(oh-ih)/2`,
      '-r', options.framerate.toString(),
      '-t', options.duration.toString(),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-y', // 덮어쓰기
      outputPath
    ]

    const process = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`클립 전처리 실패: ${inputPath}`))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 메인 스티칭 작업
 */
async function performStitching(
  request: StitchVideoRequest & { tempDir: string }
): Promise<{ outputPath: string }> {
  const { clips, outputPath, tempDir, options } = request
  const crossfadeDuration = options?.crossfadeDuration || 0.3

  // concat 파일 생성
  const concatFilePath = path.join(tempDir, 'concat.txt')
  const concatContent = clips.map(clip => `file '${clip}'`).join('\n')
  await fs.writeFile(concatFilePath, concatContent)

  // 트랜지션 효과가 있는 concat (복잡한 필터링)
  if (crossfadeDuration > 0) {
    await stitchWithTransitions(clips, outputPath, crossfadeDuration)
  } else {
    // 단순 concat (빠름)
    await stitchSimpleConcat(concatFilePath, outputPath)
  }

  return { outputPath }
}

/**
 * 트랜지션 효과를 포함한 스티칭
 */
async function stitchWithTransitions(
  clips: string[],
  outputPath: string,
  crossfadeDuration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 복잡한 FFmpeg 필터 체인 구성
    const inputs = clips.map((_, i) => `-i`).concat(clips).join(' ')

    // crossfade 필터 체인 생성
    let filterComplex = ''
    let currentLabel = '[0:v]'

    for (let i = 1; i < clips.length; i++) {
      const nextLabel = i === clips.length - 1 ? '[v]' : `[v${i}]`
      filterComplex += `${currentLabel}[${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${(i - 1) * (5 - crossfadeDuration) + 5 - crossfadeDuration}${nextLabel};`
      currentLabel = nextLabel
    }

    // 오디오 믹싱
    const audioInputs = clips.map((_, i) => `[${i}:a]`).join('')
    filterComplex += `${audioInputs}amix=inputs=${clips.length}[a]`

    const cmd = [
      'ffmpeg',
      ...clips.map(clip => ['-i', clip]).flat(),
      '-filter_complex', filterComplex,
      '-map', '[v]',
      '-map', '[a]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart', // 스트리밍 최적화
      '-y',
      outputPath
    ]

    console.log(`[FFMPEG] 트랜지션 명령: ${cmd.join(' ')}`)

    const process = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('트랜지션 스티칭 실패'))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 단순 concat 스티칭
 */
async function stitchSimpleConcat(concatFilePath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ]

    const process = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('단순 concat 실패'))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 후처리 (로고, 자막, 크기 최적화)
 */
async function postProcessVideo(inputPath: string, request: StitchVideoRequest): Promise<StitchVideoResult> {
  const { options, templateVars } = request
  const maxFileSize = (options?.maxFileSize || 80) * 1024 * 1024 // MB to bytes

  try {
    // 파일 정보 조회
    const stats = await fs.stat(inputPath)
    const fileSize = stats.size

    // 로고 오버레이 추가
    if (options?.addBrandLogo !== false) {
      await addBrandOverlay(inputPath, templateVars)
    }

    // 파일 크기 확인 및 압축
    if (fileSize > maxFileSize) {
      console.log(`[FFMPEG] 파일 크기 최적화: ${(fileSize / 1024 / 1024).toFixed(2)}MB → 80MB 이하`)
      await compressVideo(inputPath, maxFileSize)
    }

    // 최종 파일 정보
    const finalStats = await fs.stat(inputPath)
    const duration = await getVideoDuration(inputPath)

    return {
      success: true,
      outputPath: inputPath,
      duration,
      fileSize: finalStats.size
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '후처리 실패',
      details: error
    }
  }
}

/**
 * 브랜드 로고 오버레이 추가
 */
async function addBrandOverlay(videoPath: string, templateVars: Record<string, any>): Promise<void> {
  // 브랜드 로고는 Phase 3에서 구현 (QR 코드 + 스마트링크)
  // 현재는 텍스트 오버레이만 추가

  const tempOutput = videoPath.replace('.mp4', '_overlay.mp4')

  return new Promise((resolve, reject) => {
    const overlayText = `${templateVars.region || ''} ${templateVars.accommodation_type || ''}`.trim()

    const cmd = [
      'ffmpeg',
      '-i', videoPath,
      '-vf', `drawtext=text='${overlayText}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=white:x=40:y=h-80:shadow=1:shadowcolor=black:shadowx=2:shadowy=2`,
      '-c:a', 'copy',
      '-y',
      tempOutput
    ]

    const process = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' })

    process.on('close', async (code) => {
      if (code === 0) {
        // 원본을 덮어씀
        await fs.rename(tempOutput, videoPath)
        resolve()
      } else {
        reject(new Error('오버레이 추가 실패'))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 비디오 압축
 */
async function compressVideo(inputPath: string, maxSizeBytes: number): Promise<void> {
  const tempOutput = inputPath.replace('.mp4', '_compressed.mp4')

  return new Promise((resolve, reject) => {
    // 2-pass 인코딩으로 파일 크기 제어
    const bitrate = Math.floor((maxSizeBytes * 8) / (30 * 1000)) // 30초 기준 비트레이트 계산

    const cmd = [
      'ffmpeg',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-b:v', `${bitrate}k`,
      '-maxrate', `${Math.floor(bitrate * 1.2)}k`,
      '-bufsize', `${Math.floor(bitrate * 2)}k`,
      '-c:a', 'aac',
      '-b:a', '64k', // 오디오 비트레이트 낮춤
      '-movflags', '+faststart',
      '-y',
      tempOutput
    ]

    const process = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' })

    process.on('close', async (code) => {
      if (code === 0) {
        await fs.rename(tempOutput, inputPath)
        resolve()
      } else {
        reject(new Error('비디오 압축 실패'))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 비디오 길이 조회
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffprobe',
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      videoPath
    ]

    const process = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' })

    let output = ''
    process.stdout.on('data', (data) => {
      output += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()))
      } else {
        reject(new Error('비디오 길이 조회 실패'))
      }
    })

    process.on('error', reject)
  })
}

/**
 * 임시 파일 정리
 */
async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    const files = await fs.readdir(tempDir)
    await Promise.all(files.map(file => fs.unlink(path.join(tempDir, file))))
    await fs.rmdir(tempDir)
    console.log(`[FFMPEG] 임시 파일 정리 완료: ${tempDir}`)
  } catch (error) {
    console.warn(`[FFMPEG] 임시 파일 정리 실패: ${tempDir}`, error)
  }
}