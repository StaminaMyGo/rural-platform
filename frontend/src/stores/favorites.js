import { defineStore } from 'pinia'
import { ref } from 'vue'
import { favoriteSuggestion, getMyFavorited } from '@/api/suggestions'

export const useFavoritesStore = defineStore('favorites', () => {
  // Set of favorited suggestion IDs
  const favoritedIds = ref(new Set())
  const loaded = ref(false)

  async function loadFavorited() {
    try {
      const res = await getMyFavorited()
      const ids = (res.data || []).map(id => id.toString())
      favoritedIds.value = new Set(ids)
      loaded.value = true
    } catch {
      // ignore — not logged in or error
    }
  }

  function isFavorited(id) {
    return favoritedIds.value.has(id?.toString())
  }

  async function toggle(suggestion) {
    const id = suggestion._id
    try {
      const res = await favoriteSuggestion(id)
      if (res.data.favorited) {
        favoritedIds.value.add(id.toString())
      } else {
        favoritedIds.value.delete(id.toString())
      }
      return res.data
    } catch (err) {
      throw err
    }
  }

  function clear() {
    favoritedIds.value = new Set()
    loaded.value = false
  }

  return { favoritedIds, loaded, loadFavorited, isFavorited, toggle, clear }
})
