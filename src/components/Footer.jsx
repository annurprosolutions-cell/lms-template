import { useSiteSettings } from '../context/SiteSettingsContext'

export default function Footer() {
  const { footer_org_name } = useSiteSettings()

    return (
        <footer className="bg-gray-900 text-gray-300 mt-16">
              <div className="max-w-6xl mx-auto px-4 py-8 text-sm">
                      <p>{footer_org_name}</p>
                              <p className="mt-1 text-gray-500">
                                        &copy; {new Date().getFullYear()}
                                                </p>
                                                      </div>
                                                          </footer>
                                                            )
                                                            }