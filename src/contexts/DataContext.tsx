import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react'
import Fuse from 'fuse.js'
import type { AppData, Material, Category, SceneType, MaterialType } from '../types'
import { DEMO_DATA } from '../data/demo'

const DATA_URL = './data/materials.json'
const STORAGE_DRAFT_KEY = 'tfc-admin-draft'

interface DataCtx {
  data: AppData
  loading: boolean
  error: string | null
  // 查询
  getMaterialById: (id: string) => Material | undefined
  getCategoryPathNames: (pathIds: string[]) => string[]
  getCategoryById: (id: string) => Category | undefined
  // 筛选
  filterMaterials: (params: FilterParams) => Material[]
  // 后台草稿（编辑态，不影响展示数据）
  draft: AppData | null
  loadDraft: () => void
  saveDraft: (d: AppData) => void
  clearDraft: () => void
  exportDraft: () => string
  importDraft: (raw: string) => { ok: boolean; error?: string }
  // 计数
  incrementViews: (id: string) => void
  incrementDownloads: (id: string) => void
}

export interface FilterParams {
  keyword?: string
  categoryId?: string
  type?: MaterialType | 'all'
  resolution?: string
  scene?: SceneType | 'all'
  framerate?: number | 'all'
  sort?: 'newest' | 'downloads' | 'views'
  tag?: string
}

const DataContext = createContext<DataCtx | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEMO_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<AppData | null>(null)
  const [viewCounter, setViewCounter] = useState<Record<string, number>>({})
  const [downloadCounter, setDownloadCounter] = useState<Record<string, number>>({})

  // 初次加载：尝试拉取 JSON，失败则用内置 DEMO
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(DATA_URL, { cache: 'no-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as AppData
        if (mounted) setData(json)
      } catch (e: any) {
        console.warn('[Data] 使用内置示例数据，原因：', e?.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const getMaterialById = useCallback((id: string) => {
    return data.materials.find(m => m.id === id)
  }, [data.materials])

  // 在分类树中找节点，同时返回面包屑路径
  function walkCategories(
    nodes: Category[],
    targetId: string,
    trail: Category[] = []
  ): { node: Category; trail: Category[] } | null {
    for (const n of nodes) {
      const nextTrail = [...trail, n]
      if (n.id === targetId) return { node: n, trail: nextTrail }
      if (n.children?.length) {
        const found = walkCategories(n.children, targetId, nextTrail)
        if (found) return found
      }
    }
    return null
  }

  const getCategoryById = useCallback((id: string) => {
    return walkCategories(data.categories, id)?.node
  }, [data.categories])

  const getCategoryPathNames = useCallback((pathIds: string[]) => {
    return pathIds
      .map(id => walkCategories(data.categories, id)?.node?.name)
      .filter(Boolean) as string[]
  }, [data.categories])

  // Fuse.js 模糊搜索索引
  const fuse = useMemo(() => new Fuse(data.materials, {
    keys: [
      { name: 'title', weight: 1.0 },
      { name: 'tags', weight: 0.6 },
      { name: 'description', weight: 0.3 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeMatches: true,
    tokenize: 'full' as any,
    useExtendedSearch: true,
  }), [data.materials])

  const filterMaterials = useCallback((params: FilterParams): Material[] => {
    let list = [...data.materials]

    // 1. 关键词搜索
    if (params.keyword && params.keyword.trim()) {
      const results = fuse.search(params.keyword.trim())
      list = results.map(r => r.item)
    }

    // 2. 分类（匹配 categoryPath 中任意位置出现该分类 id）
    if (params.categoryId) {
      list = list.filter(m => m.categoryPath.includes(params.categoryId!))
    }

    // 3. 类型
    if (params.type && params.type !== 'all') {
      list = list.filter(m => m.type === params.type)
    }

    // 4. 分辨率
    if (params.resolution && params.resolution !== 'all') {
      list = list.filter(m => m.resolution?.toLowerCase() === params.resolution?.toLowerCase())
    }

    // 5. 场景
    if (params.scene && params.scene !== 'all') {
      list = list.filter(m => !m.scene || m.scene === 'any' || m.scene === params.scene)
    }

    // 6. 帧率
    if (params.framerate && params.framerate !== 'all') {
      list = list.filter(m => m.framerate === Number(params.framerate))
    }

    // 7. 标签
    if (params.tag) {
      const t = params.tag.toLowerCase()
      list = list.filter(m => m.tags.some(x => x.toLowerCase() === t))
    }

    // 8. 排序
    switch (params.sort || 'newest') {
      case 'downloads':
        list.sort((a, b) => (b.downloads + (downloadCounter[b.id] || 0)) - (a.downloads + (downloadCounter[a.id] || 0)))
        break
      case 'views':
        list.sort((a, b) => (b.views + (viewCounter[b.id] || 0)) - (a.views + (viewCounter[a.id] || 0)))
        break
      case 'newest':
      default:
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    return list
  }, [data.materials, fuse, downloadCounter, viewCounter])

  // ======= 草稿管理（localStorage）=======
  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DRAFT_KEY)
      if (!raw) { setDraft(data); return }
      const parsed = JSON.parse(raw) as { data: AppData; updatedAt: number }
      setDraft(parsed.data)
    } catch {
      setDraft(data)
    }
  }, [data])

  const saveDraft = useCallback((d: AppData) => {
    setDraft(d)
    try {
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify({
        data: d,
        updatedAt: Date.now(),
      }))
    } catch (e) {
      console.warn('保存草稿失败，可能 localStorage 不可用：', e)
    }
  }, [])

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(STORAGE_DRAFT_KEY) } catch {}
    setDraft(null)
  }, [])

  const exportDraft = useCallback(() => {
    const target = draft || data
    return JSON.stringify(target, null, 2)
  }, [draft, data])

  const importDraft = useCallback((raw: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(raw) as AppData
      if (!parsed.materials || !parsed.categories) {
        return { ok: false, error: 'JSON 缺少 materials 或 categories 字段' }
      }
      saveDraft(parsed)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: 'JSON 解析失败：' + (e?.message || String(e)) }
    }
  }, [saveDraft])

  // ====== 计数器（仅内存 + sessionStorage，不破坏 JSON 数据）======
  const incrementViews = useCallback((id: string) => {
    setViewCounter(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }, [])
  const incrementDownloads = useCallback((id: string) => {
    setDownloadCounter(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }, [])

  return (
    <DataContext.Provider value={{
      data, loading, error,
      getMaterialById, getCategoryById, getCategoryPathNames,
      filterMaterials,
      draft, loadDraft, saveDraft, clearDraft, exportDraft, importDraft,
      incrementViews, incrementDownloads,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
