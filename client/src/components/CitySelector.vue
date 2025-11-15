<template>
  <div class="city-selector">
    <div class="city-selector-trigger" @click="showModal = true">
      <span v-if="modelValue" class="selected-city">{{ getCityName(modelValue) }}</span>
      <span v-else class="placeholder">{{ placeholder }}</span>
      <span class="arrow">▼</span>
    </div>

    <div v-if="showModal" class="city-modal" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ t('guideHailing.selectCity') }}</h3>
          <button class="close-btn" @click="showModal = false">✕</button>
        </div>

        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('common.search')"
            @input="handleSearch"
          />
        </div>

        <div v-if="!searchQuery" class="index-bar">
          <button
            v-for="letter in alphabet"
            :key="letter"
            :class="['index-btn', { active: selectedLetter === letter }]"
            @click="scrollToLetter(letter)"
          >
            {{ letter }}
          </button>
        </div>

        <div class="cities-list" ref="citiesListRef">
          <template v-if="searchQuery">
            <div v-if="filteredCities.length === 0" class="no-results">
              {{ t('common.noResults') }}
            </div>
            <button
              v-for="city in filteredCities"
              :key="city.id"
              :class="['city-item', { selected: modelValue === city.id }]"
              @click="selectCity(city.id)"
            >
              <span class="city-name">{{ city.name }}</span>
              <span class="city-pinyin">{{ city.pinyin }}</span>
            </button>
          </template>
          <template v-else>
            <div
              v-for="group in cityGroups"
              :key="group.letter"
              :data-letter="group.letter"
              class="city-group"
            >
              <div class="group-title">{{ group.letter }}</div>
              <button
                v-for="city in group.cities"
                :key="city.id"
                :class="['city-item', { selected: modelValue === city.id }]"
                @click="selectCity(city.id)"
              >
                <span class="city-name">{{ city.name }}</span>
                <span class="city-pinyin">{{ city.pinyin }}</span>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import cityData from '@/assets/city.json'

const { t } = useI18n()

interface Props {
  modelValue: string
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Select a city'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showModal = ref(false)
const searchQuery = ref('')
const selectedLetter = ref('')
const citiesListRef = ref<HTMLElement | null>(null)

// 从JSON文件加载所有城市数据并转换为扁平列表
const cities = computed(() => {
  const allCities: Array<{ id: string; name: string; pinyin: string; code: string }> = []

  cityData.city.forEach((group: any) => {
    group.list.forEach((city: any) => {
      allCities.push({
        id: city.label, // 使用label作为唯一ID
        name: city.name,
        pinyin: city.pinyin,
        code: city.code
      })
    })
  })

  // 按拼音排序
  return allCities.sort((a, b) => a.pinyin.localeCompare(b.pinyin))
})

// 字母表
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// 按首字母分组
const cityGroups = computed(() => {
  const groups: { letter: string; cities: Array<{ id: string; name: string; pinyin: string; code: string }> }[] = []

  alphabet.forEach(letter => {
    const citiesInGroup = cities.value.filter(city =>
      city.pinyin.toUpperCase().startsWith(letter)
    )
    if (citiesInGroup.length > 0) {
      groups.push({ letter, cities: citiesInGroup })
    }
  })

  return groups
})

// 搜索过滤
const filteredCities = computed(() => {
  if (!searchQuery.value) return cities.value

  const query = searchQuery.value.toLowerCase()
  return cities.value.filter(city =>
    city.name.includes(query) ||
    city.pinyin.toLowerCase().includes(query)
  )
})

const getCityName = (cityId: string) => {
  const city = cities.value.find(c => c.id === cityId)
  return city ? city.name : cityId
}

const selectCity = (cityId: string) => {
  emit('update:modelValue', cityId)
  showModal.value = false
  searchQuery.value = ''
}

const handleSearch = () => {
  selectedLetter.value = ''
}

const scrollToLetter = async (letter: string) => {
  selectedLetter.value = letter
  await nextTick()

  if (citiesListRef.value) {
    const element = citiesListRef.value.querySelector(`[data-letter="${letter}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}
</script>

<style scoped>
.city-selector {
  position: relative;
}

.city-selector-trigger {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.3s;
}

.city-selector-trigger:hover {
  border-color: var(--primary-color);
}

.selected-city {
  color: var(--text-dark);
  font-weight: 500;
}

.placeholder {
  color: #999;
}

.arrow {
  color: #999;
  font-size: 0.8rem;
}

.city-modal {
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-dark);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #666;
  transition: background 0.3s;
}

.close-btn:hover {
  background: #ddd;
}

.search-box {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.search-box input {
  width: 100%;
  padding: 10px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-box input:focus {
  border-color: var(--primary-color);
}

.index-bar {
  padding: 12px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-bottom: 1px solid var(--border-color);
  max-height: 120px;
  overflow-y: auto;
}

.index-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: var(--bg-light);
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.index-btn:hover {
  background: var(--primary-color);
  color: white;
}

.index-btn.active {
  background: var(--primary-color);
  color: white;
}

.cities-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.city-group {
  margin-bottom: 8px;
}

.group-title {
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-color);
  background: var(--bg-light);
  position: sticky;
  top: 0;
  z-index: 1;
}

.city-item {
  width: 100%;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  transition: background 0.3s;
}

.city-item:hover {
  background: var(--bg-light);
}

.city-item.selected {
  background: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
}

.city-name {
  font-weight: 500;
  font-size: 1rem;
}

.city-pinyin {
  font-size: 0.85rem;
  color: #999;
}

.no-results {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

@media (max-width: 480px) {
  .modal-content {
    max-height: 90vh;
  }

  .index-bar {
    max-height: 80px;
  }

  .index-btn {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }
}
</style>
