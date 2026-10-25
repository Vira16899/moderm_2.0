<template>
  <article class="admin-group-card d-flex flex-column">
    <div class="admin-group-thumbnail">
      <img
        v-if="thumbnail"
        :src="thumbnail"
        alt="Group"
        class="w-100 h-100 object-fit-cover"
      />
      <div v-else class="thumbnail-placeholder">
        <i class="bi bi-image text-muted"></i>
      </div>

      <div class="thumbnail-actions" v-if="canUpload">
        <button
          class="thumbnail-icon-btn thumbnail-upload-btn"
          type="button"
          title="ប្តូររូបភាព"
          @click="$refs.fileInput.click()"
        >
          <i class="bi bi-camera-fill"></i>
        </button>
        <button
          v-if="thumbnail"
          class="thumbnail-icon-btn thumbnail-delete-btn"
          type="button"
          title="លុបរូបភាព"
          @click="$emit('delete-thumbnail')"
        >
          <i class="bi bi-trash-fill"></i>
        </button>
        <input
          ref="fileInput"
          type="file"
          class="d-none"
          accept="image/*"
          @change="onFileSelected"
        />
      </div>
    </div>

    <div class="admin-group-body flex-grow-1">
      <h5 class="text-truncate" :title="name">{{ name }}</h5>
      <p v-if="description" class="admin-group-description">
        {{ description }}
      </p>
      <div class="admin-group-meta">
        <span>អ្នកគ្រប់គ្រង:</span> {{ managerName }}
      </div>
      <div class="admin-group-meta">
        <i class="bi bi-people me-1"></i> សមាជិកចំនួន {{ membersCount }} នាក់
      </div>
      <div class="admin-group-date">បង្កើតនៅ: {{ createdAt }}</div>
    </div>

    <div class="admin-group-footer">
      <button
        class="btn group-members-btn"
        type="button"
        @click="$emit('members')"
      >
        <i class="bi bi-people me-1" aria-hidden="true"></i> សមាជិក
      </button>
      <div class="group-card-actions">
        <button
          class="group-action-btn edit-action"
          type="button"
          title="កែប្រែ"
          @click="$emit('edit')"
        >
          <i class="bi bi-pencil-square" aria-hidden="true"></i>
        </button>
        <button
          v-if="canDelete"
          class="group-action-btn delete-action"
          type="button"
          title="លុប"
          @click="$emit('delete')"
        >
          <i class="bi bi-trash3" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  thumbnail: String,
  name: { type: String, required: true },
  description: String,
  managerName: String,
  membersCount: { type: Number, default: 0 },
  createdAt: String,
  canDelete: { type: Boolean, default: true },
  canUpload: { type: Boolean, default: true },
});

const emit = defineEmits([
  "edit",
  "delete",
  "members",
  "update-thumbnail",
  "delete-thumbnail",
]);

const onFileSelected = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  emit("update-thumbnail", file);
  event.target.value = "";
};
</script>

<style scoped>
.admin-group-card {
  height: 100%;
  overflow: hidden;
  border: 1px solid #eef2f4;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.07);
  transition: transform 0.2s, box-shadow 0.2s;
}

.admin-group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.admin-group-thumbnail {
  position: relative;
  height: 168px;
  overflow: hidden;
  background: #f3f6f7;
}

.admin-group-thumbnail img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #8a98a6;
}

.thumbnail-placeholder .bi {
  font-size: 3rem;
}

.thumbnail-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.thumbnail-icon-btn {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.14);
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.thumbnail-icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.thumbnail-upload-btn {
  color: #2d6a4f;
}

.thumbnail-delete-btn {
  color: #dc3545;
}

.thumbnail-delete-btn:hover:not(:disabled) {
  color: #ffffff;
  background: #dc3545;
  border-color: #dc3545;
}

.thumbnail-upload-btn:hover {
  color: #ffffff;
  background: #4d7c6e;
  border-color: #4d7c6e;
}

.admin-group-body {
  padding: 18px 18px 6px;
}

.admin-group-body h5 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 800;
}

.admin-group-description {
  display: -webkit-box;
  min-height: 39px;
  margin: 0 0 10px;
  overflow: hidden;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.45;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.admin-group-meta,
.admin-group-date {
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 0.88rem;
}

.admin-group-meta span {
  color: #4b5563;
  font-weight: 500;
}

.admin-group-date {
  margin-bottom: 0;
  font-size: 0.8rem;
}

.admin-group-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 12px 18px 18px;
  padding-top: 14px;
  border-top: 1px solid #edf2f4;
}

.group-members-btn {
  flex: 1 1 auto;
  color: #4d7c6e;
  background: #eef6f5;
  border: 0;
  font-weight: 700;
  border-radius: 7px;
  padding: 8px;
  transition: all 0.2s;
}

.group-members-btn:hover {
  color: #3f665b;
  background: #e1efec;
}

.group-card-actions {
  display: flex;
  gap: 6px;
}

.group-action-btn {
  width: 36px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  line-height: 1;
  transition: all 0.2s;
}

.edit-action {
  color: #2d7a62;
}

.delete-action {
  color: #dc3545;
}

.group-action-btn:hover {
  background: #f3f6f7;
}
</style>
