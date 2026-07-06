import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import en from '../locales/en.json'
import lt from '../locales/lt.json'

export type Language = 'en' | 'lt'

// Nested dictionary shape — plain objects bottoming out in strings, matching
// the JSON files in src/locales/.
type Dict = { [key: string]: string | Dict }

const dictionaries: Record<Language, Dict> = { en, lt }

const STORAGE_KEY = 'language'

function getNested(dict: Dict, path: string): string | undefined {
  const value = path.split('.').reduce<string | Dict | undefined>(
    (node, segment) => (node && typeof node === 'object' ? node[segment] : undefined),
    dict
  )
  return typeof value === 'string' ? value : undefined
}

function readInitialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'lt' ? 'lt' : 'en'
}

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const raw = getNested(dictionaries[language], key) ?? getNested(dictionaries.en, key) ?? key
      if (!vars) return raw
      return raw.replace(/\{(\w+)\}/g, (_match, name: string) =>
        vars[name] !== undefined ? String(vars[name]) : `{${name}}`
      )
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider')
  return ctx
}
