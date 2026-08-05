import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const DEFAULTS = {
  site_name: 'LMS Demo',
    logo_url: '',
      hero_title: 'Tajuk Utama Anda Di Sini',
        hero_subtitle: 'Belajar sendiri, dimana-mana, bila-bila masa.',
          footer_org_name: 'Nama Organisasi Anda',
          }

          const SiteSettingsContext = createContext({ ...DEFAULTS, loading: true, reload: () => {} })

          export function SiteSettingsProvider({ children }) {
            const [settings, setSettings] = useState(DEFAULTS)
              const [loading, setLoading] = useState(true)

                async function load() {
                    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single()
                        if (data) setSettings({ ...DEFAULTS, ...data })
                            setLoading(false)
                              }

                                useEffect(() => {
                                    load()
                                      }, [])

                                        return (
                                            <SiteSettingsContext.Provider value={{ ...settings, loading, reload: load }}>
                                                  {children}
                                                      </SiteSettingsContext.Provider>
                                                        )
                                                        }

                                                        export function useSiteSettings() {
                                                          return useContext(SiteSettingsContext)
                                                          }