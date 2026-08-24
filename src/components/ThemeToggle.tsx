import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="glass-panel w-11 h-11 rounded-full flex items-center justify-center z-50"
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="inline-flex text-apple-text"
        >
          {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
