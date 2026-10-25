import api from "@/api/api";
import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";

export const useArcticleStore = defineStore("arcticles", () => {
  const allArcticles = ref([]);
  const allUsers = ref([])
  const managers = ref([]);
  const searchResults = ref([]);
  const loading = ref(false);
  const search = ref("");
  const userDetail = ref(null);
  const salaryHistory = ref([]);
  const salaryRecord = ref(null)

  const pagination = reactive({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0
  });



const salaryPagination = reactive({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });

  const fectchAllArcticles = async (page = 1) => {
    loading.value = true;

    try {

      const res = await api.get(
        `users?_page=${page}&_per_page=${pagination.perPage}&search=${search.value}&sortBy=id&sortDir=ASC`
      );

      const data = res.data.data.items;
      const meta = res.data.data.meta;

      allArcticles.value = data;
      searchResults.value = data;

      pagination.currentPage = meta.currentPage;
      pagination.perPage = meta.itemPerPage;
      pagination.totalPages = meta.totalPages;
      pagination.totalItems = meta.totalItems;

   

    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };
const fetchAllUsers = async () => {
  try {

    const res = await api.get(
      `users?_page=1&_per_page=100&sortBy=id&sortDir=ASC`
    )

    const users = res.data.data.items || []

    allUsers.value = users

    managers.value = users.filter(
      user => user.role?.id === 2
    )

  } catch (error) {
    console.log("FETCH ALL USERS ERROR:", error)
  }
}


 const createUser = async (payload) => {
  try {
    const requestBody = {
      fullname: payload.fullname,
      email: payload.email,
      password: payload.password,
      roleId: Number(payload.roleId),
      phone: payload.phone,
      gender: payload.gender,
      birthday: payload.birthday,
      hireDate: payload.hireDate,
      salary: Number(payload.salary),
      managerId: payload.managerId ? Number(payload.managerId) : null,
    };

    const res = await api.post("users", requestBody);

    return res.data;

  } catch (error) {

  throw error;
}
};

   const fetchUserDetailById = async (id) => {
      loading.value = true;

      try {
        userDetail.value = null;

        const res = await api.get(`users/${id}`);

        userDetail.value = res.data.data;
        console.log(userDetail.value);

      } catch (error) {
        console.log("DETAIL ERROR:", error.response?.data || error);
      } finally {
        loading.value = false;
      }
}  ;
const updateUser = async (payload) => {
  try {
    const id = payload.id

    // 1. Update main user info
    await api.put(`users/${id}`, {
      fullname: payload.fullname,
      phone: payload.phone,
      gender: payload.gender,
      birthday: payload.birthday,
      hireDate: payload.hireDate,
      roleId: Number(payload.roleId),
      managerId: payload.managerId
    })
    await fetchUserDetailById(id)
    await fectchAllArcticles(pagination.currentPage)

  } catch (error) {
    console.log('UPDATE ERROR:', error.response?.data || error)
    throw error
  }
}
const updateUserStatus = async (id, status) => {
  try {
    await api.put(`users/${id}/status`, {
      status
    })

    await fectchAllArcticles(pagination.currentPage)

  } catch (error) {
    console.log(error)
    throw error
  }
}

//salary history
const fetchSalaryHistoryByStaffId = async (staffId, page = 1) => {
  try {
    loading.value = true;

    const res = await api.get(
      `salary-history/staff/${staffId}?_page=${page}&_per_page=${salaryPagination.perPage}&sortBy=createdAt&sortDir=ASC`
    );

    const response = res.data.data;
    const meta = response.meta;

    salaryHistory.value = response.items || [];

    salaryPagination.currentPage = meta.currentPage;
    salaryPagination.perPage = meta.itemPerPage;
    salaryPagination.totalPages = meta.totalPages;
    salaryPagination.totalItems = meta.totalItems;
    salaryPagination.hasPreviousPage = meta.hasPreviousPage;
    salaryPagination.hasNextPage = meta.hasNextPage;

  } catch (error) {
    console.log("Salary history error:", error.response?.data || error);
  } finally {
    loading.value = false;
  }
};
//salary history by id
const fetchSalaryHistoryDetail = async (id) => {
  try {
    loading.value = true;

    const res = await api.get(`salary-history/${id}`);

    salaryRecord.value = res.data.data;

  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};
// updateUserSalary
const updateUserSalary = async (id, salary, effectiveDate, changeReason) => {
  try {
    const payload = {
      salary: Number(salary),
      effectiveDate: effectiveDate || null,
      changeReason: changeReason?.trim() || ''
    }

    console.log('salary payload:', payload)

    await api.put(`users/${id}/salary`, payload)

    await fetchUserDetailById(id)
    await fectchAllArcticles(pagination.currentPage)

  } catch (error) {
    console.log('SALARY UPDATE ERROR:', error.response?.data || error)
    throw error
  }
}
const deleteUser = async (id) => {
  try {
    await api.delete(`users/${id}`)

    await fectchAllArcticles(pagination.currentPage)

  } catch (error) {
    console.log('DELETE ERROR:', error.response?.data || error)
    throw error
  }
}
  let timer = null;

  watch(search, () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fectchAllArcticles(1);
    }, 400);
  });

  return {
    managers,
    allArcticles,
    searchResults,
    loading,
    search,
    pagination,
    userDetail,
    salaryHistory,
    salaryPagination,
    salaryRecord,
    allUsers,
    fetchAllUsers,
    updateUser,
    deleteUser,
    fectchAllArcticles,
    createUser,
    fetchUserDetailById,
    updateUserStatus,
    updateUserSalary,
    fetchSalaryHistoryByStaffId,
    fetchSalaryHistoryDetail
      
  };
});
