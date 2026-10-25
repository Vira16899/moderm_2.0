import { defineStore } from 'pinia'
import api from '@/api/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    myStaff: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchMyStaff() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/users/my-staff')
        this.myStaff = res.data?.data || []
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch staff'
        console.error('Error fetching staff:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
