import { defineStore } from 'pinia'
import api from '@/api/api'

const defaultReportParams = {
  _page: 1,
  _per_page: 10,
  sortBy: 'status',
  sortDir: 'DESC'
}

const normalizeParams = (params = {}) => {
  if (typeof params === 'number') {
    return { _page: params }
  }

  return params || {}
}

const normalizeReportList = (payload) => {
  if (Array.isArray(payload?.data?.items)) {
    return {
      items: payload.data.items,
      meta: payload.data.meta || payload.data.pagination || {}
    }
  }

  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data,
      meta: payload.meta || {}
    }
  }

  if (Array.isArray(payload?.items)) {
    return {
      items: payload.items,
      meta: payload.meta || payload.pagination || {}
    }
  }

  if (Array.isArray(payload)) {
    return {
      items: payload,
      meta: {}
    }
  }

  return {
    items: [],
    meta: {}
  }
}

const normalizeReport = (payload) => {
  if (payload?.data?.item) {
    return payload.data.item
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload?.item) {
    return payload.item
  }

  return payload
}

const getErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message
  const details = error.response?.data?.details

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (Array.isArray(details) && details.length > 0) {
    return details.join(', ')
  }

  return message || error.response?.data?.error || fallback
}

export const useReportStore = defineStore('report', {
  state: () => ({
    reports: [],
    selectedReport: null,
    isLoading: false,
    error: null,
    meta: {}
  }),

  getters: {
    reportStats: (state) => {
      const pending = state.reports.filter((report) => report.status === 'SUBMITTED').length
      const reviewed = state.reports.filter((report) => report.status === 'REVIEWED').length
      const total = Number(
        state.meta.totalItems
          ?? state.meta.total
          ?? state.meta.itemCount
          ?? state.reports.length
      )

      return {
        pending,
        reviewed,
        total: Number.isFinite(total) ? total : state.reports.length
      }
    }
  },

  actions: {
    async fetchReports(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/performance-reports', {
          params: {
            ...defaultReportParams,
            ...normalizeParams(params)
          }
        })
        const { items, meta } = normalizeReportList(response.data)

        this.reports = items
        this.meta = meta
        return items
      } catch (error) {
        this.reports = []
        this.meta = {}
        this.error = getErrorMessage(error, 'Failed to load performance reports')
        console.error('Fetch performance reports error:', error)
        return []
      } finally {
        this.isLoading = false
      }
    },

    async fetchAllReports(params = {}) {
      return this.fetchReports(params)
    },

    async fetchMyReports(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/performance-reports/my', {
          params: {
            ...defaultReportParams,
            ...normalizeParams(params)
          }
        })
        const { items, meta } = normalizeReportList(response.data)

        this.reports = items
        this.meta = meta
        return items
      } catch (error) {
        this.reports = []
        this.meta = {}
        this.error = getErrorMessage(error, 'Failed to load your performance reports')
        console.error('Fetch my performance reports error:', error)
        return []
      } finally {
        this.isLoading = false
      }
    },

    async fetchReportById(id) {
      this.error = null

      try {
        const response = await api.get(`/performance-reports/${id}`)
        const report = normalizeReport(response.data)

        this.selectedReport = report
        return report
      } catch (error) {
        this.error = getErrorMessage(error, 'Failed to load report details')
        console.error('Fetch performance report details error:', error)
        throw error
      }
    },

    async createReport(payload) {
      this.error = null

      try {
        const response = await api.post('/performance-reports', payload)
        const report = normalizeReport(response.data)

        if (report?.id) {
          this.reports = [report, ...this.reports]
        }

        return report
      } catch (error) {
        this.error = getErrorMessage(error, 'Failed to create report')
        console.error('Create performance report error:', error)
        throw error
      }
    },

    async updateReport(id, payload) {
      this.error = null

      try {
        const response = await api.put(`/performance-reports/${id}`, payload)
        const updatedReport = normalizeReport(response.data)

        if (updatedReport?.id) {
          this.reports = this.reports.map((report) => (
            String(report.id) === String(id) ? updatedReport : report
          ))
          if (String(this.selectedReport?.id) === String(id)) {
            this.selectedReport = updatedReport
          }
        }

        return updatedReport
      } catch (error) {
        this.error = getErrorMessage(error, 'Failed to update report')
        console.error('Update performance report error:', error)
        throw error
      }
    },

    async submitReport(id) {
      this.error = null

      try {
        const response = await api.put(`/performance-reports/${id}/submit`)
        const submittedReport = normalizeReport(response.data)

        if (submittedReport?.id) {
          this.reports = this.reports.map((report) => (
            String(report.id) === String(id) ? submittedReport : report
          ))
        }

        return submittedReport || true
      } catch (error) {
        this.error = getErrorMessage(error, 'Failed to submit report')
        console.error('Submit performance report error:', error)
        throw error
      }
    },

    async reviewReport(id) {
      this.error = null

      try {
        const response = await api.put(`/performance-reports/${id}/review`)
        const reviewedReport = normalizeReport(response.data)

        if (reviewedReport?.id) {
          this.reports = this.reports.map((report) => (
            String(report.id) === String(id) ? reviewedReport : report
          ))
        } else {
          this.reports = this.reports.map((report) => (
            String(report.id) === String(id)
              ? { ...report, status: 'REVIEWED', reviewedAt: new Date().toISOString() }
              : report
          ))
        }

        return reviewedReport || true
      } catch (error) {
        this.error = getErrorMessage(error, 'Failed to review report')
        console.error('Review performance report error:', error)
        throw error
      }
    },

    async deleteReport(id) {
      this.error = null

      try {
        await api.delete(`/performance-reports/${id}`)
        this.reports = this.reports.filter((report) => String(report.id) !== String(id))

        if (String(this.selectedReport?.id) === String(id)) {
          this.selectedReport = null
        }

        return true
      } catch (error) {
        this.error = getErrorMessage(error, 'Failed to delete report')
        console.error('Delete performance report error:', error)
        throw error
      }
    }
  }
})
