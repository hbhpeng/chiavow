<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="logo-section">
        <img src="/logo.svg" alt="Chiavow Logo" class="logo-image" />
        <h1 class="app-name">{{ t('app.name') }}</h1>
        <div class="taglines">
          <p class="tagline">{{ t('app.tagline1') }}</p>
          <p class="tagline">{{ t('app.tagline2') }}</p>
          <p class="tagline">{{ t('app.tagline3') }}</p>
        </div>
      </div>

      <div class="auth-form">
        <h2 class="auth-title">{{ isRegisterMode ? t('auth.registerTitle') : t('auth.loginTitle') }}</h2>

        <div class="input-group">
          <label>{{ t('auth.email') }}</label>
          <input
            v-model="email"
            type="email"
            :placeholder="t('auth.enterEmail')"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div class="input-group">
          <label>{{ t('auth.password') }}</label>
          <input
            v-model="password"
            type="password"
            :placeholder="t('auth.enterPassword')"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div v-if="isRegisterMode" class="input-group">
          <label>{{ t('auth.verificationCode') }}</label>
          <div class="code-input-wrapper">
            <input
              v-model="code"
              type="text"
              :placeholder="t('auth.enterCode')"
              @keyup.enter="handleSubmit"
            />
            <button
              type="button"
              class="send-code-btn"
              @click="handleSendCode"
              :disabled="sendingCode || codeSent || countdown > 0"
            >
              {{ sendingCode ? t('common.loading') : (countdown > 0 ? `${countdown}s` : t('auth.sendCode')) }}
            </button>
          </div>
        </div>

        <button type="button" class="submit-btn" @click="handleSubmit" :disabled="loading">
          {{ loading ? t('common.loading') : (isRegisterMode ? t('auth.register') : t('auth.login')) }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>

        <div v-if="showRegisterPrompt" class="register-prompt">
          <p>{{ t('auth.emailNotRegistered') }}</p>
          <button type="button" class="prompt-register-btn" @click="switchToRegisterWithEmail">
            {{ t('auth.goToRegister') }}
          </button>
        </div>

        <button type="button" class="switch-mode-btn" @click="toggleMode">
          {{ isRegisterMode ? t('auth.switchToLogin') : t('auth.switchToRegister') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { sendVerificationCode, register, login } from '@/api/auth'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const isRegisterMode = ref(false)
const email = ref('')
const password = ref('')
const code = ref('')
const codeSent = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const loading = ref(false)
const error = ref('')
const showRegisterPrompt = ref(false)

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  error.value = ''
  code.value = ''
  codeSent.value = false
  countdown.value = 0
  showRegisterPrompt.value = false
}

const switchToRegisterWithEmail = () => {
  isRegisterMode.value = true
  showRegisterPrompt.value = false
  error.value = ''
  // Keep email value for convenience
}

const handleSendCode = async (event?: Event) => {
  if (event) {
    event.preventDefault()
  }

  if (!email.value) {
    error.value = 'Please enter email address'
    return
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    error.value = 'Please enter a valid email address'
    return
  }

  sendingCode.value = true
  error.value = ''

  try {
    await sendVerificationCode({ email: email.value })
    codeSent.value = true
    countdown.value = 60

    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        codeSent.value = false
      }
    }, 1000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to send code'
  } finally {
    sendingCode.value = false
  }
}

const handleSubmit = async (event?: Event) => {
  if (event) {
    event.preventDefault()
  }

  console.log('=== handleSubmit called ===')
  console.log('isRegisterMode:', isRegisterMode.value)
  console.log('email:', email.value)

  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }

  if (isRegisterMode.value && !code.value) {
    error.value = 'Please enter verification code'
    return
  }

  loading.value = true
  error.value = ''
  showRegisterPrompt.value = false

  try {
    console.log('=== Attempting authentication ===')
    let response
    if (isRegisterMode.value) {
      console.log('Calling register API...')
      response = await register({
        email: email.value,
        password: password.value,
        code: code.value
      })
    } else {
      console.log('Calling login API...')
      response = await login({
        email: email.value,
        password: password.value
      })
    }

    console.log('=== Authentication successful ===', response.data)
    userStore.setToken(response.data.token)
    userStore.setUser(response.data.user)

    if (!response.data.user.username) {
      router.push('/profile-setup')
    } else {
      router.push('/main')
    }
  } catch (err: any) {
    console.log('=== Authentication error ===')
    console.log('Full error:', err)
    console.log('Error response:', err.response)

    const errorMessage = err.response?.data?.message || (isRegisterMode.value ? 'Registration failed' : 'Login failed')
    console.log('Error message:', errorMessage)

    error.value = errorMessage

    // Only show register prompt when user is not found (not registered)
    if (!isRegisterMode.value && errorMessage === 'User not found') {
      console.log('Showing register prompt')
      showRegisterPrompt.value = true
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-image {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.app-name {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 20px;
}

.taglines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tagline {
  font-size: 0.95rem;
  color: var(--text-dark);
  font-weight: 500;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-dark);
  text-align: center;
  margin-bottom: 10px;
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

.input-group input {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.input-group input:focus {
  border-color: var(--primary-color);
}

.code-input-wrapper {
  display: flex;
  gap: 10px;
}

.code-input-wrapper input {
  flex: 1;
}

.send-code-btn {
  padding: 12px 20px;
  background-color: var(--secondary-color);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: opacity 0.3s;
  white-space: nowrap;
}

.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-code-btn:not(:disabled):hover {
  opacity: 0.9;
}

.submit-btn {
  margin-top: 10px;
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: opacity 0.3s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  opacity: 0.9;
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  text-align: center;
}

.register-prompt {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 169, 77, 0.1);
  border: 1px solid rgba(255, 169, 77, 0.3);
  border-radius: 10px;
  text-align: center;
}

.register-prompt p {
  margin: 0 0 12px 0;
  color: var(--text-dark);
  font-size: 0.95rem;
}

.prompt-register-btn {
  padding: 10px 24px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.prompt-register-btn:hover {
  opacity: 0.9;
}

.switch-mode-btn {
  margin-top: 10px;
  padding: 10px;
  background-color: transparent;
  color: var(--primary-color);
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: underline;
  transition: opacity 0.3s;
  cursor: pointer;
}

.switch-mode-btn:hover {
  opacity: 0.8;
}

@media (max-width: 480px) {
  .auth-container {
    padding: 30px 20px;
  }

  .app-name {
    font-size: 2rem;
  }

  .tagline {
    font-size: 0.85rem;
  }

  .auth-title {
    font-size: 1.3rem;
  }
}
</style>
