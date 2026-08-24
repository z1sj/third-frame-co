import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ArrowRight, Camera, MapPin, Monitor, Gauge } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { MaterialCard } from '../components/MaterialCard'
import { FEATURED_LIMIT, SITE_NAME, SITE_NAME_CN, SITE_SLOGAN } from '../config'
import type { Category } from '../types'

const CATEGORY_ICONS: Record<string, any> = {
  Camera, MapPin, Monitor, Gauge,
}

export default function Home() {
  const { data, filterMaterials } = useData()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  // 视差：背景 y 偏移 / 内容淡入淡出
  const bgY = useTransform(scrollY, [0, 600], ['0%', '18%'])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const titleY = useTransform(scrollY, [0, 500], [0, -40])

  // Hero 背景循环淡入
  const [bgIdx, setBgIdx] = useState(0)
  const heroBgs = data.siteConfig.heroBackgrounds
  useEffect(() => {
    if (!heroBgs?.length) return
    const t = setInterval(() => setBgIdx(i => (i + 1) % heroBgs.length), 7000)
    return () => clearInterval(t)
  }, [heroBgs?.length])

  // 精选素材（按配置 featuredIds 排序，最多取 FEATURED_LIMIT）
  const featured = useMemo(() => {
    const ids = data.siteConfig.featuredIds || []
    const byId = new Map(data.materials.map(m => [m.id, m]))
    const ordered = ids.map(id => byId.get(id)).filter(Boolean) as typeof data.materials
    const fromData = data.materials
      .filter(m => m.featured && !ids.includes(m.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return [...ordered, ...fromData].slice(0, FEATURED_LIMIT)
  }, [data.materials, data.siteConfig.featuredIds])

  // 一级分类（首页入口展示）
  const topCategories: Category[] = data.categories.slice(0, 6)

  // 所有素材数量汇总
  const stats = useMemo(() => {
    const videoCount = data.materials.filter(m => m.type === 'video').length
    const photoCount = data.materials.filter(m => m.type === 'photo').length
    return { total: data.materials.length, videoCount, photoCount }
  }, [data.materials])

  return (
    <div>
      {/* ============ Hero 区 ============ */}
      <section
        ref={heroRef}
        className="relative h-[100svh] min-h-[640px] w-full overflow-hidden flex items-center justify-center"
      >
        {/* 多层背景图做交叉淡入 */}
        {heroBgs && heroBgs.length > 0 ? (
          heroBgs.map((bg, i) => {
            const url = bg.startsWith('http') ? bg : `./hero/${bg}`
            return (
              <motion.div
                key={bg}
                style={{ y: bgY }}
                className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out"
                initial={{ opacity: 0 }}
                animate={{ opacity: i === bgIdx ? 1 : 0 }}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  style={{ opacity: 0 }}
                />
              </motion.div>
            )
          })
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-black" />
        )}

        {/* 遮罩层 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50 dark:from-black/50 dark:via-black/40 dark:to-black/70" />

        {/* Hero 内容 */}
        <motion.div
          style={{ opacity: heroOpacity, y: titleY }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="inline-block glass-panel mb-6 px-4 py-1.5 rounded-full text-xs font-medium text-white/90 tracking-wide"
          >
            {SITE_NAME_CN} · {SITE_SLOGAN}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-xl mb-6"
            style={{ fontFamily: 'inherit', letterSpacing: '-0.04em' }}
          >
            {SITE_NAME}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="text-lg md:text-xl text-white/85 max-w-xl mx-auto mb-10 font-light leading-relaxed"
          >
            {stats.total} 段精心拍摄的视频与照片素材，覆盖主流品牌相机 Log 灰片。
            <br className="hidden md:block" />
            免费下载，可直接商用。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/materials" className="btn-primary text-base !bg-white !text-black hover:!shadow-apple-glow">
              浏览素材
              <ArrowRight size={16} />
            </Link>
            <a
              href="#featured"
              className="btn-secondary text-base !text-white !border-white/30 hover:!bg-white/10"
            >
              查看精选
            </a>
          </motion.div>

          {/* 统计信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-16 flex items-center justify-center gap-10 text-white/80 text-sm"
          >
            <StatBlock label="总素材" value={stats.total} />
            <Divider />
            <StatBlock label="视频" value={stats.videoCount} />
            <Divider />
            <StatBlock label="照片" value={stats.photoCount} />
          </motion.div>
        </motion.div>

        {/* 滚动提示 */}
        <motion.a
          href="#featured"
          aria-label="向下滚动"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 animate-bounce-soft"
        >
          <ChevronDown size={28} strokeWidth={2} />
        </motion.a>
      </section>

      {/* ============ 精选横向滚动区 ============ */}
      <section id="featured" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 mb-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl font-bold tracking-tight text-apple-text"
              >
                精选素材
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-2 text-apple-text-secondary"
              >
                高频使用、调色空间极大的精选片段。
              </motion.p>
            </div>
            <Link
              to="/materials"
              className="text-apple-accent hover:text-apple-accent-hover text-sm inline-flex items-center gap-1 transition-colors"
            >
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 横向滚动卡片 */}
        <div className="relative">
          <div
            className="overflow-x-auto no-scrollbar pb-8 hero-mask-edge"
            onWheel={(e) => {
              // 纵向滚轮转横向滚动
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.currentTarget.scrollLeft += e.deltaY
              }
            }}
          >
            <div className="flex gap-5 px-[10vw] min-w-max">
              {featured.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: Math.min(idx * 0.07, 0.42), ease: [0.22, 1, 0.36, 1] }}
                  className="w-[320px] md:w-[440px] shrink-0"
                >
                  <MaterialCard material={m} index={0} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 分类入口区 ============ */}
      <section className="py-20 md:py-24 bg-apple-bg-secondary rounded-t-[40px] md:rounded-t-[64px]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-apple-text mb-3">按分类浏览</h2>
            <p className="text-apple-text-secondary">按相机品牌、场景、分辨率，找到你最需要的素材。</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topCategories.map((cat, i) => {
              const Icon = CATEGORY_ICONS[cat.icon || ''] || Camera
              // 子分类名称列表（前最多5个）
              const subNames = cat.children.map(c => c.name).slice(0, 5)
              const countInCat = data.materials.filter(m =>
                m.categoryPath.includes(cat.id) ||
                cat.children.some(c => m.categoryPath.includes(c.id)) ||
                cat.children.flatMap(c => c.children).some(c => m.categoryPath.includes(c.id))
              ).length
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/materials?cat=${cat.id}`}
                    className="card-apple block p-7 h-full group"
                  >
                    <div className="w-12 h-12 rounded-xsm flex items-center justify-center text-apple-accent bg-apple-bg-secondary mb-5 transition-transform duration-300 group-hover:scale-105">
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-semibold text-apple-text mb-2">{cat.name}</h3>
                    <p className="text-sm text-apple-text-secondary mb-5">
                      {countInCat} 个素材 · {subNames.slice(0, 3).join(' / ')}
                      {subNames.length > 3 ? ` +${subNames.length - 3}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subNames.map(sn => (
                        <span key={sn} className="text-[11px] px-2 py-0.5 rounded-full border border-apple-border text-apple-text-tertiary">
                          {sn}
                        </span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
      <div className="text-[11px] md:text-xs uppercase tracking-widest text-white/60 mt-1">{label}</div>
    </div>
  )
}
function Divider() {
  return <div className="w-px h-10 bg-white/20" />
}
