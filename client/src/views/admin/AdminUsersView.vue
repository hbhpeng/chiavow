<template>
  <div class="admin-users">
    <div class="page-header">
      <h1 class="page-title">{{ $t('admin.users.title') }}</h1>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('admin.users.searchPlaceholder')"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>

    <div v-else class="users-content">
      <!-- Users Table -->
      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>{{ $t('admin.users.id') }}</th>
              <th>{{ $t('admin.users.email') }}</th>
              <th>{{ $t('admin.users.username') }}</th>
              <th>{{ $t('admin.users.languages') }}</th>
              <th>明文密码</th>
              <th>{{ $t('admin.users.ordersCount') }}</th>
              <th>{{ $t('admin.users.createdAt') }}</th>
              <th>{{ $t('admin.users.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td class="user-id">{{ user.id.substring(0, 8) }}...</td>
              <td>{{ user.email }}</td>
              <td>{{ user.username || '-' }}</td>
              <td>
                <span v-if="user.primaryLanguage" class="language-tag">
                  {{ $t(`languages.${user.primaryLanguage}`) }}
                </span>
                <span v-if="user.secondaryLanguage" class="language-tag secondary">
                  {{ $t(`languages.${user.secondaryLanguage}`) }}
                </span>
              </td>
              <td class="password-field">
                <span v-if="user.plainPassword">{{ user.plainPassword }}</span>
                <span v-else class="no-password">-</span>
              </td>
              <td class="text-center">{{ user.ordersCount || 0 }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="viewUser(user)" class="action-btn view-btn">
                    {{ $t('common.edit') }}
                  </button>
                  <button @click="showPasswordModal(user)" class="action-btn password-btn">
                    修改密码
                  </button>
                  <button @click="confirmDeleteUser(user)" class="action-btn delete-btn">
                    {{ $t('common.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="users.length === 0" class="empty-state">
          {{ $t('admin.users.noUsers') }}
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          {{ $t('admin.pagination.previous') }}
        </button>
        <span class="pagination-info">
          {{ $t('admin.pagination.page') }} {{ currentPage }} {{ $t('admin.pagination.of') }} {{ totalPages }}
        </span>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          {{ $t('admin.pagination.next') }}
        </button>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="selectedUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ $t('admin.users.editUser') }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('admin.users.email') }}</label>
            <input v-model="editForm.email" type="email" class="form-input" disabled />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.users.username') }}</label>
            <input v-model="editForm.username" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.users.primaryLanguage') }}</label>
            <select v-model="editForm.primaryLanguage" class="form-input">
              <option value="">{{ $t('profile.selectLanguage') }}</option>
              <option v-for="lang in languages" :key="lang" :value="lang">
                {{ $t(`languages.${lang}`) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.users.secondaryLanguage') }}</label>
            <select v-model="editForm.secondaryLanguage" class="form-input">
              <option value="">{{ $t('profile.selectLanguage') }}</option>
              <option v-for="lang in languages" :key="lang" :value="lang">
                {{ $t(`languages.${lang}`) }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button @click="saveUser" class="btn btn-primary" :disabled="saving">
            {{ saving ? $t('common.loading') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <div v-if="passwordModalUser" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal">
        <div class="modal-header">
          <h2>修改密码 - {{ passwordModalUser.email }}</h2>
          <button @click="closePasswordModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>新密码</label>
            <input
              v-model="newPassword"
              type="text"
              class="form-input"
              placeholder="请输入新密码"
            />
          </div>
          <p class="password-hint">密码将以明文形式保存，请谨慎设置</p>
        </div>
        <div class="modal-footer">
          <button @click="closePasswordModal" class="btn btn-secondary">
            取消
          </button>
          <button @click="updatePassword" class="btn btn-primary" :disabled="updatingPassword || !newPassword">
            {{ updatingPassword ? '更新中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUsers, updateUser, deleteUser, updateUserPassword } from '@/api/admin'
import type { User } from '@/api/admin'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const users = ref<User[]>([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

const selectedUser = ref<User | null>(null)
const editForm = ref({
  email: '',
  username: '',
  primaryLanguage: '',
  secondaryLanguage: ''
})
const saving = ref(false)

// Password modal state
const passwordModalUser = ref<User | null>(null)
const newPassword = ref('')
const updatingPassword = ref(false)

const languages = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko']

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await getUsers(currentPage.value, pageSize, searchQuery.value)
    users.value = response.data.data
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

const viewUser = (user: User) => {
  selectedUser.value = user
  editForm.value = {
    email: user.email,
    username: user.username || '',
    primaryLanguage: user.primaryLanguage || '',
    secondaryLanguage: user.secondaryLanguage || ''
  }
}

const closeModal = () => {
  selectedUser.value = null
}

const saveUser = async () => {
  if (!selectedUser.value) return

  saving.value = true
  try {
    await updateUser(selectedUser.value.id, {
      username: editForm.value.username,
      primaryLanguage: editForm.value.primaryLanguage,
      secondaryLanguage: editForm.value.secondaryLanguage
    })
    closeModal()
    fetchUsers()
  } catch (error) {
    console.error('Failed to update user:', error)
    alert('Failed to update user')
  } finally {
    saving.value = false
  }
}

const showPasswordModal = (user: User) => {
  passwordModalUser.value = user
  newPassword.value = ''
}

const closePasswordModal = () => {
  passwordModalUser.value = null
  newPassword.value = ''
}

const updatePassword = async () => {
  if (!passwordModalUser.value || !newPassword.value) return

  updatingPassword.value = true
  try {
    await updateUserPassword(passwordModalUser.value.id, newPassword.value)
    alert('密码修改成功！')
    closePasswordModal()
    fetchUsers()
  } catch (error) {
    console.error('Failed to update password:', error)
    alert('密码修改失败')
  } finally {
    updatingPassword.value = false
  }
}

const confirmDeleteUser = async (user: User) => {
  if (confirm(t('admin.users.confirmDelete', { email: user.email }))) {
    try {
      await deleteUser(user.id)
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert(t('admin.users.deleteFailed'))
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-users {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.user-id {
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
}

.text-center {
  text-align: center;
}

.language-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
}

.language-tag.secondary {
  background: #999;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s;
}

.view-btn {
  background: #667eea;
  color: white;
}

.view-btn:hover {
  background: #5568d3;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.password-btn {
  background: #28a745;
  color: white;
}

.password-btn:hover {
  background: #218838;
}

.password-field {
  font-family: monospace;
  font-size: 0.9rem;
  color: #495057;
}

.no-password {
  color: #999;
}

.password-hint {
  font-size: 0.875rem;
  color: #dc3545;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-weight: 500;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .admin-users {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .users-table {
    font-size: 0.875rem;
  }

  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
