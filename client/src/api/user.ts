import api from '@/utils/axios'

export interface UpdateProfileRequest {
  username: string
  primaryLanguage: string
  secondaryLanguage?: string
  avatar?: string
}

export const updateProfile = (data: UpdateProfileRequest) => {
  return api.put('/user/profile', data)
}

export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.post<{ url: string }>('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
