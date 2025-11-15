<template>
  <div class="admin-config">
    <h1>系统配置</h1>

    <div class="config-section">
      <h2>联系方式设置</h2>

      <div class="form-group">
        <label>联系邮箱</label>
        <input v-model="config.email" type="email" class="form-input" placeholder="contact@chiavow.com" />
      </div>

      <div class="form-group">
        <label>联系电话</label>
        <input v-model="config.phone" type="text" class="form-input" placeholder="+1 234 567 8900" />
      </div>

      <div class="form-group">
        <label>微信号</label>
        <input v-model="config.wechat" type="text" class="form-input" placeholder="chiavow_official" />
      </div>

      <div class="form-group">
        <label>Twitter链接</label>
        <input v-model="config.twitter" type="url" class="form-input" placeholder="https://twitter.com/chiavow" />
      </div>

      <div class="form-group">
        <label>Facebook链接</label>
        <input v-model="config.facebook" type="url" class="form-input" placeholder="https://facebook.com/chiavow" />
      </div>

      <div class="form-group">
        <label>Instagram链接</label>
        <input v-model="config.instagram" type="url" class="form-input" placeholder="https://instagram.com/chiavow" />
      </div>

      <div class="form-group">
        <label>WhatsApp链接</label>
        <input v-model="config.whatsapp" type="url" class="form-input" placeholder="https://wa.me/1234567890" />
      </div>

      <div class="form-group">
        <label>启用的联系方式</label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" value="email" v-model="enabledMethods" />
            邮箱
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="phone" v-model="enabledMethods" />
            电话
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="wechat" v-model="enabledMethods" />
            微信
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="twitter" v-model="enabledMethods" />
            Twitter
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="facebook" v-model="enabledMethods" />
            Facebook
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="instagram" v-model="enabledMethods" />
            Instagram
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="whatsapp" v-model="enabledMethods" />
            WhatsApp
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveConfig" class="btn btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getContactConfig, updateContactConfig, type ContactConfig } from '@/api/admin'

const config = ref<ContactConfig>({
  email: '',
  phone: '',
  wechat: '',
  twitter: '',
  facebook: '',
  instagram: '',
  whatsapp: '',
  enabled_methods: ''
})

const enabledMethods = ref<string[]>([])
const saving = ref(false)

const fetchConfig = async () => {
  try {
    const response = await getContactConfig()
    config.value = response.data

    // Parse enabled methods
    if (config.value.enabled_methods) {
      enabledMethods.value = config.value.enabled_methods.split(',').map(m => m.trim())
    }
  } catch (error) {
    console.error('Failed to fetch config:', error)
    alert('获取配置失败')
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    // Update enabled methods
    config.value.enabled_methods = enabledMethods.value.join(',')

    await updateContactConfig(config.value)
    alert('配置保存成功！')
  } catch (error) {
    console.error('Failed to save config:', error)
    alert('保存配置失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<style scoped>
.admin-config {
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #34495e;
}

.config-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
