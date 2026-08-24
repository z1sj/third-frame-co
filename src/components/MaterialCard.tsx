import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Image as ImageIcon } from 'lucide-react'
import type { Material } from '../types'
import { useData } from '../contexts/DataContext'

interface Props {
  material: Material
  index?: number
}

/**
 * 素材卡片（16:9 规整网格）
 * 含：封面图 / 类型角标 / 时长 / 标题 / 分类 / 进入错峰动画 / 悬停微上浮
 */
export function MaterialCard({ material, index = 0 }: Props) {
  const { getCategoryPathNames } = useData()
  const catNames = getCategoryPathNames(material.categoryPath).slice(0, 2).join(' · ')
  const coverUrl = material.coverFile?.startsWith('http')
    ? material.coverFile
    : `./covers/${material.coverFile}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.08, 0.4),
      }}
    >
      <Link to={`/material/${material.id}`} className="card-apple block group aspect-video">
        {/* 图片 */}
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={coverUrl}
            alt={material.title}
            loading="lazy"
            className="card-image w-full h-full object-cover"
            onError={(e) => {
              // 占位图（渐变底+文字）
              const t = e.currentTarget
              t.style.visibility = 'hidden'
              t.parentElement!.style.background =
                'linear-gradient(135deg, var(--bg-secondary) 0%, var(--border) 100%)'
            }}
          />
          {/* 顶部角标 */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="glass-panel inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text font-medium">
              {material.type === 'video' ? (
                <><Play size={11} fill="currentColor" /> {material.duration || '视频'}</>
              ) : (
                <><ImageIcon size={11} /> 照片</>
              )}
            </span>
            {material.featured && (
              <span className="glass-panel inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium text-amber-500">
                ★ 精选
              </span>
            )}
          </div>
          {/* 分辨率/标签 */}
          {material.resolution && (
            <div className="absolute top-3 right-3 glass-panel px-2 py-1 rounded-full text-[11px] font-medium text-apple-text">
              {material.resolution}
              {material.framerate ? ` · ${material.framerate}fps` : ''}
            </div>
          )}
          {/* 悬停遮罩渐显 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>
      {/* 底部信息 */}
      <div className="pt-4 px-1 space-y-1.5">
        <h3 className="text-[15px] font-semibold text-apple-text leading-snug line-clamp-2 group-hover:text-apple-accent transition-colors duration-300">
          <Link to={`/material/${material.id}`}>{material.title}</Link>
        </h3>
        <p className="text-xs text-apple-text-tertiary">
          {catNames}
          {material.scene && material.scene !== 'any' ? ` · ${material.scene === 'indoor' ? '室内' : '室外'}` : ''}
        </p>
      </div>
    </motion.div>
  )
}
