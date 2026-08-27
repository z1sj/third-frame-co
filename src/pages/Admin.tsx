import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Unlock, Package, FolderTree, Download, Upload, Trash2, Plus, Save,
  Edit3, X, ChevronDown, ChevronRight, Search, AlertTriangle, CheckCircle, FileJson,
  Camera, Image as ImageIcon, GripVertical, RotateCcw, Eye, Play, Rocket, Loader2, Key,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { ADMIN_PASSWORD, SITE_NAME } from '../config'
import { getToken, setToken, clearToken, uploadJSON, uploadBinaryFile } from '../utils/github'
import type { Material, Category, AppData, MaterialType, SceneType, CameraParams } from '../types'

type Tab = 'materials' | 'categories' | 'export'

// 简化密码比对（生产环境可自行改为 MD5）
function checkPassword(input: string): boolean {
  return input === ADMIN_PASSWORD
}

export default function Admin() {
  const { data, draft, loadDraft, saveDraft, clearDraft, exportDraft, importDraft } = useData()

  // 认证
  const [authed, setAuthed] = useState(() => {
    try { return sessionStorage.getItem('tfc-admin') === '1' } catch { return false }
  })
  const [pwdInput, setPwdInput] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)

  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // 初始化草稿（如果没加载过）
  useEffect(() => { if (!draft) loadDraft() }, [draft, loadDraft])
  const working = draft || data

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 2600)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkPassword(pwdInput)) {
      setAuthed(true)
      try { sessionStorage.setItem('tfc-admin', '1') } catch {}
      setPwdError(null)
    } else {
      setPwdError('密码错误，请重试')
      setShakeKey(k => k + 1)
      setTimeout(() => setPwdError(null), 2000)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-6 bg-apple-bg-secondary">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          key={shakeKey}
          className={pwdError ? 'animate-shake' : ''}
        >
          <form onSubmit={handleLogin} className="glass-panel rounded-lg p-8 w-[360px] max-w-full shadow-card-hover">
            <div className="text-center mb-7">
              <div className="mx-auto w-14 h-14 rounded-full bg-apple-text text-apple-bg flex items-center justify-center mb-4">
                <Lock size={22} />
              </div>
              <h1 className="text-xl font-bold text-apple-text">后台管理</h1>
              <p className="text-sm text-apple-text-secondary mt-1">{SITE_NAME} · 访问验证</p>
            </div>
            <label className="block mb-2 text-xs text-apple-text-tertiary">密码</label>
            <input
              autoFocus
              type="password"
              value={pwdInput}
              onChange={(e) => setPwdInput(e.target.value)}
              placeholder="请输入后台密码"
              className="pill-input mb-5 !text-base"
            />
            <AnimatePresence>
              {pwdError && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500 text-center mb-4 inline-flex items-center gap-1"
                >
                  <AlertTriangle size={12} /> {pwdError}
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" className="btn-primary w-full">
              <Unlock size={16} /> 进入管理面板
            </button>
            <p className="text-[11px] text-apple-text-tertiary text-center mt-5 leading-relaxed">
              密码在 <code className="text-apple-text-secondary bg-apple-bg-secondary px-1.5 py-0.5 rounded">src/config.ts</code> 中修改
            </p>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-apple-bg-secondary">
      {/* 顶栏 */}
      <header className="glass-panel sticky top-0 z-30 border-b border-apple-glass-border">
        <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-apple-text">后台管理面板</h1>
            <span className="text-xs text-apple-text-tertiary hidden sm:inline">
              草稿已保存 · {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { clearDraft(); showToast('ok', '已重置为站点当前数据') }} className="btn-secondary !py-2 !px-3 !text-xs">
              <RotateCcw size={13} /> 重置草稿
            </button>
            <a href="/" target="_blank" className="btn-secondary !py-2 !px-3 !text-xs">
              <Eye size={13} /> 预览站点
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-5 grid md:grid-cols-[220px_1fr] gap-5">
        {/* 左侧导航 */}
        <aside className="glass-panel rounded-lg p-3 h-fit md:sticky md:top-20">
          <TabButton active={activeTab === 'materials'} onClick={() => setActiveTab('materials')}
            icon={<Package size={16} />} label="素材管理" count={working.materials.length} />
          <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}
            icon={<FolderTree size={16} />} label="分类管理" count={countCategories(working.categories)} />
          <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')}
            icon={<FileJson size={16} />} label="导入 / 导出" />
        </aside>

        {/* 主内容 */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'materials' && (
              <MaterialsPanel
                key="mat"
                draft={working}
                onUpdate={(d) => saveDraft({ ...d })}
                onToast={showToast}
              />
            )}
            {activeTab === 'categories' && (
              <CategoriesPanel
                key="cat"
                draft={working}
                onUpdate={(d) => saveDraft({ ...d })}
                onToast={showToast}
              />
            )}
            {activeTab === 'export' && (
              <ExportPanel
                key="exp"
                draft={working}
                onExport={exportDraft}
                onImport={importDraft}
                onToast={showToast}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-5 py-3 rounded-full shadow-card-hover text-sm ${
              toast.type === 'ok'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xsm text-sm transition-all duration-200 mb-1 ${
        active
          ? 'bg-apple-text text-apple-bg font-medium'
          : 'text-apple-text-secondary hover:bg-apple-bg-secondary hover:text-apple-text'
      }`}
    >
      <span>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-apple-bg-elevated text-apple-text-tertiary'
        }`}>{count}</span>
      )}
    </button>
  )
}

function countCategories(cats: Category[]): number {
  let n = 0
  for (const c of cats) {
    n += 1 + countCategories(c.children)
  }
  return n
}

// ================================================================
// 素材管理面板
// ================================================================
function MaterialsPanel({ draft, onUpdate, onToast }: {
  draft: AppData
  onUpdate: (d: AppData) => void
  onToast: (t: 'ok' | 'err', s: string) => void
}) {
  const [q, setQ] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return draft.materials
    return draft.materials.filter(m =>
      m.title.toLowerCase().includes(s) ||
      m.tags.some(t => t.toLowerCase().includes(s)) ||
      m.description.toLowerCase().includes(s)
    )
  }, [draft.materials, q])

  const openNew = () => {
    setEditing({
      id: `m_${Date.now().toString(36)}`,
      title: '',
      type: 'video',
      categoryPath: [],
      resolution: '4K',
      framerate: 25,
      scene: 'any',
      quarkUrl: '',
      coverFile: '',
      description: '',
      tags: [],
      createdAt: new Date().toISOString().slice(0, 10),
      downloads: 0,
      views: 0,
    })
    setEditorOpen(true)
  }

  const openEdit = (m: Material) => {
    setEditing({ ...m, tags: [...(m.tags || [])], camera: m.camera ? { ...m.camera } : undefined })
    setEditorOpen(true)
  }

  const saveEditing = (m: Material) => {
    const idx = draft.materials.findIndex(x => x.id === m.id)
    const mats = idx >= 0
      ? draft.materials.map(x => (x.id === m.id ? m : x))
      : [m, ...draft.materials]
    onUpdate({ ...draft, materials: mats })
    setEditorOpen(false)
    setEditing(null)
    onToast('ok', idx >= 0 ? '已更新素材' : '已新增素材')
  }

  const removeMat = (m: Material) => {
    if (!confirm(`确认删除素材「${m.title}」？`)) return
    onUpdate({ ...draft, materials: draft.materials.filter(x => x.id !== m.id) })
    onToast('ok', '已删除素材')
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-lg p-5 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <h2 className="text-lg font-semibold text-apple-text">素材管理</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索素材..."
              className="pill-input !text-sm pl-9 !py-2 w-[220px]"
            />
          </div>
          <button onClick={openNew} className="btn-primary !py-2 !px-3 !text-sm">
            <Plus size={14} /> 新增素材
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-apple-text-tertiary">
              <th className="text-left py-3 pr-4 w-[28px]"></th>
              <th className="text-left py-3 pr-4">封面</th>
              <th className="text-left py-3 pr-4">标题 / 类型</th>
              <th className="text-left py-3 pr-4">分类路径</th>
              <th className="text-left py-3 pr-4">规格</th>
              <th className="text-left py-3 pr-4">标签</th>
              <th className="text-right py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-apple-text-tertiary">
                  {q ? '没有匹配的素材' : '暂无素材，点击右上角新增'}
                </td>
              </tr>
            ) : filtered.map(m => (
              <tr key={m.id} className="border-t border-apple-border/60 hover:bg-apple-bg-secondary/50 transition-colors">
                <td className="py-3 pr-4"><GripVertical size={14} className="text-apple-text-tertiary" /></td>
                <td className="py-3 pr-4">
                  <div className="w-16 h-10 rounded-xsm bg-apple-bg-secondary overflow-hidden flex items-center justify-center">
                    {m.coverFile ? (
                      <img
                        src={`./covers/${m.coverFile}`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    ) : (
                      m.type === 'video' ? <Play size={14} className="text-apple-text-tertiary" /> : <ImageIcon size={14} className="text-apple-text-tertiary" />
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="font-medium text-apple-text line-clamp-1 max-w-xs">{m.title || '（无标题）'}</div>
                  <div className="text-xs text-apple-text-tertiary mt-0.5">
                    {m.type === 'video' ? `视频 ${m.duration || ''}` : '照片'} · {m.createdAt}
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs text-apple-text-secondary">
                  {m.categoryPath.length > 0 ? m.categoryPath.join(' › ') : <span className="text-apple-text-tertiary">未分类</span>}
                </td>
                <td className="py-3 pr-4 text-xs text-apple-text-secondary">
                  {m.resolution || '-'}{m.framerate ? ` · ${m.framerate}fps` : ''}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {m.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-bg-secondary text-apple-text-secondary">
                        {t}
                      </span>
                    ))}
                    {m.tags.length > 3 && <span className="text-[10px] text-apple-text-tertiary">+{m.tags.length - 3}</span>}
                  </div>
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(m)} className="text-apple-text-secondary hover:text-apple-accent inline-flex items-center gap-1 px-2 py-1 text-xs">
                    <Edit3 size={12} /> 编辑
                  </button>
                  <button onClick={() => removeMat(m)} className="text-apple-text-secondary hover:text-red-500 inline-flex items-center gap-1 px-2 py-1 text-xs ml-2">
                    <Trash2 size={12} /> 删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {editorOpen && editing && (
          <MaterialEditor
            draft={draft}
            material={editing}
            onClose={() => { setEditorOpen(false); setEditing(null) }}
            onSave={saveEditing}
          />
        )}
      </AnimatePresence>
    </motion.section>
  )
}

// ==================== 素材编辑器 ====================
function MaterialEditor({ draft, material, onClose, onSave }: {
  draft: AppData
  material: Material
  onClose: () => void
  onSave: (m: Material) => void
}) {
  const [form, setForm] = useState<Material>(material)
  const [tagInput, setTagInput] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPreview, setUploadingPreview] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!getToken()) { setUploadMsg('请先在「导入/导出」页面设置 GitHub Token'); return }
    setUploadingCover(true)
    setUploadMsg('正在上传封面图...')
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${form.id}_cover.${ext}`
    const result = await uploadBinaryFile(`public/covers/${filename}`, file, `upload: 封面图 ${filename}`, (m) => setUploadMsg(m))
    setUploadingCover(false)
    if (result.ok) {
      update('coverFile', filename)
      setUploadMsg('✅ 封面图上传成功！部署后即可在网站查看')
      setTimeout(() => setUploadMsg(''), 4000)
    } else {
      setUploadMsg(`❌ 上传失败：${result.error}`)
    }
  }

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!getToken()) { setUploadMsg('请先在「导入/导出」页面设置 GitHub Token'); return }
    setUploadingPreview(true)
    setUploadMsg('正在上传预览视频...')
    const ext = file.name.split('.').pop() || 'mp4'
    const filename = `${form.id}_preview.${ext}`
    const result = await uploadBinaryFile(`public/previews/${filename}`, file, `upload: 预览视频 ${filename}`, (m) => setUploadMsg(m))
    setUploadingPreview(false)
    if (result.ok) {
      update('previewFile', filename)
      setUploadMsg('✅ 预览视频上传成功！部署后即可在网站播放')
      setTimeout(() => setUploadMsg(''), 4000)
    } else {
      setUploadMsg(`❌ 上传失败：${result.error}`)
    }
  }

  const update = <K extends keyof Material>(key: K, val: Material[K]) =>
    setForm(f => ({ ...f, [key]: val }))
  const updateCamera = <K extends keyof CameraParams>(key: K, val: CameraParams[K]) =>
    setForm(f => ({ ...f, camera: { ...(f.camera || {}), [key]: val } }))

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t)) return
    update('tags', [...form.tags, t])
    setTagInput('')
  }
  const removeTag = (t: string) => update('tags', form.tags.filter(x => x !== t))

  const pickCategory = (level: 0 | 1 | 2, catId: string) => {
    const next = [...form.categoryPath] as any[]
    next[level] = catId
    // 清空更下级
    next.length = level + 1
    update('categoryPath', next)
  }

  const level0 = draft.categories
  const level1 = level0.find(c => c.id === form.categoryPath[0])?.children || []
  const level2 = level1.find(c => c.id === form.categoryPath[1])?.children || []

  const canSave = form.title.trim().length > 0 && form.quarkUrl.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-apple-bg rounded-lg shadow-card-hover w-full max-w-3xl my-6 max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 glass-panel border-b border-apple-glass-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-apple-text">
            {draft.materials.some(m => m.id === form.id) ? '编辑素材' : '新增素材'}
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-apple-text-secondary hover:bg-apple-bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <Section title="基本信息">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="标题 *">
                <input className="pill-input !text-sm" value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="例如：城市夜景车流 Sony A7C2 S-Log3" />
              </Field>
              <Field label="类型">
                <div className="flex gap-2">
                  {(['video', 'photo'] as MaterialType[]).map(t => (
                    <button key={t}
                      onClick={() => update('type', t)}
                      className={`chip !py-2 px-4 ${form.type === t ? 'active' : ''}`}>
                      {t === 'video' ? <><Camera size={13} className="mr-1" /> 视频</> : <><ImageIcon size={13} className="mr-1" /> 照片</>}
                    </button>
                  ))}
                </div>
              </Field>
              {form.type === 'video' && (
                <Field label="时长（如 00:42）">
                  <input className="pill-input !text-sm" value={form.duration || ''}
                    onChange={(e) => update('duration', e.target.value)} placeholder="00:00" />
                </Field>
              )}
              <Field label="发布日期">
                <input type="date" className="pill-input !text-sm" value={form.createdAt}
                  onChange={(e) => update('createdAt', e.target.value)} />
              </Field>
              <Field label="夸克网盘链接 *">
                <input className="pill-input !text-sm" value={form.quarkUrl}
                  onChange={(e) => update('quarkUrl', e.target.value)}
                  placeholder="https://pan.quark.cn/s/xxxxx" />
              </Field>
              <Field label="百度网盘链接（可选）">
                <input className="pill-input !text-sm" value={form.baiduUrl || ''}
                  onChange={(e) => update('baiduUrl', e.target.value)}
                  placeholder="留空表示不提供" />
              </Field>
            </div>
          </Section>

          {/* 分类 */}
          <Section title="3 级分类选择">
            <div className="grid md:grid-cols-3 gap-3">
              <CatPicker label="一级分类" cats={level0} selected={form.categoryPath[0]} onPick={(id) => pickCategory(0, id)} />
              <CatPicker label="二级分类" cats={level1} selected={form.categoryPath[1]} onPick={(id) => pickCategory(1, id)} disabled={!form.categoryPath[0]} />
              <CatPicker label="三级分类" cats={level2} selected={form.categoryPath[2]} onPick={(id) => pickCategory(2, id)} disabled={!form.categoryPath[1]} />
            </div>
          </Section>

          {/* 规格 */}
          <Section title="规格信息">
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="分辨率">
                <select className="pill-input !text-sm" value={form.resolution || ''}
                  onChange={(e) => update('resolution', e.target.value)}>
                  <option value="">未设置</option>
                  <option value="4K">4K</option>
                  <option value="1080P">1080P</option>
                  <option value="2.7K">2.7K</option>
                  <option value="8K">8K</option>
                </select>
              </Field>
              <Field label="帧率">
                <select className="pill-input !text-sm"
                  value={form.framerate ? String(form.framerate) : ''}
                  onChange={(e) => update('framerate', e.target.value ? Number(e.target.value) : undefined)}>
                  <option value="">未设置</option>
                  {[24, 25, 30, 50, 60, 100, 120].map(f => <option key={f} value={f}>{f} fps</option>)}
                </select>
              </Field>
              <Field label="场景">
                <select className="pill-input !text-sm" value={form.scene || 'any'}
                  onChange={(e) => update('scene', e.target.value as SceneType)}>
                  <option value="any">不限</option>
                  <option value="indoor">室内</option>
                  <option value="outdoor">室外</option>
                </select>
              </Field>
              <Field label="精选显示">
                <label className="flex items-center gap-2 h-[44px] text-sm text-apple-text cursor-pointer select-none">
                  <input type="checkbox" checked={!!form.featured}
                    onChange={(e) => update('featured', e.target.checked)}
                    className="w-4 h-4 accent-apple-accent" />
                  首页精选区展示
                </label>
              </Field>
            </div>
          </Section>

          {/* 预览文件 */}
          <Section title="文件命名（预览图/视频）">
            {uploadMsg && (
              <div className={`text-xs mb-3 px-3 py-2 rounded-xsm ${
                uploadMsg.includes('失败') || uploadMsg.includes('Token')
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {uploadMsg}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="封面文件名 (public/covers/ 下放同名文件)">
                <div className="flex gap-2">
                  <input className="pill-input !text-sm flex-1" value={form.coverFile}
                    onChange={(e) => update('coverFile', e.target.value)}
                    placeholder="m_0001_cover.jpg" />
                  <label className={`btn-secondary !py-2.5 !px-3 !text-sm whitespace-nowrap cursor-pointer ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span className="ml-1">上传封面</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                  </label>
                </div>
              </Field>
              {form.type === 'video' && (
                <Field label="预览视频文件名 (public/previews/)">
                  <div className="flex gap-2">
                    <input className="pill-input !text-sm flex-1" value={form.previewFile || ''}
                      onChange={(e) => update('previewFile', e.target.value)}
                      placeholder="m_0001_preview.mp4" />
                    <label className={`btn-secondary !py-2.5 !px-3 !text-sm whitespace-nowrap cursor-pointer ${uploadingPreview ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingPreview ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span className="ml-1">上传视频</span>
                      <input type="file" accept="video/*" className="hidden" onChange={handlePreviewUpload} disabled={uploadingPreview} />
                    </label>
                  </div>
                </Field>
              )}
            </div>
            <p className="text-[11px] text-apple-text-tertiary mt-2">
              点击上传按钮可直接选择文件上传到 GitHub，文件名会自动填写。需先在「导入/导出」页设置 Token。
            </p>
          </Section>

          {/* 描述 */}
          <Section title="描述与标签">
            <div className="space-y-4">
              <Field label="详细描述">
                <textarea
                  rows={4}
                  className="pill-input !rounded-xsm !text-sm resize-none"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder={"素材的详细介绍，比如拍摄地点、调色建议、使用场景等…"}
                />
              </Field>
              <Field label="标签（回车添加）">
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      className="pill-input !text-sm flex-1"
                      value={tagInput}
                      placeholder="输入标签名按回车添加"
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addTag() }
                      }}
                    />
                    <button onClick={addTag} type="button" className="btn-secondary !py-2.5 !px-4 !text-sm">
                      <Plus size={14} /> 添加
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.tags.length === 0 ? (
                      <span className="text-xs text-apple-text-tertiary">还没有标签</span>
                    ) : form.tags.map(t => (
                      <span key={t} className="chip !py-1 !text-xs active inline-flex items-center gap-1">
                        #{t}
                        <button onClick={() => removeTag(t)} aria-label="删除"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </Field>
            </div>
          </Section>

          {/* 拍摄参数 */}
          <Section title="拍摄参数（全部可选）">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="相机型号"><input className="pill-input !text-sm"
                value={form.camera?.model || ''} onChange={(e) => updateCamera('model', e.target.value)}
                placeholder="Sony A7C2" /></Field>
              <Field label="镜头"><input className="pill-input !text-sm"
                value={form.camera?.lens || ''} onChange={(e) => updateCamera('lens', e.target.value)}
                placeholder="Sony 20-70mm F4" /></Field>
              <Field label="光圈"><input className="pill-input !text-sm"
                value={form.camera?.aperture || ''} onChange={(e) => updateCamera('aperture', e.target.value)}
                placeholder="F4" /></Field>
              <Field label="快门"><input className="pill-input !text-sm"
                value={form.camera?.shutter || ''} onChange={(e) => updateCamera('shutter', e.target.value)}
                placeholder="1/50s" /></Field>
              <Field label="ISO"><input className="pill-input !text-sm"
                value={form.camera?.iso ? String(form.camera.iso) : ''}
                onChange={(e) => updateCamera('iso', isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                placeholder="800" /></Field>
              <Field label="白平衡"><input className="pill-input !text-sm"
                value={form.camera?.whiteBalance || ''} onChange={(e) => updateCamera('whiteBalance', e.target.value)}
                placeholder="5500K" /></Field>
            </div>
          </Section>
        </div>

        {/* 底部操作 */}
        <div className="sticky bottom-0 glass-panel border-t border-apple-glass-border px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary !py-2.5 !px-4 !text-sm">取消</button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            className={`btn-primary !py-2.5 !px-5 !text-sm ${!canSave ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={14} /> 保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-widest text-apple-text-tertiary mb-3">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-apple-text-tertiary mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function CatPicker({ label, cats, selected, onPick, disabled }: {
  label: string; cats: Category[]; selected?: string;
  onPick: (id: string) => void; disabled?: boolean;
}) {
  return (
    <div className={`p-3 rounded-xsm border border-apple-border bg-apple-bg-elevated ${disabled ? 'opacity-50' : ''}`}>
      <div className="text-xs text-apple-text-tertiary mb-2">{label}</div>
      {cats.length === 0 ? (
        <div className="text-xs text-apple-text-tertiary py-4 text-center">— 无选项 —</div>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {cats.map(c => (
            <button
              key={c.id}
              disabled={disabled}
              onClick={() => onPick(c.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                selected === c.id
                  ? 'bg-apple-text text-apple-bg border-apple-text'
                  : 'border-apple-border text-apple-text-secondary hover:text-apple-text'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ================================================================
// 分类管理面板
// ================================================================
function CategoriesPanel({ draft, onUpdate, onToast }: {
  draft: AppData
  onUpdate: (d: AppData) => void
  onToast: (t: 'ok' | 'err', s: string) => void
}) {
  const [expandMap, setExpandMap] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {}
    draft.categories.forEach(c => { o[c.id] = true })
    return o
  })

  const toggle = (id: string) => setExpandMap(m => ({ ...m, [id]: !m[id] }))

  // 3级递归检查深度，防止超过3级
  const getDepthPath = (nodes: Category[], targetId: string, path: number[] = []): number[] | null => {
    for (let i = 0; i < nodes.length; i++) {
      const nextPath = [...path, i]
      if (nodes[i].id === targetId) return nextPath
      if (nodes[i].children?.length) {
        const r = getDepthPath(nodes[i].children, targetId, nextPath)
        if (r) return r
      }
    }
    return null
  }
  const clone = (arr: Category[]): Category[] => JSON.parse(JSON.stringify(arr))

  const addRoot = () => {
    const name = prompt('输入一级分类名称：')?.trim()
    if (!name) return
    const newCat: Category = { id: `cat_${Date.now().toString(36)}`, name, children: [] }
    onUpdate({ ...draft, categories: [...draft.categories, newCat] })
    onToast('ok', `已新增分类「${name}」`)
  }

  const addChild = (parentId: string, currentDepth: number) => {
    if (currentDepth >= 3) { onToast('err', '最多支持 3 级分类'); return }
    const name = prompt('输入子分类名称：')?.trim()
    if (!name) return
    const cats = clone(draft.categories)
    const path = getDepthPath(cats, parentId)
    if (!path) return
    let node: any = cats
    for (let i = 0; i < path.length; i++) node = node[path[i]]
    node.children = node.children || []
    node.children.push({ id: `cat_${Date.now().toString(36)}`, name, children: [] })
    setExpandMap(m => ({ ...m, [parentId]: true }))
    onUpdate({ ...draft, categories: cats })
    onToast('ok', `已新增子分类「${name}」`)
  }

  const rename = (id: string) => {
    const path = getDepthPath(draft.categories, id)
    if (!path) return
    let node: any = draft.categories
    for (const i of path) node = node[i]
    const newName = prompt('修改分类名称：', node.name)?.trim()
    if (!newName) return
    const cats = clone(draft.categories)
    let target: any = cats
    for (const i of path) target = target[i]
    target.name = newName
    onUpdate({ ...draft, categories: cats })
    onToast('ok', '已修改分类名称')
  }

  const remove = (id: string) => {
    const path = getDepthPath(draft.categories, id)
    if (!path) return
    let node: any = draft.categories
    for (const i of path) node = node[i]
    // 统计受影响的素材
    const childIds: string[] = []
    const walk = (n: Category) => { childIds.push(n.id); n.children?.forEach(walk) }
    walk(node)
    const affected = draft.materials.filter(m => m.categoryPath.some(p => childIds.includes(p)))
    if (!confirm(`确认删除分类「${node.name}」及其所有子分类？\n将影响 ${affected.length} 个素材的分类路径。`)) return
    const cats = clone(draft.categories)
    let arr: any = cats
    for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]]
    arr = Array.isArray(arr) ? arr : arr.children
    arr.splice(path[path.length - 1], 1)
    onUpdate({ ...draft, categories: cats })
    onToast('ok', '已删除分类')
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-lg p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-apple-text">分类管理</h2>
          <p className="text-xs text-apple-text-tertiary mt-1">最多支持 3 级分类，可自由增删改。</p>
        </div>
        <button onClick={addRoot} className="btn-primary !py-2 !px-3 !text-sm">
          <Plus size={14} /> 新增一级分类
        </button>
      </div>

      <div className="space-y-2">
        {draft.categories.map((rootCat, i) => (
          <CategoryRow
            key={rootCat.id}
            cat={rootCat}
            level={0}
            index={i}
            expanded={!!expandMap[rootCat.id]}
            onToggle={() => toggle(rootCat.id)}
            onAddChild={() => addChild(rootCat.id, 1)}
            onRename={() => rename(rootCat.id)}
            onRemove={() => remove(rootCat.id)}
            renderChildren={(children) => (
              <div className="space-y-2 mt-2 pl-4 md:pl-10">
                {children.map((c, j) => (
                  <CategoryRow
                    key={c.id}
                    cat={c}
                    level={1}
                    index={j}
                    expanded={expandMap[c.id]}
                    onToggle={() => toggle(c.id)}
                    onAddChild={() => addChild(c.id, 2)}
                    onRename={() => rename(c.id)}
                    onRemove={() => remove(c.id)}
                    renderChildren={(grandChildren) => (
                      <div className="space-y-2 mt-2 pl-4 md:pl-10">
                        {grandChildren.map((gc, k) => (
                          <CategoryRow
                            key={gc.id}
                            cat={gc}
                            level={2}
                            index={k}
                            onRename={() => rename(gc.id)}
                            onRemove={() => remove(gc.id)}
                          />
                        ))}
                      </div>
                    )}
                  />
                ))}
              </div>
            )}
          />
        ))}
      </div>
    </motion.section>
  )
}

function CategoryRow({ cat, level, index, expanded, onToggle, onAddChild, onRename, onRemove, renderChildren }: {
  cat: Category
  level: 0 | 1 | 2
  index: number
  expanded?: boolean
  onToggle?: () => void
  onAddChild?: () => void
  onRename: () => void
  onRemove: () => void
  renderChildren?: (children: Category[]) => React.ReactNode
}) {
  const hasChildren = cat.children && cat.children.length > 0
  const allowAddChild = level < 2
  const indent = level === 0 ? '' : level === 1 ? 'pl-0' : 'pl-0'
  return (
    <div className={indent}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className="group flex items-center gap-3 p-3 rounded-xsm bg-apple-bg-elevated border border-apple-border hover:border-apple-text-tertiary transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren && (
            <button onClick={onToggle}
              className="w-7 h-7 rounded-full flex items-center justify-center text-apple-text-tertiary hover:bg-apple-bg-secondary hover:text-apple-text transition-colors">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {!hasChildren && <span className="w-7" />}
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold ${
            level === 0 ? 'bg-apple-text text-apple-bg' :
            level === 1 ? 'bg-apple-accent text-white' :
            'bg-apple-bg-secondary text-apple-text-secondary border border-apple-border'
          }`}>
            L{level + 1}
          </span>
          <span className="font-medium text-apple-text truncate">{cat.name}</span>
          {cat.children?.length > 0 && (
            <span className="text-xs text-apple-text-tertiary">{cat.children.length} 个子分类</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {allowAddChild && (
            <button onClick={onAddChild}
              className="w-8 h-8 rounded-full flex items-center justify-center text-apple-text-secondary hover:bg-apple-bg-secondary hover:text-apple-accent"
              title="添加子分类">
              <Plus size={14} />
            </button>
          )}
          <button onClick={onRename}
            className="w-8 h-8 rounded-full flex items-center justify-center text-apple-text-secondary hover:bg-apple-bg-secondary hover:text-apple-text"
            title="重命名">
            <Edit3 size={13} />
          </button>
          <button onClick={onRemove}
            className="w-8 h-8 rounded-full flex items-center justify-center text-apple-text-secondary hover:bg-apple-bg-secondary hover:text-red-500"
            title="删除">
            <Trash2 size={13} />
          </button>
        </div>
      </motion.div>
      {expanded && renderChildren && hasChildren && renderChildren(cat.children)}
    </div>
  )
}

// ================================================================
// 导入/导出面板
// ================================================================
function ExportPanel({ draft, onExport, onImport, onToast }: {
  draft: AppData
  onExport: () => string
  onImport: (raw: string) => { ok: boolean; error?: string }
  onToast: (t: 'ok' | 'err', s: string) => void
}) {
  const handleExport = () => {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `materials_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    onToast('ok', 'JSON 已导出到本地')
  }

  const [dragOver, setDragOver] = useState(false)

  // GitHub 部署
  const [tokenInput, setTokenInput] = useState(() => getToken() || '')
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState('')

  const handleDeploy = async () => {
    if (!getToken()) { onToast('err', '请先填写并保存 GitHub Token'); return }
    setDeploying(true)
    setDeployStatus('正在上传 materials.json...')
    const json = onExport()
    const result = await uploadJSON(
      'public/data/materials.json',
      json,
      `deploy: 更新素材数据 ${new Date().toLocaleString('zh-CN')}`,
      (msg) => setDeployStatus(msg)
    )
    setDeploying(false)
    if (result.ok) {
      setDeployStatus('')
      onToast('ok', '部署成功！1-2 分钟后网站自动更新')
    } else {
      onToast('err', result.error || '部署失败')
    }
  }

  const saveToken = () => {
    if (tokenInput.trim()) { setToken(tokenInput.trim()); onToast('ok', 'Token 已保存') }
    else { clearToken(); onToast('ok', 'Token 已清除') }
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = onImport(String(reader.result || ''))
      if (r.ok) onToast('ok', 'JSON 导入成功，草稿已更新')
      else onToast('err', r.error || '导入失败')
    }
    reader.onerror = () => onToast('err', '读取文件失败')
    reader.readAsText(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && /\.json$/i.test(f.name)) readFile(f)
    else onToast('err', '请选择 .json 文件')
  }
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) readFile(f)
    e.target.value = ''
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* 导出 */}
      <div className="glass-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold text-apple-text mb-2 flex items-center gap-2">
          <Download size={18} /> 导出 JSON 数据
        </h2>
        <p className="text-sm text-apple-text-secondary mb-5 leading-relaxed">
          将当前后台草稿中的所有素材、分类、关于页信息打包为 JSON 文件。<br />
          <strong>把下载的 <code className="text-apple-accent bg-apple-bg-secondary px-1.5 py-0.5 rounded text-xs">materials.json</code> 放到项目的 <code className="text-apple-accent bg-apple-bg-secondary px-1.5 py-0.5 rounded text-xs">public/data/</code> 目录，和代码一起上传到 GitHub 即可生效。</strong>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} className="btn-primary">
            <FileJson size={16} /> 下载 materials.json
          </button>
          <span className="text-xs text-apple-text-tertiary">
            当前数据：{draft.materials.length} 素材 · {countCategories(draft.categories)} 分类
          </span>
        </div>
      </div>

      {/* 导入 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`glass-panel rounded-lg p-6 border-2 border-dashed transition-colors ${
          dragOver ? 'border-apple-accent bg-apple-accent/5' : 'border-apple-border'
        }`}
      >
        <h2 className="text-lg font-semibold text-apple-text mb-2 flex items-center gap-2">
          <Upload size={18} /> 导入 JSON 数据
        </h2>
        <p className="text-sm text-apple-text-secondary mb-5">
          从本地 .json 文件恢复草稿，方便下次继续编辑。也可直接上传之前导出的 materials.json。
        </p>
        <label className="block">
          <input type="file" accept=".json" onChange={onPickFile} className="hidden" />
          <div className="inline-flex items-center gap-2 cursor-pointer btn-secondary">
            <Upload size={14} /> 选择 JSON 文件，或直接拖拽到此处
          </div>
        </label>
      </div>

      {/* 文件命名指南 */}
      <div className="glass-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold text-apple-text mb-3">📁 文件放置指南</h2>
        <div className="text-sm text-apple-text-secondary leading-7 space-y-2">
          <p>在后台添加素材时填写的"封面文件名"和"预览视频文件名"，对应要在下面位置放同名文件：</p>
<pre className="text-xs mt-3 p-4 rounded-xsm bg-apple-bg-elevated border border-apple-border overflow-x-auto"><code>{`public/
├── data/
│   └── materials.json       ← 导出的 JSON 放这里
├── covers/
│   ├── m_0001_cover.jpg     ← 素材封面图（必填，任意比例都会裁成 16:9）
│   ├── m_0002_cover.jpg
│   └── ...
├── previews/
│   ├── m_0001_preview.mp4   ← 视频预览小样（仅视频，照片留空）
│   └── ...
├── hero/
│   ├── hero_1.jpg           ← 首页 Hero 大图（至少 2560×1440）
│   ├── hero_2.jpg
│   └── ...
└── about/
    └── avatar.jpg           ← 关于页头像（可选）`}</code></pre>
          <p className="mt-3 text-apple-text-tertiary text-xs leading-6">
            压缩建议：封面 JPG 长边 1920px，质量 80；预览视频建议压缩到 720P / 1-3 Mbps，时长和原片一致或剪 5-10 秒短预览。
          </p>
        </div>
      </div>

      {/* GitHub 一键部署 */}
      <div className="glass-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold text-apple-text mb-2 flex items-center gap-2">
          <Rocket size={18} /> 一键部署到网站
        </h2>
        <p className="text-sm text-apple-text-secondary mb-5 leading-relaxed">
          填写 GitHub Token 后，点击部署即可将当前素材数据直接上传到 GitHub，触发自动构建。<br />
          <strong>无需手动导出 JSON、无需终端操作</strong>，1-2 分钟后网站自动更新。
        </p>

        {/* Token 设置 */}
        <div className="mb-5">
          <label className="block text-xs text-apple-text-tertiary mb-1.5">
            <Key size={11} className="inline mr-1" /> GitHub Personal Access Token
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="pill-input !text-sm flex-1"
            />
            <button onClick={saveToken} className="btn-secondary !py-2.5 !px-4 !text-sm whitespace-nowrap">
              保存 Token
            </button>
          </div>
          <p className="text-[11px] text-apple-text-tertiary mt-2">
            Token 仅保存在本机浏览器中，不会上传到任何服务器。
            <a href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Third+Frame+Deploy"
              target="_blank" rel="noreferrer" className="text-apple-accent hover:underline ml-1">
              点击生成新 Token
            </a>
          </p>
        </div>

        {/* 部署按钮 */}
        <button
          onClick={handleDeploy}
          disabled={deploying || !getToken()}
          className={`btn-primary ${(!getToken() || deploying) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {deploying ? (
            <><Loader2 size={16} className="animate-spin" /> {deployStatus || '部署中...'}</>
          ) : (
            <><Rocket size={16} /> 部署到网站</>
          )}
        </button>

        <div className="mt-4 text-xs text-apple-text-tertiary">
          <p>当前数据：{draft.materials.length} 素材 · {countCategories(draft.categories)} 分类</p>
          <p>仓库：z1sj/third-frame-co · 部署后 GitHub Actions 会自动构建</p>
        </div>
      </div>
    </motion.section>
  )
}
