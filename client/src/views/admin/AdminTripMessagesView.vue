<template>
  <div class="admin-trip-messages">
    <div class="page-header">
      <h1 class="page-title">{{ $t('admin.tripMessages.title') }}</h1>
    </div>

    <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>

    <div v-else class="messages-content">
      <!-- Messages List -->
      <div v-if="messages.length === 0" class="empty-state">
        {{ $t('admin.tripMessages.noMessages') }}
      </div>

      <div v-else class="messages-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-card"
          :class="{ 'message-pending': message.status === 'pending' }"
        >
          <div class="message-header">
            <div class="message-info">
              <span class="message-user">{{ message.username || message.email }}</span>
              <span class="message-date">{{ formatDateTime(message.createdAt) }}</span>
            </div>
            <div class="message-actions">
              <select
                v-model="message.status"
                @change="updateStatus(message.id, message.status)"
                class="status-select"
              >
                <option value="pending">{{ $t('admin.tripMessages.status.pending') }}</option>
                <option value="replied">{{ $t('admin.tripMessages.status.replied') }}</option>
                <option value="closed">{{ $t('admin.tripMessages.status.closed') }}</option>
              </select>
              <button @click="confirmDeleteMessage(message)" class="delete-btn">
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>

          <div class="message-content">
            <p>{{ message.message }}</p>
          </div>

          <!-- Replies Section -->
          <div v-if="message.replies && message.replies.length > 0" class="replies-section">
            <h4>{{ $t('admin.tripMessages.conversation') }}</h4>
            <div
              v-for="reply in message.replies"
              :key="reply.id"
              class="reply-item"
              :class="{ 'admin-reply': reply.isAdmin }"
            >
              <div class="reply-header">
                <span class="reply-author">
                  {{ reply.isAdmin ? $t('admin.tripMessages.admin') : (reply.username || reply.email) }}
                </span>
                <span class="reply-date">{{ formatDateTime(reply.createdAt) }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>

          <!-- Admin Reply Form -->
          <div class="reply-form">
            <textarea
              v-model="replyContents[message.id]"
              :placeholder="$t('admin.tripMessages.replyPlaceholder')"
              rows="3"
              class="reply-textarea"
            ></textarea>
            <button
              class="reply-btn"
              @click="handleReply(message.id)"
              :disabled="!replyContents[message.id]?.trim() || replyingTo === message.id"
            >
              {{ replyingTo === message.id ? $t('common.loading') : $t('admin.tripMessages.sendReply') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="messageToDelete" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ $t('common.confirm') }}</h2>
          <button @click="cancelDelete" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ $t('admin.tripMessages.confirmDelete', { email: messageToDelete.email || messageToDelete.username }) }}</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelDelete" class="cancel-btn">{{ $t('common.cancel') }}</button>
          <button @click="deleteMessage" class="confirm-delete-btn">{{ $t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getTripMessages,
  replyToTripMessage,
  updateTripMessageStatus,
  deleteTripMessage,
  markTripMessageAsRead,
  type TripMessage
} from '@/api/admin'

const { t } = useI18n()

const messages = ref<TripMessage[]>([])
const loading = ref(false)
const replyContents = ref<Record<string, string>>({})
const replyingTo = ref<string | null>(null)
const messageToDelete = ref<TripMessage | null>(null)

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchMessages = async () => {
  loading.value = true
  try {
    const response = await getTripMessages()
    messages.value = response.data

    // Mark unread messages as read
    for (const message of messages.value) {
      if (!message.adminRead) {
        try {
          await markTripMessageAsRead(message.id)
        } catch (error) {
          console.error('Failed to mark message as read:', error)
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  } finally {
    loading.value = false
  }
}

const handleReply = async (messageId: string) => {
  const content = replyContents.value[messageId]?.trim()
  if (!content) return

  replyingTo.value = messageId

  try {
    await replyToTripMessage(messageId, content)
    // Refresh messages to show new reply
    await fetchMessages()
    // Clear the reply input
    replyContents.value[messageId] = ''
  } catch (error) {
    console.error('Failed to add reply:', error)
    alert('Failed to send reply')
  } finally {
    replyingTo.value = null
  }
}

const updateStatus = async (messageId: string, status: TripMessage['status']) => {
  try {
    await updateTripMessageStatus(messageId, status)
    // Message already updated in UI through v-model
  } catch (error) {
    console.error('Failed to update status:', error)
    alert('Failed to update status')
    // Refresh to revert UI changes
    await fetchMessages()
  }
}

const confirmDeleteMessage = (message: TripMessage) => {
  messageToDelete.value = message
}

const cancelDelete = () => {
  messageToDelete.value = null
}

const deleteMessage = async () => {
  if (!messageToDelete.value) return

  try {
    await deleteTripMessage(messageToDelete.value.id)
    await fetchMessages()
    messageToDelete.value = null
  } catch (error) {
    console.error('Failed to delete message:', error)
    alert('Failed to delete message')
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.admin-trip-messages {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #2c3e50;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.message-card.message-pending {
  border-color: #ffa94d;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 10px;
}

.message-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.message-user {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.05rem;
}

.message-date {
  color: #6c757d;
  font-size: 0.9rem;
}

.message-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-select {
  padding: 6px 12px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.status-select:focus {
  outline: none;
  border-color: #ff6b6b;
}

.delete-btn {
  padding: 6px 16px;
  background-color: #dc3545;
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.3s;
}

.delete-btn:hover {
  opacity: 0.9;
}

.message-content {
  margin-bottom: 20px;
}

.message-content p {
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
}

.replies-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.replies-section h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 12px;
}

.reply-item {
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #dee2e6;
}

.reply-item.admin-reply {
  border-left-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.05);
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-author {
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
}

.admin-reply .reply-author {
  color: #ff6b6b;
}

.reply-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.reply-content {
  color: #2c3e50;
  line-height: 1.5;
  white-space: pre-wrap;
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.reply-textarea {
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.reply-textarea:focus {
  outline: none;
  border-color: #ff6b6b;
}

.reply-btn {
  align-self: flex-end;
  padding: 10px 24px;
  background-color: #ff6b6b;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.reply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reply-btn:not(:disabled):hover {
  opacity: 0.9;
}

/* Modal Styles */
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
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2c3e50;
}

.close-btn {
  font-size: 1.5rem;
  color: #6c757d;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  line-height: 1.6;
  color: #495057;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.cancel-btn,
.confirm-delete-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
}

.cancel-btn:hover,
.confirm-delete-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .status-select {
    flex: 1;
  }
}
</style>
