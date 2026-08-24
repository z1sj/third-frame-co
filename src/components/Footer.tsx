import { Link } from 'react-router-dom'
import { Film, Github } from 'lucide-react'
import { SITE_NAME, SITE_NAME_CN } from '../config'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-apple-border mt-24">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* 品牌 */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <span className="w-8 h-8 rounded-xsm bg-apple-text text-apple-bg flex items-center justify-center">
                <Film size={18} strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[17px] font-bold tracking-tight text-apple-text">{SITE_NAME}</span>
                <span className="text-[10px] text-apple-text-tertiary tracking-wider">{SITE_NAME_CN}</span>
              </span>
            </Link>
            <p className="text-sm text-apple-text-secondary leading-relaxed max-w-xs">
              免费可商用视频素材与照片素材库，专注 Log 灰片调色练习。
            </p>
          </div>

          {/* 导航 */}
          <div>
            <h4 className="text-sm font-semibold text-apple-text mb-4">导航</h4>
            <ul className="space-y-2.5 text-sm text-apple-text-secondary">
              <li><Link to="/" className="hover:text-apple-text transition-colors">首页</Link></li>
              <li><Link to="/materials" className="hover:text-apple-text transition-colors">全部素材</Link></li>
              <li><Link to="/about" className="hover:text-apple-text transition-colors">关于我</Link></li>
              <li><Link to="/admin" className="hover:text-apple-text transition-colors">管理入口</Link></li>
            </ul>
          </div>

          {/* 资源 */}
          <div>
            <h4 className="text-sm font-semibold text-apple-text mb-4">资源</h4>
            <ul className="space-y-2.5 text-sm text-apple-text-secondary">
              <li>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-apple-text transition-colors"
                >
                  <Github size={14} /> 部署在 GitHub Pages
                </a>
              </li>
              <li>
                <a
                  href="https://pan.quark.cn/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-apple-text transition-colors"
                >
                  夸克网盘 · 主存储
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权行 */}
        <div className="mt-12 pt-6 border-t border-apple-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-apple-text-tertiary">
          <p>© {year} {SITE_NAME} · All footage shot by the author.</p>
          <p>所有素材 <span className="text-apple-text-secondary">免费可商用</span> · No attribution required</p>
        </div>
      </div>
    </footer>
  )
}
