﻿﻿﻿<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-normal text-gray-900 mb-2">ក្រុមរបស់ខ្ញុំ</h1>
        <p class="text-gray-500 font-normal">
          គ្រប់គ្រងក្រុមបុគ្គលិក និងការចាត់តាំងរបស់អ្នក
        </p>
      </div>
      <button
        @click="handleCreate"
        class="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#84A98C] text-white rounded-lg font-normal hover:opacity-90 transition-all shadow-md"
      >
        <PlusIcon class="w-5 h-5" />
        បង្កើតក្រុមថ្មី
      </button>
    </div>

    <!-- Search -->
    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div class="relative max-w-md">
        <SearchIcon
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="ស្វែងរកក្រុមតាមឈ្មោះ..."
          class="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
        />
      </div>
    </div>

    <!-- Groups Grid -->
    <div v-if="isLoadingGroups" key="groups-loading">
      <SkeletonLoader type="card" :rows="6" />
    </div>

    <div
      v-else-if="displayGroups.length > 0"
      key="groups-grid"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="group in displayGroups"
        :key="group.id"
        class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
      >
        <!-- Thumbnail -->
        <div
          class="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100"
        >
          <img
            v-if="group.thumbnail"
            key="group-thumb"
            :src="group.thumbnail"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            key="group-no-thumb"
            class="flex flex-col items-center gap-2 text-gray-300"
          >
            <ImageIcon class="w-12 h-12" />
            <span class="text-xs font-normal uppercase tracking-widest"
              >មិនមានរូបភាព</span
            >
          </div>

          <button
            @click="handleUploadThumbnail(group)"
            class="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
            title="កែប្រែរូបភាពក្រុម"
          >
            <UploadIcon class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-normal text-gray-900 mb-1">
                {{ group.name }}
              </h3>
              <p
                class="text-xs text-gray-400 uppercase tracking-wider font-normal"
              >
                អ្នកគ្រប់គ្រង: អ្នក
              </p>
            </div>
            <div
              class="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100"
            >
              <UsersIcon class="w-3.5 h-3.5 text-[#84A98C]" />
              <span class="text-xs font-normal text-gray-600">{{
                group.memberCount
              }}</span>
            </div>
          </div>

          <p
            class="text-sm text-gray-500 line-clamp-2 mb-6 min-h-[40px] font-normal"
          >
            {{ group.description || "មិនមានការពិពណ៌នាសម្រាប់ក្រុមនេះទេ។" }}
          </p>

          <div class="flex items-center gap-2 pt-4 border-t border-gray-100">
            <button
              @click="handleManageMembers(group)"
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
            >
              <UserPlusIcon class="w-4 h-4" />
              សមាជិក
            </button>
            <button
              @click="handleEdit(group)"
              class="p-2 bg-gray-50 text-blue-600 rounded-lg hover:bg-blue-50 transition-all border border-gray-200"
            >
              <EditIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <PaginationGroup
      v-if="!isLoadingGroups && filteredGroups.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="handlePageChange"
    />

    <div
      v-if="!isLoadingGroups && filteredGroups.length === 0"
      key="groups-empty"
      class="bg-white border border-gray-100 rounded-xl p-12 shadow-sm"
    >
      <EmptyState
        :icon="UsersRoundIcon"
        :title="isLoadingGroups ? 'កំពុងទាញយកក្រុម...' : 'រកមិនឃើញក្រុម'"
        :description="
          isLoadingGroups
            ? 'សូមរង់ចាំបន្តិច'
            : searchTerm
              ? `មិនមានក្រុមដែលត្រូវនឹង '${searchTerm}' ទេ`
              : 'ចាប់ផ្តើមដោយបង្កើតក្រុមដំបូងរបស់អ្នក!'
        "
      />
    </div>

    <!-- Create/Edit Modal -->
    <GroupFormModal
      :is-open="showCreateModal || showEditModal"
      :is-edit="showEditModal"
      :loading="isSavingGroup"
      :initial-data="formData"
      @close="closeModals"
      @submit="handleFormSubmit"
    />

    <!-- Members Modal -->
    <GroupMembersModal
      :is-open="showMembersModal"
      :loading="isUpdatingMembers"
      :group-name="selectedGroup?.name"
      :available-users="availableUsers"
      :current-members="currentMembers"
      @close="showMembersModal = false"
      @add-members="handleAddMembers"
      @remove-member="handleRemoveSingleMember"
    />

    <!-- Thumbnail Modal -->
    <ThumbnailUploadModal
      :is-open="showUploadModal"
      :loading="isUploadingThumbnail"
      :has-thumbnail="!!(selectedGroup && selectedGroup.thumbnail)"
      @close="showUploadModal = false"
      @submit="handleUploadSubmit"
      @delete="handleDeleteThumbnail"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import {
  Plus as PlusIcon,
  Edit as EditIcon,
  Users as UsersIcon,
  UsersRound as UsersRoundIcon,
  UserPlus as UserPlusIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  Search as SearchIcon,
} from "lucide-vue-next";
import EmptyState from "@/components/common/EmptyState.vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import PaginationGroup from "@/components/common/PaginationGroup.vue";
import GroupFormModal from "@/components/ui/base/GroupFormModal.vue";
import GroupMembersModal from "@/components/ui/base/GroupMembersModal.vue";
import ThumbnailUploadModal from "@/components/ui/base/ThumbnailUploadModal.vue";
import { useToastStore } from "@/stores/toast";
import { groupsApi, usersApi } from "@/api/api";

const toastStore = useToastStore();

const groups = ref([]);
const users = ref([]);
const searchTerm = ref("");
const currentPage = ref(1);
const isLoadingGroups = ref(false);
const isSavingGroup = ref(false);
const isUpdatingMembers = ref(false);
const isUploadingThumbnail = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showMembersModal = ref(false);
const showUploadModal = ref(false);
const selectedGroup = ref(null);
const selectedUsersToAdd = ref([]);
const currentMemberIds = ref([]);
const selectedFile = ref(null);
const previewUrl = ref("");
const fileInput = ref(null);

const formData = reactive({
  name: "",
  description: "",
  thumbnailFile: null,
  thumbnailPreview: "",
  thumbnailRemoved: false,
});
const itemsPerPage = 10;

const getResponseData = (response) => response.data?.data || response.data;

const getGroupsList = (data) =>
  data?.groups ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getGroupData = (data) =>
  data?.group || data?.item || data?.record || data;

const getUsersList = (data) =>
  data?.users ||
  data?.staff ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getGroupMembers = (group) =>
  group.members ||
  group.users ||
  group.staff ||
  group.staffs ||
  group.groupMembers ||
  group.group_members ||
  [];

const hasGroupMemberData = (group) => {
  if (!group) return false;

  return (
    getGroupMembers(group).length > 0 ||
    (Array.isArray(group.memberIds) && group.memberIds.length > 0) ||
    (Array.isArray(group.member_ids) && group.member_ids.length > 0)
  );
};

const mergeSelectedGroup = (groupData) => {
  if (!selectedGroup.value || !groupData) return;

  const hasIncomingMemberData = hasGroupMemberData(groupData);
  const normalizedGroup = normalizeGroup({
    ...selectedGroup.value,
    ...groupData,
    members: hasIncomingMemberData
      ? getGroupMembers(groupData)
      : selectedGroup.value.members,
    memberIds:
      groupData.memberIds ||
      groupData.member_ids ||
      (hasIncomingMemberData
        ? getGroupMembers(groupData).map(getMemberId).filter(Boolean)
        : selectedGroup.value.memberIds),
  });

  selectedGroup.value = normalizedGroup;
  currentMemberIds.value = [...(normalizedGroup.memberIds || [])].map(String);

  const index = groups.value.findIndex(
    (group) => group.id === normalizedGroup.id,
  );
  if (index !== -1) {
    groups.value[index] = normalizedGroup;
  }
};

const loadSelectedGroupMembers = async () => {
  if (!selectedGroup.value?.id) return;

  try {
    const response = await groupsApi.getGroup(selectedGroup.value.id);
    const groupData = getGroupData(getResponseData(response));
    mergeSelectedGroup(groupData);

    const memberCount = Number(
      groupData?.memberCount || groupData?.member_count || 0,
    );

    if (hasGroupMemberData(groupData) || memberCount === 0) {
      return;
    }
  } catch {
    // Fall through to the members endpoint below.
  }

  try {
    const response = await groupsApi.getGroupMembers(selectedGroup.value.id);
    const data = getResponseData(response);
    const members = getGroupMembers(data).length
      ? getGroupMembers(data)
      : getGroupsList(data);

    mergeSelectedGroup({
      members,
      memberIds: members.map(getMemberId).filter(Boolean),
    });
  } catch {
    // Some APIs only return counts in the list response; in that case we keep the current data.
  }
};

const getMemberId = (member) =>
  String(
    member?.userId ||
      member?.user_id ||
      member?.user?.id ||
      member?.user?.userId ||
      member?.profile?.id ||
      member?.id ||
      member?.uuid ||
      "",
  );

const toApiId = (id) => {
  const numericId = Number(id);

  return Number.isInteger(numericId) ? numericId : id;
};

const getMemberPayload = (userIds) => ({
  userIds: userIds.map(toApiId).filter((id) => id !== ""),
});

const normalizeUser = (user) => {
  const source = {
    ...user,
    ...(user.user || user.profile || {}),
  };

  return {
    ...source,
    id: String(
      source.id ||
        source.userId ||
        source.user_id ||
        source._id ||
        source.uuid ||
        "",
    ),
    avatar:
      source.avatar ||
      source.avatarUrl ||
      source.avatar_url ||
      source.profileImage ||
      source.profile_image ||
      source.photo ||
      "",
    fullName:
      source.fullName ||
      source.fullname ||
      source.full_name ||
      source.name ||
      source.username ||
      source.displayName ||
      source.display_name ||
      [
        source.firstName || source.first_name,
        source.lastName || source.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      "",
    email: source.email || "",
  };
};

const normalizeMemberUser = (member) =>
  normalizeUser({
    ...member,
    ...(member.user || member.profile || {}),
    id: getMemberId(member),
  });

const normalizeGroup = (group) => {
  const members = getGroupMembers(group);
  const memberIds =
    group.memberIds ||
    group.member_ids ||
    members.map(getMemberId).filter(Boolean);

  return {
    ...group,
    id: String(group.id || group._id || group.uuid || ""),
    name: group.name || group.groupName || group.group_name || "",
    description: group.description || "",
    memberIds: memberIds.map(String),
    memberCount:
      group.memberCount ||
      group.member_count ||
      group.membersCount ||
      members.length ||
      memberIds.length ||
      0,
    thumbnail:
      group.thumbnail ||
      group.thumbnailUrl ||
      group.thumbnail_url ||
      group.image ||
      "",
    members: members.map(normalizeMemberUser),
  };
};

const getGroupPayload = () => ({
  name: formData.name,
  description: formData.description,
});

const refreshSelectedGroup = () => {
  if (!selectedGroup.value?.id) return;
  const listGroup = groups.value.find(
    (group) => group.id === selectedGroup.value.id,
  );

  if (listGroup) {
    const hasListMemberData = hasGroupMemberData(listGroup);

    selectedGroup.value = normalizeGroup({
      ...selectedGroup.value,
      ...listGroup,
      members: hasListMemberData
        ? listGroup.members
        : selectedGroup.value.members,
      memberIds:
        listGroup.memberIds ||
        (hasListMemberData
          ? listGroup.members.map(getMemberId).filter(Boolean)
          : selectedGroup.value.memberIds),
    });
  }

  currentMemberIds.value = [...(selectedGroup.value.memberIds || [])].map(
    String,
  );
};

const fetchGroups = async () => {
  isLoadingGroups.value = true;

  try {
    const response = await groupsApi.getMyGroups();
    const data = getResponseData(response);
    groups.value = getGroupsList(data).map(normalizeGroup);
    refreshSelectedGroup();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យក្រុមបានទេ",
    );
    groups.value = [];
  } finally {
    isLoadingGroups.value = false;
  }
};

const fetchStaff = async () => {
  try {
    const response = await usersApi.getMyStaff();
    const data = getResponseData(response);
    users.value = getUsersList(data).map(normalizeUser);
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យបុគ្គលិកបានទេ",
    );
    users.value = [];
  }
};

const filteredGroups = computed(() => {
  const term = searchTerm.value.toLowerCase().trim();
  if (!term) return groups.value;
  return groups.value.filter(
    (g) =>
      g.name.toLowerCase().includes(term) ||
      g.description?.toLowerCase().includes(term),
  );
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredGroups.value.length / itemsPerPage)),
);

const displayGroups = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredGroups.value.slice(start, start + itemsPerPage);
});

const handlePageChange = (page) => {
  currentPage.value = page;
};

watch(searchTerm, () => {
  currentPage.value = 1;
});

const currentMembers = computed(() => {
  if (!selectedGroup.value) return [];

  const groupMembers = selectedGroup.value.members || [];
  const activeMemberIds = new Set(
    [...currentMemberIds.value, ...groupMembers.map((member) => member.id)].map(
      String,
    ),
  );
  const membersById = new Map(
    groupMembers
      .map(normalizeUser)
      .filter((member) => member.id)
      .map((member) => [String(member.id), member]),
  );

  const supervisedMembers = users.value.filter((u) =>
    activeMemberIds.has(u.id),
  );

  supervisedMembers.forEach((member) => {
    membersById.set(String(member.id), member);
  });

  return [...membersById.values()];
});

const availableUsers = computed(() => {
  if (!selectedGroup.value) return [];
  const activeMemberIds = new Set(
    [
      ...currentMemberIds.value,
      ...(selectedGroup.value.memberIds || []),
      ...(selectedGroup.value.members || []).map((member) => member.id),
    ].map(String),
  );
  return users.value.filter((u) => !activeMemberIds.has(String(u.id)));
});

const handleCreate = () => {
  formData.name = "";
  formData.description = "";
  formData.thumbnailFile = null;
  formData.thumbnailPreview = "";
  formData.thumbnailRemoved = false;
  showCreateModal.value = true;
};

const handleEdit = (group) => {
  selectedGroup.value = group;
  formData.name = group.name;
  formData.description = group.description || "";
  formData.thumbnailFile = null;
  formData.thumbnailPreview = group.thumbnail || "";
  formData.thumbnailRemoved = false;
  showEditModal.value = true;
};

const handleManageMembers = async (group) => {
  selectedGroup.value = group;
  currentMemberIds.value = [...(group.memberIds || [])].map(String);
  selectedUsersToAdd.value = [];
  await loadSelectedGroupMembers();
  showMembersModal.value = true;
};

const handleUploadThumbnail = (group) => {
  selectedGroup.value = group;
  selectedFile.value = null;
  previewUrl.value = group.thumbnail || "";
  showUploadModal.value = true;
};

const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    selectedFile.value = file;
    if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handleUploadSubmit = async (file) => {
  if (!selectedGroup.value?.id || !file) return;

  isUploadingThumbnail.value = true;

  try {
    await groupsApi.uploadThumbnail(selectedGroup.value.id, file);
    toastStore.success("បានធ្វើបច្ចុប្បន្នភាពរូបភាព");
    showUploadModal.value = false;
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចអាប់ឡូតរូបភាពបានទេ");
  } finally {
    isUploadingThumbnail.value = false;
  }
};

const handleDeleteThumbnail = async () => {
  if (!selectedGroup.value?.id) return;

  isUploadingThumbnail.value = true;

  try {
    await groupsApi.deleteThumbnail(selectedGroup.value.id);
    previewUrl.value = "";
    toastStore.success("បានដករូបភាពចេញ");
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចលុបរូបភាពបានទេ");
  } finally {
    isUploadingThumbnail.value = false;
  }
};

const toggleUserToAdd = (id) => {
  const index = selectedUsersToAdd.value.indexOf(id);
  if (index === -1) selectedUsersToAdd.value.push(id);
  else selectedUsersToAdd.value.splice(index, 1);
};

const syncSelectedGroupMembers = (addedIds = []) => {
  if (!selectedGroup.value) return;

  const normalizedIds = addedIds.map(String);
  const addedUsers = users.value.filter((user) =>
    normalizedIds.includes(String(user.id)),
  );
  const memberIds = new Set([
    ...selectedGroup.value.memberIds.map(String),
    ...normalizedIds,
  ]);
  const membersById = new Map(
    (selectedGroup.value.members || []).map((member) => [
      String(member.id),
      member,
    ]),
  );

  addedUsers.forEach((user) => membersById.set(String(user.id), user));

  selectedGroup.value.memberIds = [...memberIds];
  selectedGroup.value.members = [...membersById.values()];
  selectedGroup.value.memberCount = selectedGroup.value.memberIds.length;
  currentMemberIds.value = [...memberIds];

  const group = groups.value.find((item) => item.id === selectedGroup.value.id);
  if (group) {
    group.memberIds = [...selectedGroup.value.memberIds];
    group.members = [...selectedGroup.value.members];
    group.memberCount = selectedGroup.value.memberCount;
  }
};

const handleFormSubmit = (data) => {
  Object.assign(formData, data);
  handleSubmitGroup();
};

const handleAddMembers = async (userIds) => {
  if (!selectedGroup.value?.id || !userIds.length) return;

  const payload = getMemberPayload(userIds);
  if (!payload.userIds.length) return;

  isUpdatingMembers.value = true;

  try {
    await groupsApi.addMembers(selectedGroup.value.id, payload);
    syncSelectedGroupMembers(userIds);
    toastStore.success("បានបន្ថែមសមាជិក");
    showMembersModal.value = false;
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចបន្ថែមសមាជិកបានទេ");
  } finally {
    isUpdatingMembers.value = false;
  }
};

const handleRemoveSingleMember = async (userId) => {
  if (!selectedGroup.value?.id) return;

  const payload = getMemberPayload([userId]);
  if (!payload.userIds.length) return;

  isUpdatingMembers.value = true;

  try {
    await groupsApi.removeMembers(selectedGroup.value.id, payload);
    currentMemberIds.value = currentMemberIds.value.filter(
      (id) => String(id) !== String(userId),
    );
    selectedGroup.value.memberIds = selectedGroup.value.memberIds.filter(
      (id) => String(id) !== String(userId),
    );
    selectedGroup.value.members = (selectedGroup.value.members || []).filter(
      (member) => String(member.id) !== String(userId),
    );
    selectedGroup.value.memberCount = Math.max(
      0,
      Number(selectedGroup.value.memberCount || 0) - 1,
    );
    toastStore.success("បានដកសមាជិកចេញ");
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចដកសមាជិកចេញបានទេ");
  } finally {
    isUpdatingMembers.value = false;
  }
};

const handleSubmitGroup = async () => {
  isSavingGroup.value = true;

  try {
    let targetGroupId = selectedGroup.value?.id;

    if (showEditModal.value) {
      await groupsApi.updateGroup(selectedGroup.value.id, getGroupPayload());
      toastStore.success("បានធ្វើបច្ចុប្បន្នភាពក្រុម");
    } else {
      const response = await groupsApi.createGroup(getGroupPayload());
      const createdGroup = normalizeGroup(
        getGroupData(getResponseData(response)),
      );
      targetGroupId = createdGroup.id;
      toastStore.success("បានបង្កើតក្រុម");
    }

    if (formData.thumbnailFile) {
      if (!targetGroupId) {
        await fetchGroups();
        targetGroupId = groups.value.find(
          (group) => group.name === formData.name,
        )?.id;
      }

      if (targetGroupId) {
        await groupsApi.uploadThumbnail(targetGroupId, formData.thumbnailFile);
        toastStore.success("បានរក្សាទុករូបភាពក្រុម");
      }
    } else if (
      showEditModal.value &&
      formData.thumbnailRemoved &&
      selectedGroup.value?.thumbnail
    ) {
      await groupsApi.deleteThumbnail(selectedGroup.value.id);
      toastStore.success("បានដករូបភាពចេញ");
    }

    closeModals();
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចរក្សាទុកក្រុមបានទេ");
  } finally {
    isSavingGroup.value = false;
  }
};

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedGroup.value = null;
  formData.thumbnailFile = null;
  formData.thumbnailPreview = "";
  formData.thumbnailRemoved = false;
};

onMounted(() => {
  fetchGroups();
  fetchStaff();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
