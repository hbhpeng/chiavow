<template>
  <div class="trip-messages-view">
    <div class="header">
      <h1 class="title">{{ t('tripMessages.title') }}</h1>
    </div>

    <div class="messages-container">
      <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <span class="icon">💬</span>
        <p>{{ t('tripMessages.noMessages') }}</p>
      </div>

      <div v-else class="messages-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-card"
        >
          <div class="message-header">
            <span class="message-date">{{ formatDate(message.createdAt) }}</span>
            <span class="message-status" :class="message.status">
              {{ t(`tripMessages.status.${message.status}`) }}
            </span>
          </div>

          <div class="message-content">
            <p>{{ message.message }}</p>
          </div>

          <!-- Replies -->
          <div v-if="message.replies && message.replies.length > 0" class="replies-section">
            <div
              v-for="reply in message.replies"
              :key="reply.id"
              class="reply-item"
              :class="{ 'admin-reply': reply.isAdmin }"
            >
              <div class="reply-header">
                <span class="reply-author">
                  {{ reply.isAdmin ? t('tripMessages.admin') : t('tripMessages.you') }}
                </span>
                <span class="reply-date">{{ formatDate(reply.createdAt) }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>

          <!-- Reply Form -->
          <div class="reply-form">
            <textarea
              v-model="replyContents[message.id]"
              :placeholder="t('tripMessages.replyPlaceholder')"
              rows="3"
              class="reply-textarea"
            ></textarea>
            <button
              class="reply-btn"
              @click="handleReply(message.id)"
              :disabled="!replyContents[message.id]?.trim() || replyingTo === message.id"
            >
              {{ replyingTo === message.id ? t('common.loading') : t('tripMessages.reply') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getTripMessages, addReply, markMessageAsRead, type TripMessage } from '@/api/tripMessages'

const { t } = useI18n()

const messages = ref<TripMessage[]>([])
const loading = ref(false)
const replyContents = ref<Record<string, string>>({})
const replyingTo = ref<string | null>(null)

const formatDate = (date: string) => {
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
      if (!message.userRead) {
        try {
          await markMessageAsRead(message.id)
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
    await addReply(messageId, { content })
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

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.trip-messages-view {
  min-height: 100%;
  background: var(--bg-light);
}

.header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-dark);
}

.messages-container {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state .icon {
  font-size: 4rem;
  margin-bottom: 10px;
  opacity: 0.5;
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
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.message-date {
  color: #666;
  font-size: 0.9rem;
}

.message-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.message-status.pending {
  background: rgba(255, 169, 77, 0.2);
  color: var(--warning-color);
}

.message-status.replied {
  background: rgba(81, 207, 102, 0.2);
  color: var(--success-color);
}

.message-status.closed {
  background: rgba(150, 150, 150, 0.2);
  color: #666;
}

.message-content {
  margin-bottom: 20px;
}

.message-content p {
  line-height: 1.6;
  color: var(--text-dark);
  white-space: pre-wrap;
}

.replies-section {
  margin: 20px 0;
  padding: 15px;
  background: var(--bg-light);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-item {
  padding: 12px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #ddd;
}

.reply-item.admin-reply {
  border-left-color: var(--primary-color);
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
  color: var(--text-dark);
}

.admin-reply .reply-author {
  color: var(--primary-color);
}

.reply-date {
  font-size: 0.8rem;
  color: #999;
}

.reply-content {
  color: var(--text-dark);
  line-height: 1.5;
  white-space: pre-wrap;
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.reply-textarea {
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.reply-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.reply-btn {
  align-self: flex-end;
  padding: 10px 24px;
  background-color: var(--primary-color);
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

@media (max-width: 480px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .reply-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
