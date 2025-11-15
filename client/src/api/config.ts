import axios from 'axios'

const configApi = axios.create({
  baseURL: '/api/config',
  timeout: 10000
})

export interface ContactConfig {
  email?: string
  phone?: string
  wechat?: string
  twitter?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
  enabled_methods?: string
}

// Get contact configuration (public endpoint)
export const getContactConfig = () => {
  return configApi.get<ContactConfig>('/contact')
}
