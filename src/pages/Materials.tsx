import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { useData, FilterParams } from '../contexts/DataContext'
import { MaterialCard } from '../components/MaterialCard'
import { PAGE_SIZE } from '../config'
import type { Category } from '../types'

type SortKey = 'newest' | 'downloads' | 'views'

export default function Materials() {
  const { data, filterMaterials, getCategoryById } = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const sp = new URLSearchParams(location.search)

  // 从 URL 读取初始筛选（便于分享链接）
  const [keyword, setKeyword] = useState(sp.get('q') || '')
  const [appliedKeyword, setAppliedKeyword] = useState(keyword)
  const [activeCat, setActiveCat] = useState<string | undefined>(sp.get('cat') || undefined)
  const [typeFilter, setTypeFilter] = useState<FilterParams['type']>('all')
  const [sceneFilter, setSceneFilter] = useState<FilterParams['scene']>('all')
  const [resolutionFilter, setResolutionFilter] = useState<string>('all')
  const [framerateFilter, setFramerateFilter] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [tagFilter, setTagFilter] = useState<string | undefined>(sp.get('tag') || undefined)
  const [filterOpen, setFilterOpen] = useState(false)

  // 防抖搜索输入
  useEffect(() => {
    const t = setTimeout(() => setAppliedKeyword(keyword), 280)
    return () => clearTimeout(t)
  }, [keyword])

  const results = useMemo(() => {
    return filterMaterials({
      keyword: appliedKeyword,
      categoryId: activeCat,
      type: typeFilter,
      scene: sceneFilter,
      resolution: resolutionFilter,
      framerate: framerateFilter,
      sort,
      tag: tagFilter,
    })
  }, [filterMaterials, appliedKeyword, activeCat, typeFilter, sceneFilter, resolutionFilter, framerateFilter, sort, tagFilter])

  // 分页
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [activeCat, tagFilter, appliedKeyword, typeFilter, sceneFilter, resolutionFilter, framerateFilter, sort])
  const visible = results.slice(0, visibleCount)
  const hasMore = visibleCount < results.length

  // 分类面包屑
  const breadcrumb: Category[] = useMemo(() => {
    if (!activeCat) return []
    const trail: Category[] = []
    function walk(nodes: Category[], targetId: string, path: Category[]): boolean {
      for (const n of nodes) {
        const nextPath = [...path, n]
        if (n.id === targetId) { trail.push(...nextPath); return true }
        if (n.children?.length && walk(n.children, targetId, nextPath)) return true
      }
      return false
    }
    walk(data.categories, activeCat, [])
    return trail
  }, [activeCat, data.categories])

  const resetAll = () => {
    setKeyword('')
    setAppliedKeyword('')
    setActiveCat(undefined)
    setTypeFilter('all')
    setSceneFilter('all')
    setResolutionFilter('all')
    setFramerateFilter('all')
    setTagFilter(undefined)
    setSort('newest')
    navigate('/materials', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-7xl mx-auto px-5 lg:px-8 pt-28 md:pt-32"
    >
      {/* 标题 + 搜索 */}
      <div className="flex flex-col gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-apple-text">全部素材</h1>
          <p className="mt-2 text-apple-text-secondary">共 {results.length} 个结果 · 免费可商用</p>
        </div>

        {/* 搜索栏 */}
        <div className="relative max-w-2xl">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-apple-text-tertiary" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索素材名称、标签、描述…"
            className="pill-input pl-12 pr-12"
          />
          {keyword && (
            <button
              onClick={() => { setKeyword(''); setAppliedKeyword('') }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-apple-text-tertiary hover:bg-apple-bg-secondary transition-colors"
              aria-label="清除搜索"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 吸顶筛选条 */}
      <div className="sticky top-16 z-30 py-4 -mx-5 px-5 md:-mx-8 md:px-8 glass-panel border-y border-apple-glass-border mb-8">
        {/* 面包屑 + 筛选 Chip */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={`chip ${!activeCat && !tagFilter ? 'active' : ''}`}
            onClick={() => { setActiveCat(undefined); setTagFilter(undefined) }}
          >
            全部
          </button>
          {breadcrumb.map((c, i) => (
            <button key={c.id} className="chip active" onClick={() => setActiveCat(c.id)}>
              {i > 0 && <ChevronRight size={12} className="opacity-60 mr-0.5" />}
              {c.name}
            </button>
          ))}
          {tagFilter && (
            <span className="chip active inline-flex items-center gap-1.5">
              #{tagFilter}
              <button onClick={() => setTagFilter(undefined)} aria-label="移除标签"><X size={12} /></button>
            </span>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setFilterOpen(v => !v)}
            className="chip md:hidden"
          >
            <SlidersHorizontal size={14} className="mr-1" /> 筛选
          </button>

          {/* 类型筛选（桌面直接显示，移动端在展开区） */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
            <FilterChip label="类型" value={typeFilter || 'all'} onChange={(v) => setTypeFilter(v as any)}
              options={[['all', '全部'], ['video', '视频'], ['photo', '照片']]} />
            <FilterChip label="场景" value={sceneFilter || 'all'} onChange={(v) => setSceneFilter(v as any)}
              options={[['all', '全部'], ['outdoor', '室外'], ['indoor', '室内']]} />
            <FilterChip label="分辨率" value={resolutionFilter} onChange={setResolutionFilter}
              options={[['all', '全部'], ['4K', '4K'], ['1080P', '1080P']]} />
            <FilterChip label="帧率" value={String(framerateFilter)} onChange={(v) => setFramerateFilter(v === 'all' ? 'all' : Number(v))}
              options={[['all', '全部'], ['24', '24'], ['25', '25'], ['30', '30'], ['60', '60']]} />
            <FilterChip label="排序" value={sort} onChange={(v) => setSort(v as SortKey)}
              options={[['newest', '最新'], ['downloads', '下载量'], ['views', '浏览量']]} />
          </div>

          {/* 桌面排序下拉（简洁显示） */}
          <div className="hidden lg:inline-flex items-center gap-1.5 text-sm text-apple-text-secondary">
            <ArrowUpDown size={14} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="newest">最新优先</option>
              <option value="downloads">下载最多</option>
              <option value="views">浏览最多</option>
            </select>
          </div>
        </div>

        {/* 移动端展开筛选区 */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 grid grid-cols-2 gap-3">
                <MobileFilterGroup title="类型" value={typeFilter || 'all'} onChange={(v) => setTypeFilter(v as any)}
                  options={[['all', '全部'], ['video', '视频'], ['photo', '照片']]} />
                <MobileFilterGroup title="场景" value={sceneFilter || 'all'} onChange={(v) => setSceneFilter(v as any)}
                  options={[['all', '全部'], ['outdoor', '室外'], ['indoor', '室内']]} />
                <MobileFilterGroup title="分辨率" value={resolutionFilter} onChange={setResolutionFilter}
                  options={[['all', '全部'], ['4K', '4K'], ['1080P', '1080P']]} />
                <MobileFilterGroup title="帧率" value={String(framerateFilter)} onChange={(v) => setFramerateFilter(v === 'all' ? 'all' : Number(v))}
                  options={[['all', '全部'], ['24', '24'], ['25', '25'], ['30', '30'], ['60', '60']]} />
                <div className="col-span-2">
                  <MobileFilterGroup title="排序" value={sort} onChange={(v) => setSort(v as SortKey)}
                    options={[['newest', '最新'], ['downloads', '下载最多'], ['views', '浏览最多']]} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 分类快捷入口（一级分类） */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
          {data.categories.flatMap(root => [
            { id: root.id, name: root.name, level: 0 },
            ...root.children.map(c => ({ id: c.id, name: `${root.name} · ${c.name}`, level: 1 }))
          ]).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveCat(activeCat === item.id ? undefined : item.id)}
              className={`whitespace-nowrap text-xs md:text-sm px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
                activeCat === item.id
                  ? 'bg-apple-text text-apple-bg border-apple-text'
                  : 'border-apple-border text-apple-text-secondary hover:text-apple-text hover:border-apple-text-tertiary'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* 结果网格 */}
      {results.length === 0 ? (
        <EmptyState onReset={resetAll} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((m, i) => (
              <MaterialCard key={m.id} material={m} index={i} />
            ))}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <div className="mt-14 text-center">
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="btn-secondary"
              >
                加载更多（还剩 {results.length - visibleCount} 个）
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

function FilterChip<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void; options: [T, string][];
}) {
  return (
    <div className="inline-flex items-center gap-1 border border-apple-border rounded-full px-1 py-1">
      <span className="pl-2 text-xs text-apple-text-tertiary pr-1">{label}</span>
      <div className="flex items-center gap-0.5">
        {options.map(([v, text]) => {
          const active = v === value
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={`text-xs px-2.5 py-0.5 rounded-full transition-all duration-200 ${
                active ? 'bg-apple-text text-apple-bg' : 'text-apple-text-secondary hover:text-apple-text'
              }`}
            >
              {text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MobileFilterGroup<T extends string>({ title, value, onChange, options }: {
  title: string; value: T; onChange: (v: T) => void; options: [T, string][];
}) {
  return (
    <div>
      <div className="text-xs text-apple-text-tertiary mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, text]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              v === value
                ? 'bg-apple-text text-apple-bg border-apple-text'
                : 'border-apple-border text-apple-text-secondary'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto w-16 h-16 rounded-xsm flex items-center justify-center text-apple-text-secondary bg-apple-bg-secondary mb-5">
        <Search size={24} />
      </div>
      <h3 className="text-lg font-semibold text-apple-text mb-2">没有找到匹配的素材</h3>
      <p className="text-sm text-apple-text-secondary mb-6 max-w-md mx-auto">
        试着换一下关键词，或移除部分筛选条件。
      </p>
      <button onClick={onReset} className="btn-primary">重置筛选</button>
      <Link to="/materials" className="btn-secondary ml-3">回到初始</Link>
    </div>
  )
}
