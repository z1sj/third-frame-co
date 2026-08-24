import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Menu, X, Search } from 'lucide-react'
import { SITE_NAME, SITE_NAME_CN } from '../config'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 路由变化时关闭菜单
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors duration-300 ${isActive
      ? 'text-apple-text'
      : 'text-apple-text-secondary hover:text-apple-text'}`

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'glass-panel border-b border-apple-glass-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-xsm bg-apple-text text-apple-bg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Film size={18} strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold tracking-tight text-apple-text">{SITE_NAME}</span>
            <span className="text-[10px] text-apple-text-tertiary tracking-wider">{SITE_NAME_CN}</span>
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-9">
          <NavLink to="/" end className={navClass}>首页</NavLink>
          <NavLink to="/materials" className={navClass}>全部素材</NavLink>
          <Link
            to="/materials"
            className="inline-flex items-center gap-1.5 text-sm text-apple-accent hover:text-apple-accent-hover transition-colors"
          >
            <Search size={14} />
            搜索
          </Link>
        </nav>

        {/* 右侧区 */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden w-11 h-11 rounded-full flex items-center justify-center glass-panel"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="菜单"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-apple-text inline-flex"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden glass-panel border-t border-apple-glass-border"
          >
            <div className="px-5 py-4 flex flex-col gap-4 text-apple-text">
              <NavLink to="/" end className="py-2 text-base">首页</NavLink>
              <NavLink to="/materials" className="py-2 text-base">全部素材</NavLink>
              <Link to="/about" className="py-2 text-base text-apple-text-secondary">关于我</Link>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-sm text-apple-text-secondary">主题</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
