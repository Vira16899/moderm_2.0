import { defineStore } from "pinia";
import api from "@/api/api";
import { useAuthStore } from "./useAuthStore";

const normalizeGroups = (payload) => {
  let items = [];
  if (Array.isArray(payload?.data?.items)) {
    items = payload.data.items;
  } else if (Array.isArray(payload?.data)) {
    items = payload.data;
  } else if (Array.isArray(payload?.items)) {
    items = payload.items;
  } else if (Array.isArray(payload)) {
    items = payload;
  }

  return items.map((item) => {
    if (item && typeof item === "object") {
      item.members = item.members || item.staffs || item.users || [];
    }
    return item;
  });
};

const normalizeItem = (payload) => {
  let item = null;
  if (payload?.data?.item) {
    item = payload.data.item;
  } else if (payload?.data && !Array.isArray(payload.data)) {
    item = payload.data;
  } else if (payload?.item) {
    item = payload.item;
  } else {
    item = payload;
  }

  if (item && typeof item === "object") {
    // Ensure members list is consistent
    item.members = item.members || item.staffs || item.users || [];
  }

  return item;
};

const getErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message;
  const details = error.response?.data?.details;

  if (Array.isArray(message)) {
    return message.join(", ");
  }
  if (Array.isArray(details) && details.length > 0) {
    return details.join(", ");
  }
  return message || error.response?.data?.error || fallback;
};

export const useGroupManagerStore = defineStore("groupManager", {
  state: () => ({
    myGroups: [],
    myStaffs: [],
    loading: false,
    staffsLoading: false,
    error: null,
  }),

  actions: {
    async fetchMyStaffs() {
      this.staffsLoading = true;
      try {
        const response = await api.get("/users/my-staff");
        // Normalize the staff list structure
        let staffList = [];
        if (Array.isArray(response.data?.data)) {
          staffList = response.data.data;
        } else if (Array.isArray(response.data)) {
          staffList = response.data;
        } else if (Array.isArray(response.data?.items)) {
          staffList = response.data.items;
        }
        this.myStaffs = staffList;
      } catch (error) {
        this.myStaffs = [];
        console.error("Fetch my staffs error:", error);
      } finally {
        this.staffsLoading = false;
      }
    },

    async fetchMyGroups(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/groups/mine", {
          params: {
            _page: 1,
            _per_page: 100,
            ...params,
          },
        });
        this.myGroups = normalizeGroups(response.data);
      } catch (error) {
        this.myGroups = [];
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការទាញយកទិន្នន័យក្រុម");
        console.error("Fetch my groups error:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchGroupById(id) {
      this.error = null;
      try {
        const response = await api.get(`/groups/${id}`);
        const group = normalizeItem(response.data);
        if (group?.id) {
          this.myGroups = this.myGroups.map((g) =>
            String(g.id) === String(id) ? group : g,
          );
        }
        return group;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការទាញយកព័ត៌មានក្រុម");
        console.error("Fetch group by id error:", error);
        throw error;
      }
    },

    async createGroup(payload) {
      this.error = null;
      try {
        const response = await api.post("/groups", payload);
        const createdGroup = normalizeItem(response.data);
        if (createdGroup?.id) {
          this.myGroups = [createdGroup, ...this.myGroups];
        } else {
          await this.fetchMyGroups();
        }
        return createdGroup || true;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការបង្កើតក្រុម");
        console.error("Create group error:", error);
        throw error;
      }
    },

    async updateGroup(id, payload) {
      this.error = null;
      try {
        const response = await api.put(`/groups/${id}`, payload);
        const updatedGroup = normalizeItem(response.data);
        if (updatedGroup?.id) {
          this.myGroups = this.myGroups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
        } else {
          await this.fetchMyGroups();
        }
        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការកែសម្រួលក្រុម");
        console.error("Update group error:", error);
        throw error;
      }
    },

    async updateThumbnail(id, file) {
      if (!file) return;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append("thumbnail", file);
        const response = await api.post(`/groups/${id}/thumbnail`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updatedGroup = normalizeItem(response.data);
        if (updatedGroup?.id) {
          this.myGroups = this.myGroups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
        } else {
          await this.fetchMyGroups();
        }
        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការប្តូររូបភាព");
        console.error("Update thumbnail error:", error);
        throw error;
      }
    },

    async deleteThumbnail(id) {
      this.error = null;
      try {
        const response = await api.delete(`/groups/${id}/thumbnail`);
        const updatedGroup = normalizeItem(response.data);
        if (updatedGroup?.id) {
          this.myGroups = this.myGroups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
        } else {
          await this.fetchMyGroups();
        }
        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការលុបរូបភាព");
        console.error("Delete thumbnail error:", error);
        throw error;
      }
    },

    /**
     * Add Members to group
     * Method: POST
     * URL: {{baseUrl}}/groups/{{groupId}}/members
     * Body: { "userIds": [4] }
     *
     * Business Rules:
     * - Admin can add any STAFF user to any group.
     * - Manager can only add staff whose manager field matches the logged-in manager.
     * - Manager can only add members to groups they own.
     * - Return 403 if the target staff is not under that manager.
     * - Return 403 if the manager does not own the group.
     */
    async addGroupMembers(groupId, userIds) {
      this.error = null;
      try {
        const response = await api.post(`/groups/${groupId}/members`, {
          userIds,
        });
        const updatedGroup = normalizeItem(response.data);
        if (updatedGroup?.id) {
          this.myGroups = this.myGroups.map((group) =>
            String(group.id) === String(groupId) ? updatedGroup : group,
          );
        } else {
          await this.fetchMyGroups();
        }
        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការបន្ថែមសមាជិក");
        console.error("Add members error:", error);
        throw error;
      }
    },

    /**
     * Remove Members
     * Method: DELETE
     * URL: {{baseUrl}}/groups/{{groupId}}/members
     * Body: { "userIds": [4] }
     *
     * Business Rules:
     * - Admin can remove anyone from any group.
     * - Manager can only remove members from groups they own.
     * - Return 403 if the manager does not own the group.
     */
    async removeGroupMembers(groupId, userIds) {
      this.error = null;
      try {
        const response = await api.delete(`/groups/${groupId}/members`, {
          data: { userIds },
        });
        const updatedGroup = normalizeItem(response.data);
        if (updatedGroup?.id) {
          this.myGroups = this.myGroups.map((group) =>
            String(group.id) === String(groupId) ? updatedGroup : group,
          );
        } else {
          await this.fetchMyGroups();
        }
        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "បរាជ័យក្នុងការលុបសមាជិក");
        console.error("Remove members error:", error);
        throw error;
      }
    },
  },
});
