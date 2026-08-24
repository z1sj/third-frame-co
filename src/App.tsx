import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Materials from './pages/Materials'
import MaterialDetail from './pages/MaterialDetail'
import About from './pages/About'
import Admin from './pages/Admin'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ThemeToggle } from './components/ThemeToggle'

function AnimatedRoutes() {
  const location = useLocation()
  // 后台页面独立布局，不套 Header/Footer
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname.split('/')[1]}>
        <Route path="/" element={
          <WithLayout><Home /></WithLayout>
        } />
        <Route path="/materials" element={
          <WithLayout><Materials /></WithLayout>
        } />
        <Route path="/material/:id" element={
          <WithLayout><MaterialDetail /></WithLayout>
        } />
        <Route path="/about" element={
          <WithLayout><About /></WithLayout>
        } />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

function WithLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* 全站浮动主题切换（移动端在 Header 菜单里有） */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <ThemeToggle />
      </div>
      <div className="hidden md:block fixed top-20 right-6 z-40">
        <ThemeToggle />
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <WithLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-[120px] leading-none font-bold text-apple-text/10 select-none mb-6">404</div>
          <h2 className="text-2xl font-bold text-apple-text mb-3">页面不存在</h2>
          <p className="text-apple-text-secondary mb-8">你访问的链接可能已过期或输入有误。</p>
          <a href="#/" className="btn-primary">返回首页</a>
        </div>
      </div>
    </WithLayout>
  )
}

export default function App() {
  // 滚动条到顶：路由变化
  const loc = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [loc.pathname, loc.search])

  // 初始化占位全局状态（触发首屏数据加载水合）
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 0); return () => clearTimeout(t) }, [])

  if (!ready) {
    // 极简首屏占位（防白屏闪烁）
    return <div className="min-h-[100svh] bg-apple-bg" />
  }
  return <AnimatedRoutes />
}
