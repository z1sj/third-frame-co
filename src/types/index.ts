// ========== 类型定义 ==========

export type MaterialType = 'video' | 'photo'
export type SceneType = 'indoor' | 'outdoor' | 'any'

export interface CameraParams {
  model?: string
  lens?: string
  aperture?: string
  shutter?: string
  iso?: number | string
  whiteBalance?: string
}

export interface Material {
  id: string
  title: string
  type: MaterialType
  categoryPath: string[] // 3级分类ID路径，如 ["camera", "sony", "slog3"]
  resolution?: '4K' | '1080P' | string
  framerate?: number
  scene?: SceneType
  duration?: string // 仅视频用，如 "00:42"
  quarkUrl: string
  baiduUrl?: string
  coverFile: string
  previewFile?: string
  description: string
  tags: string[]
  camera?: CameraParams
  createdAt: string // ISO 日期
  downloads: number
  views: number
  featured?: boolean
}

export interface Category {
  id: string
  name: string
  icon?: string // lucide icon name
  children: Category[]
}

export interface SocialLink {
  name: string
  url: string
  icon?: string // lucide icon name
}

export interface AboutData {
  name: string
  avatar?: string
  bio: string
  socials: SocialLink[]
}

export interface SiteConfig {
  heroBackgrounds: string[]
  featuredIds: string[]
}

export interface AppData {
  materials: Material[]
  categories: Category[]
  about: AboutData
  siteConfig: SiteConfig
}

// 后台 localStorage 草稿
export interface AdminDraft {
  data: AppData
  updatedAt: number
}
