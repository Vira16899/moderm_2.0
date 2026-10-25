<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-normal text-gray-900 mb-2">គ្រប់គ្រងក្រុម</h1>
        <p class="text-gray-500">បង្កើត និងគ្រប់គ្រងក្រុមបុរស និងការចាត់តាំង</p>
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
    <div
      class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="relative w-full sm:max-w-md">
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
      <div
        class="self-start sm:self-auto px-4 py-2 bg-white text-gray-500 text-sm border border-gray-100 rounded-full shadow-sm whitespace-nowrap"
      >
        សរុប:
        <span class="font-medium text-gray-800">{{ totalGroupsCount }}</span>
        ក្រុម
      </div>
    </div>

    <!-- Groups Grid -->
    <div
      v-if="isLoadingGroups"
    >
      <SkeletonLoader type="card" :rows="6" />
    </div>

    <div
      v-else-if="paginatedGroups.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="group in paginatedGroups"
        :key="group.id"
        role="button"
        tabindex="0"
        class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:bg-gray-50 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
        @click="handleViewDetail(group)"
        @keydown.enter.self="handleViewDetail(group)"
        @keydown.space.prevent.self="handleViewDetail(group)"
      >
        <!-- Thumbnail -->
        <div
          class="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100"
        >
          <img
            v-if="group.thumbnail"
            :src="group.thumbnail"
            class="w-full h-full object-cover"
          />
          <div v-else class="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon class="w-12 h-12" />
            <span class="text-xs font-normal uppercase tracking-widest"
              >គ្មានរូបភាព</span
            >
          </div>
          <div class="group-thumbnail-actions">
            <button
              type="button"
              @click.stop="handleUploadThumbnail(group)"
              class="group-thumbnail-action group-thumbnail-action--update"
              title="កែប្រែរូបភាពក្រុម"
            >
              <UploadIcon class="w-4 h-4" />
            </button>
            <button
              v-if="group.thumbnail"
              type="button"
              @click.stop="handleDeleteThumbnailFromCard(group)"
              class="group-thumbnail-action group-thumbnail-action--delete"
              title="លុបរូបភាពក្រុម"
              :disabled="isUploadingThumbnail"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-normal text-gray-900 mb-1">
                {{ group.name }}
              </h3>
              <p
                class="text-xs text-gray-500 uppercase tracking-wider font-normal"
              >
                អ្នកគ្រប់គ្រង: {{ group.managerName }}
              </p>
            </div>
            <div
              class="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100"
            >
              <UsersIcon class="w-3.5 h-3.5 text-[#84A98C]" />
              <span class="text-xs font-normal text-gray-700">{{
                group.memberCount
              }}</span>
            </div>
          </div>

          <p class="text-sm text-gray-600 line-clamp-2 mb-6 min-h-[40px]">
            {{ group.description || "មិនមានការពិពណ៌នាសម្រាប់ក្រុមនេះទេ។" }}
          </p>

          <div
            class="flex items-center gap-2 text-xs text-gray-500 mb-4"
          >
            <CalendarDaysIcon class="w-4 h-4 text-[#84A98C]" />
            <span>ថ្ងៃបង្កើត: {{ formatDate(group.createdAt) }}</span>
          </div>

          <div class="flex items-center gap-2 pt-4 border-t border-gray-100">
            <button
              @click.stop="handleManageMembers(group)"
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
            >
              <UserPlusIcon class="w-4 h-4" />
              សមាជិក
            </button>
            <button
              @click.stop="handleEdit(group)"
              class="p-2 bg-gray-50 text-blue-600 rounded-lg hover:bg-blue-50 transition-all border border-gray-200"
            >
              <EditIcon class="w-4 h-4" />
            </button>
            <button
              @click.stop="handleDelete(group)"
              class="p-2 bg-gray-50 text-red-600 rounded-lg hover:bg-red-50 transition-all border border-gray-200"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!isLoadingGroups && filteredGroups.length > 0"
      class="bg-white border border-gray-100 rounded-xl px-6 py-4 shadow-sm flex items-center justify-between"
    >
      <p class="text-sm text-gray-400 font-medium">
        ទំព័រ <span class="text-gray-900 font-bold">{{ currentPage }}</span> នៃ
        <span class="text-gray-900 font-bold">{{ totalPages }}</span>
      </p>
      <div class="flex items-center gap-2">
        <button
          @click="handlePageChange(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          មុន
        </button>
        <button
          @click="handlePageChange(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          បន្ទាប់
        </button>
      </div>
    </div>

    <div
      v-if="!isLoadingGroups && (groups.length === 0 || filteredGroups.length === 0)"
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
      :show-manager-field="true"
      :managers="managers"
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

    <!-- Delete Confirm -->
    <ConfirmDialog
      :is-open="showDeleteDialog"
      title="លុបក្រុម"
      :message="`តើអ្នកប្រាកដជាចង់លុបក្រុម '${selectedGroup?.name}' មែនទេ? វានឹងដកការចាត់តាំងសមាជិកទាំងអស់។`"
      confirm-text="បញ្ជាក់ការលុប"
      variant="danger"
      @close="showDeleteDialog = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Users as UsersIcon,
  UsersRound as UsersRoundIcon,
  UserPlus as UserPlusIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  CalendarDays as CalendarDaysIcon,
} from "lucide-vue-next";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import GroupFormModal from "@/components/ui/base/GroupFormModal.vue";
import GroupMembersModal from "@/components/ui/base/GroupMembersModal.vue";
import ThumbnailUploadModal from "@/components/ui/base/ThumbnailUploadModal.vue";
import { useToastStore } from "@/stores/toast";
import { groupsApi, usersApi } from "@/api/api";

const toastStore = useToastStore();
const router = useRouter();

const groups = ref([]);
const users = ref([]);
const searchTerm = ref("");
const currentPage = ref(1);
const totalGroups = ref(0);
const itemsPerPage = 6;
const isLoadingGroups = ref(false);
const isSavingGroup = ref(false);
const isUpdatingMembers = ref(false);
const isDeletingGroup = ref(false);
const isUploadingThumbnail = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteDialog = ref(false);
const showMembersModal = ref(false);
const showUploadModal = ref(false);
const selectedGroup = ref(null);
const selectedUsersToAdd = ref([]);

const formData = reactive({
  name: "",
  managerId: "",
  description: "",
  thumbnailFile: null,
  thumbnailPreview: "",
  thumbnailRemoved: false,
});

const managers = computed(() =>
  users.value.filter((u) => u.role === "MANAGER" || Number(u.roleId) === 2),
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredGroups.value.length / itemsPerPage)),
);

const totalGroupsCount = computed(
  () => totalGroups.value || groups.value.length,
);

const getResponseData = (response) => response.data?.data || response.data;

const getGroupsList = (data) =>
  data.groups ||
  data.items ||
  data.results ||
  data.records ||
  data.data ||
  (Array.isArray(data) ? data : []);

const getGroupData = (data) => data.group || data.item || data.record || data;

const getGroupsTotal = (data, list) =>
  Number(
    data.total ||
      data.totalItems ||
      data.totalGroups ||
      data.totalRecords ||
      data.meta?.total ||
      data.pagination?.total ||
      list.length,
  );

const getUsersList = (data) =>
  data.users ||
  data.items ||
  data.results ||
  data.records ||
  data.data ||
  (Array.isArray(data) ? data : []);

const filteredGroups = computed(() => {
  const term = searchTerm.value.toLowerCase().trim();
  if (!term) return groups.value;

  return groups.value.filter(
    (group) =>
      group.name.toLowerCase().includes(term) ||
      group.description?.toLowerCase().includes(term) ||
      group.managerName?.toLowerCase().includes(term),
  );
});

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredGroups.value.slice(start, start + itemsPerPage);
});

const getGroupMembers = (group) =>
  group.members ||
  group.users ||
  group.staff ||
  group.staffs ||
  group.groupMembers ||
  group.group_members ||
  [];

const mergeSelectedGroup = (groupData) => {
  if (!selectedGroup.value || !groupData) return;

  const normalizedGroup = normalizeGroup({
    ...selectedGroup.value,
    ...groupData,
  });

  selectedGroup.value = normalizedGroup;

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
      groupData?.memberCount ||
        groupData?.member_count ||
        groupData?.membersCount ||
        0,
    );

    if (getGroupMembers(groupData).length > 0 || memberCount === 0) {
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

const normalizeRole = (role) => {
  if (!role) return "";
  if (typeof role === "object") {
    return normalizeRole(role.name || role.role || role.code || role.value);
  }
  return String(role).trim().toUpperCase();
};

const getRoleName = (roleId) => {
  const roles = {
    1: "ADMIN",
    2: "MANAGER",
    3: "STAFF",
  };

  return roles[Number(roleId)] || "";
};

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
    role:
      normalizeRole(source.role || source.userRole || source.type) ||
      getRoleName(source.roleId || source.role_id),
    roleId:
      source.roleId ||
      source.role_id ||
      source.role?.id ||
      source.userRole?.id ||
      "",
  };
};

const normalizeMemberUser = (member) =>
  normalizeUser({
    ...member,
    ...(member.user || member.profile || {}),
    id: getMemberId(member),
  });

const getManagerName = (group) =>
  group.managerName ||
  group.manager_name ||
  group.manager?.fullName ||
  group.manager?.fullname ||
  group.manager?.name ||
  group.manager?.email ||
  "-";

const getDateValue = (item, keys) =>
  keys.map((key) => item?.[key]).find(Boolean) || "";

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("km-KH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
};

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
    managerId: group.managerId || group.manager_id || group.manager?.id || "",
    managerName: getManagerName(group),
    memberIds: memberIds.map(String),
    memberCount:
      group.memberCount ||
      group.member_count ||
      group.membersCount ||
      members.length ||
      memberIds.length ||
      0,
    thumbnail:
      group.thumbnail || group.thumbnailUrl || group.thumbnail_url || group.image || "",
    description: group.description || "",
    createdAt: getDateValue(group, [
      "createdAt",
      "created_at",
      "createdOn",
      "created_on",
      "createdDate",
      "created_date",
    ]),
    updatedAt: getDateValue(group, [
      "updatedAt",
      "updated_at",
      "updatedOn",
      "updated_on",
      "modifiedAt",
      "modified_at",
    ]),
    members: members.map(normalizeMemberUser),
  };
};

const getGroupPayload = () => ({
  name: formData.name,
  description: formData.description,
  managerId: Number(formData.managerId),
});

const fetchGroups = async () => {
  isLoadingGroups.value = true;

  try {
    const response = await groupsApi.getGroups(null, {
      params: {
        _page: 1,
        _per_page: 1000,
      },
    });
    const data = getResponseData(response);
    const list = getGroupsList(data);

    groups.value = list.map(normalizeGroup);
    totalGroups.value = getGroupsTotal(data, list);
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យក្រុមបានទេ",
    );
    groups.value = [];
    totalGroups.value = 0;
  } finally {
    isLoadingGroups.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const response = await usersApi.getUsers(null, {
      params: {
        _page: 1,
        _per_page: 100,
        search: "",
        status: "ACTIVATED",
        sortBy: "createdAt",
        sortDir: "DESC",
      },
    });
    const data = getResponseData(response);
    const list = getUsersList(data);

    users.value = list.map(normalizeUser);
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចទាញយកទិន្នន័យអ្នកប្រើប្រាស់បានទេ",
    );
    users.value = [];
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

let searchTimer;

watch(searchTerm, () => {
  clearTimeout(searchTimer);
  currentPage.value = 1;
});

const currentMembers = computed(() => {
  if (!selectedGroup.value) return [];

  const groupMembers = selectedGroup.value.members || [];
  const activeMemberIds = new Set(
    [
      ...(selectedGroup.value.memberIds || []),
      ...groupMembers.map((member) => member.id),
    ].map(String),
  );
  const membersById = new Map(
    groupMembers
      .map(normalizeUser)
      .filter((member) => member.id)
      .map((member) => [String(member.id), member]),
  );

  users.value
    .filter((user) => activeMemberIds.has(String(user.id)))
    .forEach((user) => {
      membersById.set(String(user.id), user);
    });

  return [...membersById.values()];
});

const availableUsers = computed(() => {
  if (!selectedGroup.value) return [];
  const activeMemberIds = new Set(
    [
      ...(selectedGroup.value.memberIds || []),
      ...(selectedGroup.value.members || []).map((member) => member.id),
    ].map(String),
  );

  return users.value.filter(
    (u) =>
      (u.role === "STAFF" || Number(u.roleId) === 3) &&
      !activeMemberIds.has(String(u.id)),
  );
});

const handleCreate = () => {
  Object.keys(formData).forEach((k) => (formData[k] = ""));
  formData.thumbnailFile = null;
  formData.thumbnailPreview = "";
  formData.thumbnailRemoved = false;
  showCreateModal.value = true;
};

const handleEdit = (group) => {
  selectedGroup.value = group;
  Object.assign(formData, {
    name: group.name,
    managerId: group.managerId,
    description: group.description || "",
    thumbnailFile: null,
    thumbnailPreview: group.thumbnail || "",
    thumbnailRemoved: false,
  });
  showEditModal.value = true;
};

const handleManageMembers = async (group) => {
  selectedGroup.value = group;
  selectedUsersToAdd.value = [];
  if (!users.value.length) {
    await fetchUsers();
  }
  await loadSelectedGroupMembers();
  showMembersModal.value = true;
};

const handleUploadThumbnail = (group) => {
  selectedGroup.value = group;
  showUploadModal.value = true;
};

const handleViewDetail = (group) => {
  if (!group?.id) return;

  router.push({ name: "AdminGroupDetail", params: { id: group.id } });
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
    ...(selectedGroup.value.memberIds || []).map(String),
    ...normalizedIds,
  ]);
  const membersById = new Map(
    (selectedGroup.value.members || [])
      .filter((member) => member.id)
      .map((member) => [String(member.id), member]),
  );

  addedUsers.forEach((user) => membersById.set(String(user.id), user));

  selectedGroup.value.memberIds = [...memberIds];
  selectedGroup.value.members = [...membersById.values()];
  selectedGroup.value.memberCount = selectedGroup.value.memberIds.length;

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
    toastStore.success("បានដកសមាជិកចេញ");
    showMembersModal.value = false;
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចដកសមាជិកចេញបានទេ");
  } finally {
    isUpdatingMembers.value = false;
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
    toastStore.error(
      err.response?.data?.message || "មិនអាចអាប់ឡូតរូបភាពបានទេ",
    );
  } finally {
    isUploadingThumbnail.value = false;
  }
};

const handleDeleteThumbnail = async () => {
  if (!selectedGroup.value?.id) return;

  isUploadingThumbnail.value = true;

  try {
    await groupsApi.deleteThumbnail(selectedGroup.value.id);
    toastStore.success("បានដករូបភាពចេញ");
    showUploadModal.value = false;
    await fetchGroups();
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || "មិនអាចលុបរូបភាពបានទេ",
    );
  } finally {
    isUploadingThumbnail.value = false;
  }
};

const handleDeleteThumbnailFromCard = (group) => {
  selectedGroup.value = group;
  handleDeleteThumbnail();
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
      const createdGroup = normalizeGroup(getGroupData(getResponseData(response)));
      targetGroupId = createdGroup.id;
      toastStore.success("បានបង្កើតក្រុម");
    }

    if (formData.thumbnailFile) {
      if (!targetGroupId) {
        await fetchGroups();
        targetGroupId = groups.value.find(
          (group) =>
            group.name === formData.name &&
            String(group.managerId) === String(formData.managerId),
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

const handleDelete = (group) => {
  selectedGroup.value = group;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!selectedGroup.value?.id) return;

  isDeletingGroup.value = true;

  try {
    await groupsApi.deleteGroup(selectedGroup.value.id);
    toastStore.success("បានលុបក្រុម");
    showDeleteDialog.value = false;
    await fetchGroups();
  } catch (err) {
    toastStore.error(err.response?.data?.message || "មិនអាចលុបក្រុមបានទេ");
  } finally {
    isDeletingGroup.value = false;
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
  fetchUsers();
});
</script>

<style scoped>
.group-thumbnail-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.group:hover .group-thumbnail-actions,
.group:focus-within .group-thumbnail-actions {
  opacity: 1;
  transform: translateY(0);
}

.group-thumbnail-action {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 10px;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.58);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(8px);
  transition:
    background-color 0.22s ease,
    border-color 0.22s ease,
    transform 0.22s ease;
}

.group-thumbnail-action:hover:not(:disabled) {
  transform: translateY(-2px);
}

.group-thumbnail-action--update:hover:not(:disabled) {
  border-color: #84a98c;
  background: #84a98c;
}

.group-thumbnail-action--delete:hover:not(:disabled) {
  border-color: #ef4444;
  background: #ef4444;
}

.group-thumbnail-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

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
