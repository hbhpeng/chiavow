<template>
  <div class="guide-hailing-view">
    <div class="header">
      <h1 class="title">{{ t('guideHailing.title') }}</h1>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: currentTab === 'planner' }"
        @click="currentTab = 'planner'"
      >
        {{ t('guideHailing.plannerTab') }}
      </button>
      <button
        class="tab"
        :class="{ active: currentTab === 'message' }"
        @click="currentTab = 'message'"
      >
        {{ t('guideHailing.messageTab') }}
      </button>
    </div>

    <!-- Trip Planner Tab -->
    <div v-if="currentTab === 'planner'" class="content-wrapper">
      <div class="trips-list">
        <div
          v-for="(trip, index) in trips"
          :key="index"
          class="trip-card"
        >
          <div class="input-group">
            <label>{{ t('guideHailing.city') }}</label>
            <CitySelector
              v-model="trip.city"
              :placeholder="t('guideHailing.selectCity')"
            />
          </div>

          <div class="input-group">
            <label>{{ t('guideHailing.duration') }}</label>
            <div class="date-range">
              <input
                v-model="trip.startDate"
                type="date"
                :min="minStartDate"
                :placeholder="t('guideHailing.startDate')"
                @change="validateDates(trip)"
              />
              <span class="separator">-</span>
              <input
                v-model="trip.endDate"
                type="date"
                :min="trip.startDate || minStartDate"
                :placeholder="t('guideHailing.endDate')"
                @change="validateDates(trip)"
              />
            </div>
          </div>

          <button
            v-if="trips.length > 1"
            class="remove-trip-btn"
            @click="removeTrip(index)"
          >
            ✕
          </button>
        </div>

        <button class="add-trip-btn" @click="addTrip">
          <span class="icon">+</span>
          <span>{{ t('guideHailing.addTrip') }}</span>
        </button>
      </div>

      <div class="options-section">
        <div class="input-group">
          <label>
            {{ t('guideHailing.travelers') }}
            <span class="hint">{{ t('guideHailing.travelersLimit') }}</span>
          </label>
          <input
            v-model.number="options.numberOfTravelers"
            type="number"
            min="1"
            max="5"
            placeholder="1"
          />
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input v-model="options.supplyVehicles" type="checkbox" />
            <span>
              {{ t('guideHailing.supplyVehicles') }}
              <span class="cost">{{ t('guideHailing.vehiclesCost') }}</span>
            </span>
          </label>
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input v-model="options.freeItinerary" type="checkbox" />
            <span>{{ t('guideHailing.freeItinerary') }}</span>
          </label>
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input v-model="options.tailorMade" type="checkbox" />
            <span>
              {{ t('guideHailing.tailorMade') }}
              <span class="cost">{{ t('guideHailing.tailorMadeCost') }}</span>
            </span>
          </label>
        </div>

        <button class="match-btn" @click="handleMatch" :disabled="!isValid || loading">
          {{ loading ? t('common.loading') : t('guideHailing.match') }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </div>
    </div>

    <!-- Message Tab -->
    <div v-if="currentTab === 'message'" class="content-wrapper">
      <div class="message-form">
        <h2 class="form-title">{{ t('guideHailing.leaveMessage') }}</h2>
        <p class="form-description">{{ t('guideHailing.messageDescription') }}</p>

        <div class="input-group">
          <label>{{ t('guideHailing.yourMessage') }}</label>
          <textarea
            v-model="message"
            :placeholder="t('guideHailing.messagePlaceholder')"
            rows="10"
            class="message-textarea"
          ></textarea>
        </div>

        <button class="send-btn" @click="handleSendMessage" :disabled="!message.trim() || sendingMessage">
          {{ sendingMessage ? t('common.loading') : t('guideHailing.send') }}
        </button>

        <p v-if="messageError" class="error-message">{{ messageError }}</p>
        <p v-if="messageSuccess" class="success-message">{{ t('guideHailing.messageSent') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createOrder } from '@/api/orders'
import { createTripMessage } from '@/api/tripMessages'
import type { TripSegment } from '@/api/orders'
import CitySelector from '@/components/CitySelector.vue'

const { t } = useI18n()
const router = useRouter()

interface Trip {
  city: string
  startDate: string
  endDate: string
}

const currentTab = ref<'planner' | 'message'>('planner')

// Trip Planner state
const minStartDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

// Initialize trips based on device type (mobile: 1, desktop: 3)
const getInitialTrips = (): Trip[] => {
  const isMobile = window.innerWidth < 768
  const count = isMobile ? 1 : 3
  return Array.from({ length: count }, () => ({ city: '', startDate: '', endDate: '' }))
}

const trips = ref<Trip[]>(getInitialTrips())

const options = ref({
  numberOfTravelers: 1,
  supplyVehicles: false,
  freeItinerary: false,
  tailorMade: false
})

const loading = ref(false)
const error = ref('')

// Message state
const message = ref('')
const sendingMessage = ref(false)
const messageError = ref('')
const messageSuccess = ref(false)

const validateDates = (trip: Trip) => {
  if (trip.startDate) {
    const startDate = new Date(trip.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate <= today) {
      error.value = 'Start date must be after today'
      trip.startDate = ''
      return
    }
  }

  if (trip.startDate && trip.endDate) {
    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)

    if (endDate <= startDate) {
      error.value = 'End date must be after start date'
      trip.endDate = ''
      return
    }
  }

  error.value = ''
}

const isValid = computed(() => {
  const hasValidTrip = trips.value.some(
    trip => trip.city && trip.startDate && trip.endDate
  )
  return hasValidTrip && options.value.numberOfTravelers >= 1
})

const addTrip = () => {
  if (trips.value.length < 10) {
    trips.value.push({ city: '', startDate: '', endDate: '' })
  }
}

const removeTrip = (index: number) => {
  trips.value.splice(index, 1)
}

const handleMatch = async () => {
  if (!isValid.value) return

  loading.value = true
  error.value = ''

  try {
    const validTrips: TripSegment[] = trips.value
      .filter(trip => trip.city && trip.startDate && trip.endDate)
      .map(trip => ({
        city: trip.city,
        startDate: trip.startDate,
        endDate: trip.endDate
      }))

    await createOrder({
      trips: validTrips,
      numberOfTravelers: options.value.numberOfTravelers,
      supplyVehicles: options.value.supplyVehicles,
      freeItinerary: options.value.freeItinerary,
      tailorMade: options.value.tailorMade
    })

    router.push({ path: '/main/orders', query: { showContact: 'true' } })
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create order'
  } finally {
    loading.value = false
  }
}

const handleSendMessage = async () => {
  if (!message.value.trim()) return

  sendingMessage.value = true
  messageError.value = ''
  messageSuccess.value = false

  try {
    await createTripMessage({ message: message.value.trim() })
    messageSuccess.value = true
    message.value = ''

    // Navigate to trip messages view after 1.5 seconds
    setTimeout(() => {
      router.push('/main/trip-messages')
    }, 1500)
  } catch (err: any) {
    messageError.value = err.response?.data?.message || 'Failed to send message'
  } finally {
    sendingMessage.value = false
  }
}
</script>

<style scoped>
.guide-hailing-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-light);
  overflow: hidden;
}

.header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-dark);
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  padding: 15px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  color: #999;
  transition: all 0.3s;
  cursor: pointer;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.content-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.trips-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.trip-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.remove-trip-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--error-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: opacity 0.3s;
}

.remove-trip-btn:hover {
  opacity: 0.8;
}

.add-trip-btn {
  background: white;
  padding: 15px;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
  color: var(--primary-color);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.add-trip-btn:hover {
  border-color: var(--primary-color);
  background: rgba(255, 107, 107, 0.05);
}

.add-trip-btn .icon {
  font-size: 1.5rem;
}

.options-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-form {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.form-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.form-description {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
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

.hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #999;
}

.input-group input,
.input-group select {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background: white;
}

.input-group input:focus,
.input-group select:focus {
  border-color: var(--primary-color);
}

.message-textarea {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.message-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background: white;
  -webkit-appearance: none;
  appearance: none;
}

.date-range input:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Safari date input styling */
.date-range input::-webkit-date-and-time-value {
  text-align: left;
}

.date-range input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
}

.date-range input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.separator {
  color: #999;
  font-weight: bold;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.cost {
  font-size: 0.85rem;
  color: #999;
}

.match-btn,
.send-btn {
  margin-top: 10px;
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.match-btn:disabled,
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.match-btn:not(:disabled):hover,
.send-btn:not(:disabled):hover {
  opacity: 0.9;
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  color: var(--success-color);
  font-size: 0.9rem;
  text-align: center;
  font-weight: 600;
}

@media (max-width: 480px) {
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .separator {
    display: none;
  }

  .message-form {
    padding: 20px;
  }
}
</style>
