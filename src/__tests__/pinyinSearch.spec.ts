import { describe, expect, it } from 'vitest'
import { matchesTextOrPinyin } from '@/utils/pinyinSearch'

describe('matchesTextOrPinyin', () => {
  it('matches empty and direct text queries', () => {
    expect(matchesTextOrPinyin('流萤', '')).toBe(true)
    expect(matchesTextOrPinyin('流萤', '流')).toBe(true)
    expect(matchesTextOrPinyin('Kafka', 'kaf')).toBe(true)
    expect(matchesTextOrPinyin('Gojo 五条悟', 'GOJO')).toBe(true)
  })

  it('matches full pinyin and initials', () => {
    expect(matchesTextOrPinyin('流萤', 'liuying')).toBe(true)
    expect(matchesTextOrPinyin('流萤', 'liu ying')).toBe(true)
    expect(matchesTextOrPinyin('流萤', 'ly')).toBe(true)
    expect(matchesTextOrPinyin('流萤', 'YING')).toBe(true)
  })

  it('matches pinyin for names with repeated characters', () => {
    expect(matchesTextOrPinyin('卡夫卡', 'kafuka')).toBe(true)
    expect(matchesTextOrPinyin('卡夫卡', 'ka fuka')).toBe(true)
    expect(matchesTextOrPinyin('卡夫卡', 'kfk')).toBe(true)
  })

  it('requires continuous character matches for initials', () => {
    expect(matchesTextOrPinyin('卡夫卡', 'kk')).toBe(false)
  })

  it('rejects unrelated queries', () => {
    expect(matchesTextOrPinyin('流萤', 'sr')).toBe(false)
  })
})
