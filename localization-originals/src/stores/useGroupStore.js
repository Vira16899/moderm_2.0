import { defineStore } from "pinia";
import api from "@/api/api";

const normalizeGroups = (payload) => {
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const normalizeList = normalizeGroups;

const normalizeCreatedGroup = (payload) => {
  if (payload?.data?.item) {
    return payload.data.item;
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.item) {
    return payload.item;
  }

  return payload;
};

const normalizeMembers = (payload) => {
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.data?.item?.members)) {
    return payload.data.item.members;
  }

  if (Array.isArray(payload?.data?.item?.staffs)) {
    return payload.data.item.staffs;
  }

  if (Array.isArray(payload?.data?.item?.users)) {
    return payload.data.item.users;
  }

  if (Array.isArray(payload?.data?.members)) {
    return payload.data.members;
  }

  if (Array.isArray(payload?.data?.staffs)) {
    return payload.data.staffs;
  }

  if (Array.isArray(payload?.data?.users)) {
    return payload.data.users;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.item?.members)) {
    return payload.item.members;
  }

  if (Array.isArray(payload?.item?.staffs)) {
    return payload.item.staffs;
  }

  if (Array.isArray(payload?.item?.users)) {
    return payload.item.users;
  }

  if (Array.isArray(payload?.members)) {
    return payload.members;
  }

  if (Array.isArray(payload?.staffs)) {
    return payload.staffs;
  }

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  return [];
};

const hasMembersList = (group) =>
  ["members", "staffs", "users"].some((key) => Array.isArray(group?.[key]));

const mergeGroupById = (groups, id, nextGroup) => {
  const nextId = String(nextGroup?.id ?? id);
  const exists = groups.some((group) => String(group.id) === nextId);

  if (!exists) {
    return nextGroup?.id ? [nextGroup, ...groups] : groups;
  }

  return groups.map((group) =>
    String(group.id) === nextId ? { ...group, ...nextGroup } : group,
  );
};

const getMemberUserId = (member) =>
  member?.user?.id ??
  member?.staff?.user?.id ??
  member?.userId ??
  member?.staffId ??
  member?.user_id ??
  member?.staff_id ??
  member?.staff?.id ??
  member?.id;

const removeMemberFromGroup = (group, userId) => {
  const userIdText = String(userId);
  const nextGroup = { ...group };

  ["members", "staffs", "users"].forEach((key) => {
    if (Array.isArray(group[key])) {
      nextGroup[key] = group[key].filter(
        (member) => String(getMemberUserId(member)) !== userIdText,
      );
    }
  });

  if (typeof group.membersCount === "number") {
    nextGroup.membersCount = Math.max(0, group.membersCount - 1);
  }

  if (typeof group.memberCount === "number") {
    nextGroup.memberCount = Math.max(0, group.memberCount - 1);
  }

  return nextGroup;
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

export const useGroupStore = defineStore("group", {
  state: () => ({
    groups: [],
    managers: [],
    staffs: [],
    loading: false,
    managersLoading: false,
    staffsLoading: false,
    error: null,
  }),

  actions: {
    async fetchGroups(params = {}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.get("/groups", {
          params: {
            _page: 1,
            _per_page: 10,
            ...params,
          },
        });

        this.groups = normalizeGroups(response.data);
      } catch (error) {
        this.groups = [];
        this.error = getErrorMessage(error, "Failed to load groups");
        console.error("Fetch groups error:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchManagers(params = {}) {
      this.managersLoading = true;
      this.error = null;

      try {
        const response = await api.get("/users", {
          params: {
            _page: 1,
            _per_page: 100,
            status: "ACTIVATED",
            sortBy: "createdAt",
            sortDir: "DESC",
            ...params,
          },
        });

        const users = normalizeList(response.data);
        this.managers = users.filter((user) => {
          const roleId = Number(user.role?.id ?? user.roleId);
          const roleName = String(user.role?.name || "").toUpperCase();
          return roleId === 2 || roleName === "MANAGER";
        });
      } catch (error) {
        this.managers = [];
        this.error = getErrorMessage(error, "Failed to load managers");
        console.error("Fetch managers error:", error);
      } finally {
        this.managersLoading = false;
      }
    },

    async fetchStaffs(params = {}) {
      this.staffsLoading = true;
      this.error = null;

      try {
        const response = await api.get("/users", {
          params: {
            _page: 1,
            _per_page: 100,
            status: "ACTIVATED",
            sortBy: "createdAt",
            sortDir: "DESC",
            ...params,
          },
        });

        const users = normalizeList(response.data);
        this.staffs = users.filter((user) => {
          const roleId = Number(user.role?.id ?? user.roleId);
          const roleName = String(user.role?.name || "").toUpperCase();
          return roleId === 3 || roleName === "STAFF";
        });
      } catch (error) {
        this.staffs = [];
        this.error = getErrorMessage(error, "Failed to load staff");
        console.error("Fetch staff error:", error);
      } finally {
        this.staffsLoading = false;
      }
    },

    async fetchGroupWithMembers(id) {
      this.error = null;
      let group = null;

      try {
        const response = await api.get(`/groups/${id}`);
        group = normalizeCreatedGroup(response.data);

        if (group?.id) {
          this.groups = mergeGroupById(this.groups, id, group);
        }
      } catch (error) {
        const status = error.response?.status;

        if (![404, 405].includes(status)) {
          this.error = getErrorMessage(error, "Failed to load group members");
          console.error(
            "Fetch group detail response:",
            JSON.stringify(error.response?.data, null, 2),
          );
          console.error("Fetch group detail error:", error);
          return false;
        }
      }

      if (hasMembersList(group)) {
        return group;
      }

      try {
        const response = await api.get(`/groups/${id}/members`);
        const members = normalizeMembers(response.data);
        const currentGroup = this.groups.find(
          (item) => String(item.id) === String(id),
        );
        group = {
          ...(currentGroup || {}),
          ...(group || {}),
          id: group?.id ?? currentGroup?.id ?? id,
          members,
          memberCount: members.length,
        };

        this.groups = mergeGroupById(this.groups, id, group);
        return group;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to load group members");
        console.error(
          "Fetch group members response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("Fetch group members error:", error);
        return group || false;
      }
    },

    async createGroup(payload) {
      this.error = null;

      try {
        const response = await api.post("/groups", payload);
        const createdGroup = normalizeCreatedGroup(response.data);

        if (createdGroup?.id) {
          this.groups = [createdGroup, ...this.groups];
        } else {
          await this.fetchGroups();
        }

        return createdGroup || true;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to create group");
        console.error(
          "Create group response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("Create group error:", error);
        return false;
      }
    },

    async updateGroup(id, payload) {
      this.error = null;

      try {
        const response = await api.put(`/groups/${id}`, payload);
        const updatedGroup = normalizeCreatedGroup(response.data);

        if (updatedGroup?.id) {
          this.groups = this.groups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
        } else {
          await this.fetchGroups();
        }

        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to update group");
        console.error(
          "Update group response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("Update group error:", error);
        return false;
      }
    },

    async uploadGroupThumbnail(id, file) {
      this.error = null;

      try {
        const formData = new FormData();
        formData.append("thumbnail", file);

        const response = await api.post(`/groups/${id}/thumbnail`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updatedGroup = normalizeCreatedGroup(response.data);

        if (updatedGroup?.id) {
          this.groups = this.groups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
        } else {
          await this.fetchGroups();
        }

        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to upload group thumbnail");
        console.error(
          "Upload group thumbnail response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("Upload group thumbnail error:", error);
        return false;
      }
    },

    async addGroupMembers(id, userIds) {
      this.error = null;

      try {
        const response = await api.post(`/groups/${id}/members`, { userIds });
        const updatedGroup = normalizeCreatedGroup(response.data);

        if (updatedGroup?.id) {
          this.groups = this.groups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
        } else {
          await this.fetchGroups();
        }

        return true;
      } catch (error) {
        this.error = getErrorMessage(error, "Failed to add members to group");
        console.error(
          "Add group members response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("Add group members error:", error);
        return false;
      }
    },

    async removeGroupMember(id, userId) {
      this.error = null;

      try {
        const normalizedUserId = Number.isNaN(Number(userId))
          ? userId
          : Number(userId);
        let response;

        try {
          response = await api.delete(
            `/groups/${id}/members/${normalizedUserId}`,
          );
        } catch (error) {
          const status = error.response?.status;

          if (![404, 405].includes(status)) {
            throw error;
          }

          response = await api.delete(`/groups/${id}/members`, {
            data: { userIds: [normalizedUserId] },
          });
        }

        const updatedGroup = normalizeCreatedGroup(response.data);

        if (updatedGroup?.id) {
          this.groups = this.groups.map((group) =>
            String(group.id) === String(id) ? updatedGroup : group,
          );
          return updatedGroup;
        }

        this.groups = this.groups.map((group) =>
          String(group.id) === String(id)
            ? removeMemberFromGroup(group, normalizedUserId)
            : group,
        );

        return true;
      } catch (error) {
        this.error = getErrorMessage(
          error,
          "Failed to remove member from group",
        );
        console.error(
          "Remove group member response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("Remove group member error:", error);
        return false;
      }
    },

    async deleteGroup(id) {
      this.error = null;

      try {
        await api.delete(`/groups/${id}`);
        this.groups = this.groups.filter((group) => group.id !== id);
        return true;
      } catch (error) {
        this.error = error.response?.data?.message || "Failed to delete group";
        console.error("Delete group error:", error);
        return false;
      }
    },
  },
});
