import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { useData } from '../contexts/DataContext'

export default function About() {
  const { data } = useData()
  const { about } = data

  const avatarUrl = about.avatar
    ? (about.avatar.startsWith('http') ? about.avatar : `./about/${about.avatar}`)
    : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto px-5 lg:px-8 pt-32 md:pt-40 pb-24"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-center mb-8"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-apple-bg-secondary flex items-center justify-center overflow-hidden border-4 border-apple-bg shadow-card-hover">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={about.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span className="text-4xl font-bold text-apple-text-tertiary">
                {about.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-green-500 border-4 border-apple-bg flex items-center justify-center text-white">
            <LucideIcons.Check size={14} strokeWidth={3} />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-apple-text mb-3">
          {about.name}
        </h1>
        <p className="text-apple-text-secondary">摄影师 · 调色师 · 素材作者</p>
      </motion.div>

      {/* 自我介绍 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass-panel rounded-lg p-7 md:p-9 mb-10"
      >
        <h2 className="text-lg font-semibold text-apple-text mb-4 flex items-center gap-2">
          <LucideIcons.User size={18} />
          关于我
        </h2>
        <div className="text-[15px] text-apple-text-secondary leading-8 whitespace-pre-line">
          {about.bio || '这个人很懒，什么也没留下。'}
        </div>
      </motion.div>

      {/* 社交链接 */}
      {about.socials?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-lg p-7 md:p-9"
        >
          <h2 className="text-lg font-semibold text-apple-text mb-5 flex items-center gap-2">
            <LucideIcons.Link size={18} />
            找到我
          </h2>
          <div className="grid gap-3">
            {about.socials.map((s, i) => {
              const Icon = (LucideIcons as any)[s.icon || 'Link'] || LucideIcons.Link
              return (
                <motion.a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 + i * 0.06 }}
                  className="flex items-center justify-between p-4 rounded-xsm bg-apple-bg-secondary hover:bg-apple-bg-elevated border border-transparent hover:border-apple-border transition-all group"
                >
                  <span className="flex items-center gap-3 text-apple-text">
                    <span className="w-9 h-9 rounded-full bg-apple-bg text-apple-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon size={16} />
                    </span>
                    <span className="font-medium">{s.name}</span>
                  </span>
                  <LucideIcons.ExternalLink size={14} className="text-apple-text-tertiary group-hover:text-apple-accent transition-colors" />
                </motion.a>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* 返回按钮 */}
      <div className="mt-12 text-center">
        <a href="/" className="text-apple-accent hover:text-apple-accent-hover text-sm inline-flex items-center gap-1.5 transition-colors">
          ← 回到首页
        </a>
      </div>
    </motion.div>
  )
}
