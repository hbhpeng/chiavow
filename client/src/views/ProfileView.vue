<template>
  <div class="profile-view">
    <div class="header">
      <h1 class="title">{{ t('tabs.profile') }}</h1>
      <button
        type="button"
        class="edit-toggle-btn"
        @click="toggleEditMode"
      >
        {{ isEditing ? t('common.cancel') : t('common.edit') }}
      </button>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar">
            <img v-if="editForm.avatar || user?.avatar" :src="getAvatarUrl(editForm.avatar || user?.avatar)" alt="Avatar" />
            <div v-else class="avatar-placeholder">
              {{ editForm.username?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?' }}
            </div>
          </div>
          <input
            v-if="isEditing"
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileSelect"
          />
          <button
            v-if="isEditing"
            type="button"
            class="change-avatar-btn"
            @click="triggerFileInput"
          >
            {{ t('profile.changeAvatar') }}
          </button>
        </div>

        <div class="info-section">
          <!-- Username -->
          <div class="info-item">
            <span class="label">{{ t('profile.username') }}</span>
            <input
              v-if="isEditing"
              v-model="editForm.username"
              type="text"
              class="edit-input"
              :placeholder="t('profile.username')"
            />
            <span v-else class="value">{{ user?.username || '-' }}</span>
          </div>

          <!-- Email (read-only) -->
          <div class="info-item">
            <span class="label">{{ t('auth.email') }}</span>
            <span class="value">{{ user?.email || '-' }}</span>
          </div>

          <!-- Primary Language -->
          <div class="info-item">
            <span class="label">{{ t('profile.primaryLanguage') }}</span>
            <select
              v-if="isEditing"
              v-model="editForm.primaryLanguage"
              class="edit-select"
            >
              <option value="">{{ t('profile.selectLanguage') }}</option>
              <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                {{ t(`languages.${lang}`) }}
              </option>
            </select>
            <span v-else class="value">
              {{ user?.primaryLanguage ? t(`languages.${user.primaryLanguage}`) : '-' }}
            </span>
          </div>

          <!-- Secondary Language -->
          <div class="info-item">
            <span class="label">{{ t('profile.secondaryLanguage') }} ({{ t('profile.optional') }})</span>
            <select
              v-if="isEditing"
              v-model="editForm.secondaryLanguage"
              class="edit-select"
            >
              <option value="">{{ t('profile.selectLanguage') }}</option>
              <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                {{ t(`languages.${lang}`) }}
              </option>
            </select>
            <span v-else class="value">
              {{ user?.secondaryLanguage ? t(`languages.${user.secondaryLanguage}`) : '-' }}
            </span>
          </div>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

        <button
          v-if="isEditing"
          type="button"
          class="save-btn"
          @click="handleSave"
          :disabled="saving"
        >
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>

        <button type="button" class="logout-btn" @click="handleLogout">
          {{ t('profile.logout') }}
        </button>
      </div>

      <div class="language-switcher">
        <h3>{{ t('profile.appLanguage') }}</h3>
        <div class="language-buttons">
          <button
            type="button"
            class="lang-btn"
            :class="{ active: locale === 'en' }"
            @click="switchLanguage('en')"
          >
            English
          </button>
          <button
            type="button"
            class="lang-btn"
            :class="{ active: locale === 'zh' }"
            @click="switchLanguage('zh')"
          >
            中文
          </button>
        </div>
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

const { t, locale } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)

const isEditing = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const availableLanguages = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko']

const editForm = ref({
  username: '',
  primaryLanguage: '',
  secondaryLanguage: '',
  avatar: ''
})

const fileInput = ref<HTMLInputElement | null>(null)

// Helper function to get full avatar URL
const getAvatarUrl = (avatar: string | undefined) => {
  if (!avatar) return ''
  // If it's already a full URL, return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar
  }
  // If it's a relative path, prepend the API server URL
  return `http://localhost:3001${avatar}`
}

const toggleEditMode = () => {
  if (isEditing.value) {
    // Cancel editing
    isEditing.value = false
    error.value = ''
    successMessage.value = ''
  } else {
    // Enter edit mode, populate form with current values
    editForm.value = {
      username: user.value?.username || '',
      primaryLanguage: user.value?.primaryLanguage || '',
      secondaryLanguage: user.value?.secondaryLanguage || '',
      avatar: user.value?.avatar || ''
    }
    isEditing.value = true
    error.value = ''
    successMessage.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      error.value = t('profile.invalidImageType')
      return
    }

    // 验证文件大小 (限制为 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      error.value = t('profile.imageTooLarge')
      return
    }

    // 上传文件到服务器
    try {
      error.value = ''
      const response = await uploadAvatar(file)
      editForm.value.avatar = response.data.url
    } catch (err: any) {
      error.value = err.response?.data?.message || t('profile.imageUploadError')
    }
  }
}

const handleSave = async () => {
  error.value = ''
  successMessage.value = ''

  if (!editForm.value.username) {
    error.value = t('profile.usernameRequired')
    return
  }

  saving.value = true

  try {
    const updateData: any = {
      username: editForm.value.username
    }

    if (editForm.value.primaryLanguage) {
      updateData.primaryLanguage = editForm.value.primaryLanguage
    }

    if (editForm.value.secondaryLanguage) {
      updateData.secondaryLanguage = editForm.value.secondaryLanguage
    }

    if (editForm.value.avatar) {
      updateData.avatar = editForm.value.avatar
    }

    const response = await updateProfile(updateData)

    // Update user store with new data
    userStore.setUser(response.data)

    successMessage.value = t('profile.updateSuccess')
    isEditing.value = false

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || t('profile.updateFailed')
  } finally {
    saving.value = false
  }
}

const switchLanguage = (lang: string) => {
  locale.value = lang
}

const handleLogout = () => {
  if (confirm(t('profile.confirmLogout'))) {
    userStore.logout()
    router.push('/')
  }
}
</script>

<style scoped>
.profile-view {
  min-height: 100%;
  background: var(--bg-light);
}

.header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-dark);
}

.edit-toggle-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.edit-toggle-btn:hover {
  opacity: 0.9;
}

.profile-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.change-avatar-btn {
  padding: 8px 16px;
  background: var(--bg-light);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.3s;
}

.change-avatar-btn:hover {
  background: var(--border-color);
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--primary-color);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-item .label {
  font-size: 0.85rem;
  color: #999;
  font-weight: 500;
}

.info-item .value {
  font-size: 1rem;
  color: var(--text-dark);
  font-weight: 600;
}

.edit-input,
.edit-select {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text-dark);
  background: white;
  transition: border-color 0.3s;
}

.edit-input:focus,
.edit-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.edit-select {
  cursor: pointer;
}

.error-message {
  padding: 12px;
  background: #fee;
  color: var(--error-color);
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  padding: 12px;
  background: #efe;
  color: #2a6f2a;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.save-btn {
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-btn {
  padding: 12px;
  background: var(--error-color);
  color: white;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.logout-btn:hover {
  opacity: 0.9;
}

.language-switcher {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.language-switcher h3 {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 15px;
}

.language-buttons {
  display: flex;
  gap: 10px;
}

.lang-btn {
  flex: 1;
  padding: 12px;
  background: var(--bg-light);
  color: var(--text-dark);
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s;
}

.lang-btn.active {
  background: var(--primary-color);
  color: white;
}

.lang-btn:not(.active):hover {
  background: var(--border-color);
}
</style>
