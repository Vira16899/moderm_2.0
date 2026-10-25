<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-start gap-3">
        <RouterLink
          :to="{ name: 'AdminGroups' }"
          class="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50"
          title="ត្រឡប់ក្រោយ"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </RouterLink>
        <div>
          <p class="text-sm text-gray-400">ព័ត៌មានលម្អិតក្រុម</p>
          <h1 class="text-3xl font-normal text-gray-900">
            {{ group.name || "ក្រុម" }}
          </h1>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="isLoading"
        @click="fetchGroupDetail"
      >
        <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        ផ្ទុកឡើងវិញ
      </button>
    </div>

    <div
      v-if="isLoading"
      class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <SkeletonLoader type="detail" />
    </div>

    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700"
    >
      {{ errorMessage }}
    </div>

    <template v-else>
      <section class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div class="self-start overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div class="flex h-40 items-center justify-center bg-gray-50">
            <img
              v-if="group.thumbnail"
              :src="group.thumbnail"
              :alt="group.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex flex-col items-center gap-2 text-gray-300">
              <ImageIcon class="h-14 w-14" />
              <span class="text-xs uppercase tracking-widest">គ្មានរូបភាព</span>
            </div>
          </div>
          <div class="space-y-4 p-5">
            <div>
              <p class="text-xs uppercase tracking-wider text-gray-400">
                ឈ្មោះក្រុម
              </p>
              <p class="mt-1 text-lg text-gray-900">{{ group.name || "-" }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div class="flex items-center gap-2 text-gray-500">
                  <UsersIcon class="h-4 w-4 text-[#84A98C]" />
                  <span class="text-xs">សមាជិក</span>
                </div>
                <p class="mt-2 text-xl text-gray-900">{{ group.memberCount }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div class="flex items-center gap-2 text-gray-500">
                  <ShieldCheckIcon class="h-4 w-4 text-[#84A98C]" />
                  <span class="text-xs">អ្នកគ្រប់គ្រង</span>
                </div>
                <p class="mt-2 truncate text-sm text-gray-900" :title="group.managerName">
                  {{ group.managerName || "-" }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#84A98C] px-4 py-2.5 text-sm text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isSavingGroup"
              @click="handleEdit"
            >
              <EditIcon class="h-4 w-4" />
              កែប្រែក្រុម
            </button>
          </div>
        </div>

        <div class="space-y-6 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-2">
          <section class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div class="mb-5 flex items-center gap-2">
              <InfoIcon class="h-5 w-5 text-[#84A98C]" />
              <h2 class="text-lg font-normal text-gray-900">ព័ត៌មានទូទៅ</h2>
            </div>

            <dl class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt class="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDaysIcon class="h-4 w-4 text-[#84A98C]" />
                  ថ្ងៃបង្កើត
                </dt>
                <dd class="mt-2 text-gray-900">{{ formatDateTime(group.createdAt) }}</dd>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt class="flex items-center gap-2 text-sm text-gray-500">
                  <Clock3Icon class="h-4 w-4 text-[#84A98C]" />
                  កែចុងក្រោយ
                </dt>
                <dd class="mt-2 text-gray-900">{{ formatDateTime(group.updatedAt) }}</dd>
              </div>
            </dl>

            <div class="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-sm text-gray-500">ការពិពណ៌នា</p>
              <p class="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                {{ group.description || "មិនមានការពិពណ៌នាសម្រាប់ក្រុមនេះទេ។" }}
              </p>
            </div>
          </section>

          <section class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <UsersIcon class="h-5 w-5 text-[#84A98C]" />
                <h2 class="text-lg font-normal text-gray-900">បញ្ជីសមាជិក</h2>
              </div>
              <span class="text-sm text-gray-500">
                សរុប {{ members.length || group.memberCount }} នាក់
              </span>
            </div>

            <div
              v-if="members.length === 0"
              class="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400"
            >
              មិនទាន់មានសមាជិកនៅក្នុងក្រុមនេះទេ។
            </div>

            <div v-else class="max-h-[460px] overflow-auto">
              <table class="min-w-full divide-y divide-gray-100">
                <thead class="sticky top-0 z-10 bg-white">
                  <tr class="text-left text-xs uppercase tracking-wider text-gray-400">
                    <th class="px-3 py-3 font-normal">ឈ្មោះ</th>
                    <th class="px-3 py-3 font-normal">អ៊ីមែល</th>
                    <th class="px-3 py-3 font-normal">តួនាទី</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="member in members" :key="member.id" class="text-sm">
                    <td class="px-3 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-9 w-9 items-center justify-center rounded-full bg-[#84A98C]/15 text-[#527a5c]"
                        >
                          <UserRoundIcon class="h-4 w-4" />
                        </div>
                        <span class="font-normal text-gray-900">
                          {{ member.fullName || "-" }}
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-4 text-gray-500">
                      <div class="flex items-center gap-2">
                        <MailIcon class="h-4 w-4 text-gray-300" />
                        {{ member.email || "-" }}
                      </div>
                    </td>
                    <td class="px-3 py-4 text-gray-500">
                      {{ member.role || "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </template>

    <GroupFormModal
      :is-open="showEditModal"
      :is-edit="true"
      :loading="isSavingGroup"
      :initial-data="formData"
      :show-manager-field="true"
      :managers="managers"
      @close="closeEditModal"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowLeft as ArrowLeftIcon,
  CalendarDays as CalendarDaysIcon,
  Clock3 as Clock3Icon,
  Edit as EditIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  RefreshCw as RefreshCwIcon,
  ShieldCheck as ShieldCheckIcon,
  UserRound as UserRoundIcon,
  Users as UsersIcon,
} from "lucide-vue-next";
import GroupFormModal from "@/components/ui/base/GroupFormModal.vue";
import SkeletonLoader from "@/components/common/SkeletonLoader.vue";
import { groupsApi, usersApi } from "@/api/api";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const toastStore = useToastStore();

const isLoading = ref(false);
const isSavingGroup = ref(false);
const errorMessage = ref("");
const showEditModal = ref(false);
const users = ref([]);
const group = ref({
  id: "",
  name: "",
  managerName: "-",
  memberIds: [],
  memberCount: 0,
  thumbnail: "",
  description: "",
  createdAt: "",
  updatedAt: "",
  members: [],
});

const formData = reactive({
  name: "",
  managerId: "",
  description: "",
  thumbnailFile: null,
  thumbnailPreview: "",
  thumbnailRemoved: false,
});

const managers = computed(() =>
  users.value.filter((user) => user.role === "MANAGER" || Number(user.roleId) === 2),
);

const getResponseData = (response) => response.data?.data || response.data;

const getGroupData = (data) => data?.group || data?.item || data?.record || data;

const getUsersList = (data) =>
  data?.users ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

const getList = (data) =>
  data?.members ||
  data?.users ||
  data?.staff ||
  data?.staffs ||
  data?.groupMembers ||
  data?.group_members ||
  data?.items ||
  data?.results ||
  data?.records ||
  data?.data ||
  (Array.isArray(data) ? data : []);

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

const getManagerName = (item) =>
  item.managerName ||
  item.manager_name ||
  item.manager?.fullName ||
  item.manager?.fullname ||
  item.manager?.name ||
  item.manager?.email ||
  "-";

const getDateValue = (item, keys) =>
  keys.map((key) => item?.[key]).find(Boolean) || "";

const normalizeGroup = (item) => {
  const groupMembers = getList(item);
  const memberIds =
    item.memberIds ||
    item.member_ids ||
    groupMembers.map(getMemberId).filter(Boolean);

  return {
    ...item,
    id: String(item.id || item._id || item.uuid || ""),
    name: item.name || item.groupName || item.group_name || "",
    managerId: item.managerId || item.manager_id || item.manager?.id || "",
    managerName: getManagerName(item),
    memberIds: memberIds.map(String),
    memberCount:
      item.memberCount ||
      item.member_count ||
      item.membersCount ||
      groupMembers.length ||
      memberIds.length ||
      0,
    thumbnail:
      item.thumbnail ||
      item.thumbnailUrl ||
      item.thumbnail_url ||
      item.image ||
      "",
    description: item.description || "",
    createdAt: getDateValue(item, [
      "createdAt",
      "created_at",
      "createdOn",
      "created_on",
      "createdDate",
      "created_date",
    ]),
    updatedAt: getDateValue(item, [
      "updatedAt",
      "updated_at",
      "updatedOn",
      "updated_on",
      "modifiedAt",
      "modified_at",
    ]),
    members: groupMembers.map(normalizeMemberUser),
  };
};

const members = computed(() => group.value.members || []);

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("km-KH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
};

const getGroupPayload = (data) => ({
  name: data.name,
  description: data.description,
  managerId: Number(data.managerId),
});

const mergeMembers = (memberList) => {
  const normalizedMembers = memberList.map(normalizeMemberUser);

  group.value = normalizeGroup({
    ...group.value,
    members: normalizedMembers,
    memberIds: normalizedMembers.map((member) => member.id).filter(Boolean),
    memberCount: normalizedMembers.length || group.value.memberCount,
  });
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

    users.value = getUsersList(data).map(normalizeUser);
  } catch (error) {
    toastStore.error(
      error.response?.data?.message || "មិនអាចទាញយកទិន្នន័យអ្នកគ្រប់គ្រងបានទេ",
    );
    users.value = [];
  }
};

const fetchGroupMembers = async (groupId) => {
  const response = await groupsApi.getGroupMembers(groupId);
  const data = getResponseData(response);
  const memberList = getList(data);

  if (memberList.length) {
    mergeMembers(memberList);
  }
};

const fetchGroupDetail = async () => {
  const groupId = route.params.id;
  if (!groupId) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await groupsApi.getGroup(groupId);
    group.value = normalizeGroup(getGroupData(getResponseData(response)));

    if (!group.value.members.length && Number(group.value.memberCount || 0) > 0) {
      await fetchGroupMembers(groupId);
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || "មិនអាចទាញយកព័ត៌មានក្រុមបានទេ";
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = async () => {
  if (!users.value.length) {
    await fetchUsers();
  }

  Object.assign(formData, {
    name: group.value.name,
    managerId: group.value.managerId,
    description: group.value.description || "",
    thumbnailFile: null,
    thumbnailPreview: group.value.thumbnail || "",
    thumbnailRemoved: false,
  });
  showEditModal.value = true;
};

const handleFormSubmit = async (data) => {
  if (!group.value.id) return;

  isSavingGroup.value = true;

  try {
    await groupsApi.updateGroup(group.value.id, getGroupPayload(data));

    if (data.thumbnailFile) {
      await groupsApi.uploadThumbnail(group.value.id, data.thumbnailFile);
    } else if (data.thumbnailRemoved && group.value.thumbnail) {
      await groupsApi.deleteThumbnail(group.value.id);
    }

    toastStore.success("បានធ្វើបច្ចុប្បន្នភាពក្រុម");
    showEditModal.value = false;
    await fetchGroupDetail();
  } catch (error) {
    toastStore.error(error.response?.data?.message || "មិនអាចរក្សាទុកក្រុមបានទេ");
  } finally {
    isSavingGroup.value = false;
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  formData.thumbnailFile = null;
  formData.thumbnailPreview = "";
  formData.thumbnailRemoved = false;
};

watch(
  () => route.params.id,
  () => {
    fetchGroupDetail();
  },
);

onMounted(() => {
  fetchGroupDetail();
  fetchUsers();
});
</script>
