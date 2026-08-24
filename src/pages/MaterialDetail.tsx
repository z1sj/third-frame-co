import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight, Play, Download, ExternalLink, X, Camera, Aperture, Timer, Sun } from 'lucide-react'
import { useData } from '../contexts/DataContext'

export default function MaterialDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getMaterialById, getCategoryPathNames, incrementViews, incrementDownloads } = useData()

  const material = getMaterialById(id)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [viewTracked, setViewTracked] = useState(false)

  useEffect(() => {
    if (material && !viewTracked) {
      incrementViews(material.id)
      setViewTracked(true)
    }
  }, [material, viewTracked, incrementViews])

  // 详情页不存在
  if (!material) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3 text-apple-text">素材不存在</h2>
          <p className="text-apple-text-secondary mb-6">它可能已经被移除或 ID 有误。</p>
          <Link to="/materials" className="btn-primary">返回素材列表</Link>
        </div>
      </div>
    )
  }

  const coverUrl = material.coverFile?.startsWith('http') ? material.coverFile : `./covers/${material.coverFile}`
  const previewUrl = material.previewFile
    ? (material.previewFile.startsWith('http') ? material.previewFile : `./previews/${material.previewFile}`)
    : undefined
  const categoryNames = getCategoryPathNames(material.categoryPath)

  const handleDownload = (type: 'quark' | 'baidu') => {
    const url = type === 'quark' ? material.quarkUrl : material.baiduUrl
    if (!url) return
    incrementDownloads(material.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const isVideo = material.type === 'video'
  const hasBaidu = Boolean(material.baiduUrl && material.baiduUrl.trim().length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-7xl mx-auto px-5 lg:px-8 pt-28 md:pt-32 pb-16"
    >
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-apple-text-secondary hover:text-apple-text transition-colors mb-8 group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        返回
      </button>

      {/* 预览区 */}
      <div className="mb-10">
        {isVideo ? (
          <div className="relative rounded-lg overflow-hidden shadow-card-hover bg-black aspect-video group">
            {previewUrl ? (
              <video
                controls
                playsInline
                preload="metadata"
                poster={coverUrl}
                className="w-full h-full object-cover"
              >
                <source src={previewUrl} type="video/mp4" />
                您的浏览器不支持 HTML5 视频播放。
              </video>
            ) : (
              // 没有预览视频时，显示封面+中央播放按钮
              <div
                className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
                onClick={() => handleDownload('quark')}
              >
                <img src={coverUrl} alt={material.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-2xl"
                  >
                    <Play size={28} className="text-black ml-1" fill="black" />
                  </motion.div>
                </div>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80 glass-panel px-4 py-1.5 rounded-full">
                  预览视频暂未上传 · 点击下载原片
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => setLightboxOpen(true)}
            className="relative rounded-lg overflow-hidden shadow-card-hover cursor-zoom-in group"
          >
            <img
              src={coverUrl}
              alt={material.title}
              className="w-full max-h-[75vh] object-contain bg-black/5 mx-auto transition-transform duration-700 group-hover:scale-[1.01]"
            />
          </div>
        )}
      </div>

      {/* 主体两栏 */}
      <div className="grid lg:grid-cols-3 gap-10">
        {/* 左栏：标题 + 描述 */}
        <div className="lg:col-span-2">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-4xl font-bold tracking-tight text-apple-text leading-tight mb-4"
          >
            {material.title}
          </motion.h1>

          {/* 面包屑分类路径 */}
          <div className="flex items-center flex-wrap gap-1.5 text-sm mb-6 text-apple-text-secondary">
            <Link to="/materials" className="hover:text-apple-text transition-colors">全部素材</Link>
            {categoryNames.map((name, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <ChevronRight size={12} className="text-apple-text-tertiary" />
                <span className="hover:text-apple-text transition-colors">{name}</span>
              </span>
            ))}
          </div>

          {/* 标签 */}
          {material.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {material.tags.map(t => (
                <Link
                  key={t}
                  to={`/materials?tag=${encodeURIComponent(t)}`}
                  className="chip !text-xs"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* 描述 */}
          <div className="prose prose-invert max-w-none">
            <h2 className="text-lg font-semibold text-apple-text mb-3">素材描述</h2>
            <div className="text-[15px] text-apple-text-secondary leading-8 whitespace-pre-line">
              {material.description || '暂无描述。'}
            </div>
          </div>

          {/* 拍摄参数卡片 */}
          {material.camera && Object.values(material.camera).some(v => v !== undefined && v !== '') && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-apple-text mb-4">拍摄参数</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ParamCard icon={<Camera size={16} />} label="相机" value={material.camera.model} />
                <ParamCard icon={<Aperture size={16} />} label="镜头" value={material.camera.lens} />
                <ParamCard icon={<Aperture size={16} />} label="光圈" value={material.camera.aperture} />
                <ParamCard icon={<Timer size={16} />} label="快门" value={material.camera.shutter} />
                <ParamCard icon={<Sun size={16} />} label="ISO" value={material.camera.iso ? String(material.camera.iso) : undefined} />
                <ParamCard icon={<Sun size={16} />} label="白平衡" value={material.camera.whiteBalance} />
              </div>
            </div>
          )}
        </div>

        {/* 右栏：信息卡 + 下载 */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-lg p-6 lg:sticky lg:top-24 space-y-6">
            {/* 下载按钮 */}
            <div className="space-y-3">
              <motion.button
                onClick={() => handleDownload('quark')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary !justify-between !px-5"
              >
                <span className="inline-flex items-center gap-2">
                  <Download size={16} />
                  夸克网盘下载
                </span>
                <ExternalLink size={14} className="opacity-80" />
              </motion.button>

              {hasBaidu ? (
                <motion.button
                  onClick={() => handleDownload('baidu')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-secondary !justify-between !px-5"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Download size={15} />
                    百度网盘下载
                  </span>
                  <ExternalLink size={13} className="opacity-70" />
                </motion.button>
              ) : (
                <div className="w-full py-2.5 text-center text-xs text-apple-text-tertiary border border-dashed border-apple-border rounded-xsm">
                  暂未提供百度网盘链接
                </div>
              )}
            </div>

            {/* 分割线 */}
            <div className="h-px bg-apple-border" />

            {/* 规格信息 */}
            <dl className="text-sm space-y-3">
              <InfoRow label="类型" value={material.type === 'video' ? '视频' : '照片'} />
              {material.duration && <InfoRow label="时长" value={material.duration} />}
              {material.resolution && <InfoRow label="分辨率" value={material.resolution} />}
              {material.framerate && <InfoRow label="帧率" value={`${material.framerate} fps`} />}
              {material.scene && material.scene !== 'any' && (
                <InfoRow label="场景" value={material.scene === 'indoor' ? '室内' : '室外'} />
              )}
              <InfoRow label="发布时间" value={material.createdAt} />
              <InfoRow label="下载量" value={`${material.downloads + (Math.random() > 1 ? 0 : 0)}+`} />
            </dl>

            {/* 小提示 */}
            <div className="pt-2 text-xs text-apple-text-tertiary leading-relaxed border-t border-apple-border">
              <p className="mb-1">💡 下载说明：</p>
              <p>所有素材免费可商用，无需署名。夸克网盘为主要存储，链接失效请联系站长。</p>
            </div>
          </div>
        </div>
      </div>

      {/* 灯箱（仅照片） */}
      <AnimatePresence>
        {lightboxOpen && !isVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 w-11 h-11 rounded-full glass-panel text-white flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }}
              aria-label="关闭"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={coverUrl}
              alt={material.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ParamCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="p-4 rounded-xsm bg-apple-bg-secondary">
      <div className="flex items-center gap-2 text-xs text-apple-text-tertiary mb-1.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-[15px] font-medium text-apple-text truncate">{value}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <dt className="text-apple-text-tertiary">{label}</dt>
      <dd className="text-apple-text font-medium text-right truncate">{value}</dd>
    </div>
  )
}
