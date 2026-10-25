import { defineStore } from "pinia";
import api from "@/api/api";
import { useAuthStore } from "./useAuth";
import { getRoleKey } from "@/utils/roles";

const normalizeReportList = (payload) => {
  if (Array.isArray(payload?.data?.items)) {
    return {
      items: payload.data.items,
      meta: payload.data.meta || payload.data.pagination || payload.data || {},
    };
  }

  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data,
      meta: payload.meta || payload.pagination || {},
    };
  }

  if (Array.isArray(payload?.items)) {
    return {
      items: payload.items,
      meta: payload.meta || payload.pagination || {},
    };
  }

  if (Array.isArray(payload)) {
    return {
      items: payload,
      meta: {},
    };
  }

  return {
    items: [],
    meta: {},
  };
};

const normalizeReport = (payload) => {
  if (payload?.data?.item) return payload.data.item;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  if (payload?.item) return payload.item;
  return payload;
};

const getErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message;
  const details = error.response?.data?.details;

  if (Array.isArray(message)) return message.join(", ");
  if (Array.isArray(details) && details.length > 0) return details.join(", ");

  return message || error.response?.data?.error || error.message || fallback;
};

export const useReportManagerStore = defineStore("reportManager", {
  state: () => ({
    reports: [],
    isLoading: false,
    error: null,
    meta: {},
  }),

  getters: {
    reportStats: (state) => {
      const reports = Array.isArray(state.reports) ? state.reports : [];
      const reviewed = reports.filter(
        (report) => report.status?.toUpperCase() === "REVIEWED",
      ).length;
      const pending = reports.filter(
        (report) => report.status?.toUpperCase() === "SUBMITTED",
      ).length;
      const open = reports.filter(
        (report) => report.status?.toUpperCase() === "DRAFT",
      ).length;

      return {
        total: reports.length,
        reviewed,
        pending,
        open,
      };
    },
  },

  actions: {
    setReportList(response) {
      const { items, meta } = normalizeReportList(response?.data);
      this.reports = items;
      this.meta = meta;
    },

    async fetchMyReports(params = {}) {
      this.isLoading = true;
      this.error = null;

      const query =
        typeof params === "number" ? { _page: params } : { ...params };

      try {
        const requestParams = {
          _page: query._page || 1,
          _per_page: query._per_page || 10,
          sortBy: "status",
          sortDir: "DESC",
          ...query,
        };

        const response = await api.get("/performance-reports/my", {
          params: requestParams,
        });
        this.setReportList(response);
      } catch (err) {
        this.error = "មិនអាចទាញទិន្នន័យរបាយការណ៍បានទេ";
        console.error("Fetch My Reports Error:", err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchReports(params = {}) {
      this.isLoading = true;
      this.error = null;

      const authStore = useAuthStore();
      const roleKey = getRoleKey(authStore.profile);
      const query =
        typeof params === "number" ? { _page: params } : { ...params };

      try {
        let endpoint = "/performance-reports";
        const requestParams = {
          _page: query._page || 1,
          _per_page: query._per_page || 10,
          sortBy: "status",
          sortDir: "DESC",
          ...query,
        };

        if (roleKey === "manager" && !requestParams.managerId) {
          requestParams.managerId = authStore.profile?.id;
        }

        const response = await api.get(endpoint, { params: requestParams });
        this.setReportList(response);
      } catch (err) {
        this.error = "មិនអាចទាញទិន្នន័យរបាយការណ៍បានទេ";
        console.error("Fetch Error:", err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAllReports(params = {}) {
      return this.fetchReports(params);
    },

    async fetchReportById(id) {
      try {
        const response = await api.get(`/performance-reports/${id}`);
        return normalizeReport(response.data);
      } catch (error) {
        console.error("Fetch Report Detail Error:", error);
        throw error;
      }
    },

    async createReport(payload) {
      this.isLoading = true;
      try {
        const response = await api.post("/performance-reports", payload);
        return response.data;
      } catch (error) {
        console.error("Create Report Error:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async submitReport(id) {
      this.isLoading = true;
      try {
        const response = await api.put(`/performance-reports/${id}/submit`);
        const submittedReport = normalizeReport(response.data);

        this.reports = this.reports.map((report) => {
          if (String(report.id) !== String(id)) return report;
          return submittedReport?.id
            ? submittedReport
            : { ...report, status: "SUBMITTED" };
        });

        return submittedReport || true;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to submit report");
        console.error("Submit Report Error:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteReport(id) {
      try {
        await api.delete(`/performance-reports/${id}`);
        this.reports = this.reports.filter((r) => r.id !== id);
        return true;
      } catch (err) {
        console.error("Delete Error:", err);
        throw err;
      }
    },

    async updateReport(id, payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await api.put(`/performance-reports/${id}`, payload);
        const updatedReport = normalizeReport(res.data);

        if (updatedReport?.id) {
          this.reports = this.reports.map((report) =>
            String(report.id) === String(id) ? updatedReport : report,
          );
        }

        return updatedReport;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to update report");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
