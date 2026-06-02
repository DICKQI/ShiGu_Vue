import { match } from 'pinyin-pro'

export const matchesTextOrPinyin = (text: string, query: string): boolean => {
  const target = (text || '').trim()
  const keyword = (query || '').trim()

  if (!keyword) return true

  if (target.toLowerCase().includes(keyword.toLowerCase())) {
    return true
  }

  try {
    return match(target, keyword, { continuous: true, insensitive: true, v: true }) !== null
  } catch {
    return false
  }
}
