<template>
  <div class="profile-setup-view">
    <div class="setup-container">
      <h1 class="title">{{ t('profile.setup') }}</h1>

      <div class="setup-form">
        <div class="avatar-section">
          <div class="avatar-preview" @click="triggerFileInput">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" />
            <div v-else class="avatar-placeholder">
              <span>📷</span>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileChange"
          />
          <p class="optional-label">{{ t('profile.optional') }}</p>
        </div>

        <div class="input-group">
          <label>{{ t('profile.username') }} <span class="required">*</span></label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="Enter your name"
          />
        </div>

        <div class="input-group">
          <label>{{ t('profile.primaryLanguage') }} <span class="required">*</span></label>
          <select v-model="formData.primaryLanguage">
            <option value="">Select language</option>
            <option value="en">{{ t('languages.en') }}</option>
            <option value="zh">{{ t('languages.zh') }}</option>
            <option value="es">{{ t('languages.es') }}</option>
            <option value="fr">{{ t('languages.fr') }}</option>
            <option value="de">{{ t('languages.de') }}</option>
            <option value="ja">{{ t('languages.ja') }}</option>
            <option value="ko">{{ t('languages.ko') }}</option>
          </select>
        </div>

        <div class="input-group">
          <label>{{ t('profile.secondaryLanguage') }}</label>
          <select v-model="formData.secondaryLanguage">
            <option value="">Select language</option>
            <option value="en">{{ t('languages.en') }}</option>
            <option value="zh">{{ t('languages.zh') }}</option>
            <option value="es">{{ t('languages.es') }}</option>
            <option value="fr">{{ t('languages.fr') }}</option>
            <option value="de">{{ t('languages.de') }}</option>
            <option value="ja">{{ t('languages.ja') }}</option>
            <option value="ko">{{ t('languages.ko') }}</option>
          </select>
          <p class="optional-label">{{ t('profile.optional') }}</p>
        </div>

        <button class="start-btn" @click="handleStart" :disabled="loading || !isValid">
          {{ loading ? t('common.loading') : t('profile.start') }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { updateProfile, uploadAvatar } from '@/api/user'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const fileInput = ref<HTMLInputElement>()
const avatarUrl = ref('')
const avatarFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')

const formData = ref({
  username: '',
  primaryLanguage: 'en',
  secondaryLanguage: ''
})

const isValid = computed(() => {
  return formData.value.username.trim() && formData.value.primaryLanguage
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    avatarFile.value = file
    avatarUrl.value = URL.createObjectURL(file)
  }
}

const handleStart = async () => {
  if (!isValid.value) return

  loading.value = true
  error.value = ''

  try {
    let avatar = ''

    if (avatarFile.value) {
      const uploadResponse = await uploadAvatar(avatarFile.value)
      avatar = uploadResponse.data.url
    }

    await updateProfile({
      ...formData.value,
      avatar
    })

    userStore.setUser({
      ...userStore.user!,
      ...formData.value,
      avatar
    })

    router.push('/main')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-setup-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-light);
  padding: 20px;
}

.setup-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-dark);
  text-align: center;
  margin-bottom: 30px;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid var(--border-color);
  transition: border-color 0.3s;
}

.avatar-preview:hover {
  border-color: var(--primary-color);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dark);
}

.required {
  color: var(--error-color);
}

.input-group input,
.input-group select {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background: white;
}

.input-group input:focus,
.input-group select:focus {
  border-color: var(--primary-color);
}

.optional-label {
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
}

.start-btn {
  margin-top: 10px;
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn:not(:disabled):hover {
  opacity: 0.9;
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 480px) {
  .setup-container {
    padding: 30px 20px;
  }

  .title {
    font-size: 1.5rem;
  }
}
</style>
