import { GITHUB_REPO } from '../config'

const API_BASE = 'https://api.github.com'

// Token 存取
export function getToken(): string | null {
  try {
    return localStorage.getItem('tfc-github-token')
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem('tfc-github-token', token.trim())
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem('tfc-github-token')
  } catch {}
}

// UTF-8 字符串 → base64（支持中文）
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// File → base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer)
      let binary = ''
      const chunk = 0x8000
      for (let i = 0; i < arr.length; i += chunk) {
        binary += String.fromCharCode(...arr.subarray(i, i + chunk))
      }
      resolve(btoa(binary))
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsArrayBuffer(file)
  })
}

// 获取文件 SHA（更新已有文件时需要）
async function getFileSha(token: string, path: string): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data.sha || null
  } catch {
    return null
  }
}

// 通用上传函数
export async function uploadFile(
  path: string,
  contentBase64: string,
  message: string,
  onProgress?: (msg: string) => void
): Promise<{ ok: boolean; error?: string }> {
  const token = getToken()
  if (!token) return { ok: false, error: '请先设置 GitHub Token' }

  try {
    onProgress?.('获取文件信息...')
    const sha = await getFileSha(token, path)

    onProgress?.(sha ? '更新文件...' : '上传文件...')
    const resp = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        ...(sha ? { sha } : {}),
      }),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      return { ok: false, error: err.message || `HTTP ${resp.status}` }
    }

    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || '上传失败' }
  }
}

// 上传二进制文件（封面图、预览视频）
export async function uploadBinaryFile(
  path: string,
  file: File,
  message: string,
  onProgress?: (msg: string) => void
): Promise<{ ok: boolean; error?: string }> {
  onProgress?.('读取文件...')
  const content = await fileToBase64(file)
  return uploadFile(path, content, message, onProgress)
}

// 上传 JSON 数据（materials.json 等）
export async function uploadJSON(
  path: string,
  json: string,
  message: string,
  onProgress?: (msg: string) => void
): Promise<{ ok: boolean; error?: string }> {
  const content = utf8ToBase64(json)
  return uploadFile(path, content, message, onProgress)
}
