<template>
  <div class="comment-page">
    <header class="comment-page__head">
      <div>
        <h1>{{ t('admin.comments.title') }}</h1>
        <p>{{ t('admin.comments.hint') }}</p>
      </div>
      <el-button type="primary" @click="openCreate">{{ t('admin.comments.add') }}</el-button>
    </header>

    <section class="board">
      <form class="filters" @submit.prevent="search">
        <el-input
          v-model="keyword"
          clearable
          :placeholder="t('admin.comments.keyword')"
          :aria-label="t('admin.comments.keyword')"
        />
        <el-select
          v-model="spuId"
          filterable
          remote
          clearable
          :remote-method="searchServices"
          :loading="serviceLoading"
          :placeholder="t('admin.comments.servicePlaceholder')"
          :aria-label="t('admin.comments.service')"
        >
          <el-option
            v-for="service in services"
            :key="service.id"
            :label="service.label"
            :value="service.id"
          />
        </el-select>
        <el-select v-model="source" :aria-label="t('admin.comments.source')">
          <el-option :label="t('admin.comments.sourceAll')" value="" />
          <el-option :label="t('admin.comments.manual')" value="manual" />
          <el-option :label="t('admin.comments.real')" value="real" />
        </el-select>
        <el-select v-model="visibility" :aria-label="t('admin.comments.visibility')">
          <el-option :label="t('admin.comments.visibilityAll')" value="" />
          <el-option :label="t('admin.comments.shown')" value="shown" />
          <el-option :label="t('admin.comments.hidden')" value="hidden" />
        </el-select>
        <div class="filters__actions">
          <el-button type="primary" native-type="submit" :loading="loading">{{ t('admin.comments.search') }}</el-button>
          <el-button @click="reset">{{ t('admin.comments.reset') }}</el-button>
        </div>
      </form>

      <el-table :data="rows" v-loading="loading">
        <el-table-column :label="t('admin.comments.service')" min-width="180">
          <template #default="{ row }">
            <div class="who">
              <strong>{{ serviceName(row) }}</strong>
              <small v-if="Number(row.packageService) === 1">{{ t('admin.comments.packageService') }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.rating')" width="150">
          <template #default="{ row }">
            <el-rate :model-value="Number(row.rating) || 0" disabled />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.content')" min-width="240">
          <template #default="{ row }">
            <p class="content">{{ row.content || '—' }}</p>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.author')" min-width="150">
          <template #default="{ row }">
            <div class="who">
              <strong>{{ authorName(row) }}</strong>
              <small>{{ row.userPhone || '—' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.source')" width="110">
          <template #default="{ row }">
            {{ row.isMock ? t('admin.comments.manual') : t('admin.comments.real') }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.order')" width="100">
          <template #default="{ row }">{{ Number(row.orderId) > 0 ? row.orderId : '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.time')" width="160">
          <template #default="{ row }">{{ row.commentTime || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.visibility')" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isShowClient === true"
              :loading="showingId === row.commentId"
              :aria-label="row.isShowClient ? t('admin.comments.hide') : t('admin.comments.show')"
              @change="(value: boolean) => toggleShow(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.comments.delete')" width="90">
          <template #default="{ row }">
            <button type="button" class="danger" :disabled="deletingId === row.commentId" @click="remove(row)">
              {{ t('admin.comments.delete') }}
            </button>
          </template>
        </el-table-column>
        <template #empty>
          <span>{{ t('admin.comments.empty') }}</span>
        </template>
      </el-table>

      <el-pagination
        layout="prev, pager, next, total"
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        @current-change="changePage"
      />
    </section>

    <el-dialog v-model="creating" :title="t('admin.comments.add')" width="min(520px, calc(100vw - 32px))">
      <el-form label-position="top" @submit.prevent="save">
        <el-form-item :label="t('admin.comments.service')" required>
          <el-select
            v-model="draft.spuId"
            class="comment-select"
            filterable
            remote
            clearable
            :remote-method="searchServices"
            :loading="serviceLoading"
            :placeholder="t('admin.comments.servicePlaceholder')"
          >
            <el-option
              v-for="service in services"
              :key="service.id"
              :label="service.label"
              :value="service.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.comments.rating')">
          <el-rate v-model="draft.rating" />
        </el-form-item>
        <el-form-item :label="t('admin.comments.content')" required>
          <el-input
            v-model="draft.content"
            type="textarea"
            :rows="4"
            maxlength="2000"
            show-word-limit
            :placeholder="t('admin.comments.contentPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('admin.comments.userId')">
          <el-input v-model="draft.userId" clearable />
          <small class="field-hint">{{ t('admin.comments.userIdHint') }}</small>
        </el-form-item>
        <el-form-item :label="t('admin.comments.visibility')">
          <el-switch v-model="draft.isShow" :aria-label="t('admin.comments.show')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="creating = false">{{ t('admin.common.back') }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ t('admin.comments.add') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { page as servicePage } from '@/modules/admin/api/spu';
import {
  addMockComment,
  commentPage,
  deleteComment,
  updateCommentShow,
  type CommentRow,
} from '@/modules/admin/api/comment';

type ServiceOption = { id: number; label: string };

const pageSize = 10;
const { t, locale } = useI18n({ useScope: 'global' });
const keyword = ref('');
const spuId = ref<number | undefined>();
const source = ref<'' | 'manual' | 'real'>('');
const visibility = ref<'' | 'shown' | 'hidden'>('');
const pageNum = ref(1);
const total = ref(0);
const rows = ref<CommentRow[]>([]);
const loading = ref(false);
const services = ref<ServiceOption[]>([]);
const serviceLoading = ref(false);
const showingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const creating = ref(false);
const saving = ref(false);
const draft = reactive({
  spuId: undefined as number | undefined,
  rating: 5,
  content: '',
  userId: '',
  isShow: true,
});

function localized(map?: Record<string, string> | null) {
  if (!map) return '';
  const language = String(locale.value || 'zh');
  const base = language.split('-')[0] || language;
  return map[language] || map[base] || map.zh || map.en || Object.values(map).find(Boolean) || '';
}

function serviceName(row: CommentRow) {
  return localized(row.nameI18n) || row.spuName || '—';
}

function authorName(row: CommentRow) {
  if (row.userName) return row.userName;
  if (row.isMock) return t('admin.comments.placeholderAuthor');
  return '—';
}

function pageBody(payload: unknown) {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const nested = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : null;
  if (Array.isArray(nested?.list) || Array.isArray(nested?.records)) return nested as Record<string, unknown>;
  if (Array.isArray(root.list) || Array.isArray(root.records)) return root;
  return nested ?? root;
}

function pageList(payload: unknown) {
  const page = pageBody(payload);
  const list = page.list ?? page.records;
  return Array.isArray(list) ? list : [];
}

let serviceRequest = 0;
async function searchServices(query: string) {
  const request = ++serviceRequest;
  const keywordText = String(query ?? '').trim();
  serviceLoading.value = true;
  try {
    const data = await servicePage({
      pageNum: 1,
      pageSize: 20,
      nameKeyword: keywordText || undefined,
    });
    if (request !== serviceRequest) return;
    const next = pageList(data).flatMap((item) => {
      const row = item && typeof item === 'object' ? item as {
        id?: unknown;
        spu?: { id?: unknown; spuName?: string; packageService?: unknown };
        nameI18n?: Record<string, string>;
      } : {};
      const id = Number(row.spu?.id ?? row.id);
      if (!Number.isSafeInteger(id) || id <= 0) return [];
      const name = localized(row.nameI18n) || row.spu?.spuName || String(id);
      const packageMark = Number(row.spu?.packageService) === 1 ? ` · ${t('admin.comments.packageService')}` : '';
      return [{ id, label: `${name}${packageMark}` }];
    });
    const selectedId = spuId.value || draft.spuId;
    const selected = services.value.find((item) => item.id === selectedId);
    services.value = selected && !next.some((item) => item.id === selected.id) ? [selected, ...next] : next;
  } catch (error: any) {
    if (request !== serviceRequest) return;
    services.value = [];
    ElMessage.error(error?.message || t('admin.comments.loadFailed'));
  } finally {
    if (request === serviceRequest) serviceLoading.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await commentPage({
      pageNum: pageNum.value,
      pageSize,
      keyword: keyword.value.trim() || undefined,
      spuId: spuId.value,
      isMock: source.value === 'manual' ? true : source.value === 'real' ? false : undefined,
      isShowClient: visibility.value === 'shown' ? true : visibility.value === 'hidden' ? false : undefined,
    });
    const page = pageBody(data);
    rows.value = pageList(data) as CommentRow[];
    total.value = Number(page.total) || 0;
    const pages = Math.max(1, Math.ceil(total.value / pageSize));
    if (pageNum.value > pages) {
      pageNum.value = pages;
      await load();
    }
  } catch (error: any) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(error?.message || t('admin.comments.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNum.value = 1;
  void load();
}

function reset() {
  keyword.value = '';
  spuId.value = undefined;
  source.value = '';
  visibility.value = '';
  search();
}

function changePage(page: number) {
  pageNum.value = page;
  void load();
}

function openCreate() {
  draft.spuId = spuId.value;
  draft.rating = 5;
  draft.content = '';
  draft.userId = '';
  draft.isShow = true;
  creating.value = true;
  if (!services.value.length) void searchServices('');
}

async function save() {
  const content = draft.content.trim();
  if (!draft.spuId) {
    ElMessage.error(t('admin.comments.serviceRequired'));
    return;
  }
  if (!content) {
    ElMessage.error(t('admin.comments.contentRequired'));
    return;
  }
  const userText = draft.userId.trim();
  const userId = userText ? Number(userText) : undefined;
  if (userText && (!Number.isSafeInteger(userId) || (userId ?? 0) <= 0)) {
    ElMessage.error(t('admin.comments.userId'));
    return;
  }
  saving.value = true;
  try {
    await addMockComment({
      spuId: draft.spuId,
      content,
      rating: draft.rating || 5,
      userId,
      isShow: draft.isShow,
    });
    creating.value = false;
    ElMessage.success(t('admin.comments.saved'));
    pageNum.value = 1;
    await load();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.comments.saveFailed'));
  } finally {
    saving.value = false;
  }
}

async function toggleShow(row: CommentRow, isShow: boolean) {
  const commentId = Number(row.commentId);
  if (!commentId || showingId.value != null) return;
  const previous = row.isShowClient === true;
  row.isShowClient = isShow;
  showingId.value = commentId;
  try {
    await updateCommentShow(commentId, isShow);
  } catch (error: any) {
    row.isShowClient = previous;
    ElMessage.error(error?.message || t('admin.comments.showFailed'));
  } finally {
    showingId.value = null;
  }
}

async function remove(row: CommentRow) {
  const commentId = Number(row.commentId);
  if (!commentId) return;
  try {
    await ElMessageBox.confirm(t('admin.comments.deleteConfirm'), t('admin.common.confirmTitle'), {
      type: 'warning',
      confirmButtonText: t('admin.comments.delete'),
      cancelButtonText: t('admin.common.back'),
    });
  } catch {
    return;
  }
  deletingId.value = commentId;
  try {
    await deleteComment(commentId);
    ElMessage.success(t('admin.comments.deleted'));
    await load();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.comments.deleteFailed'));
  } finally {
    deletingId.value = null;
  }
}

onMounted(() => {
  void searchServices('');
  void load();
});
</script>

<style scoped>
.comment-page { color: #1c2433; }
.comment-page__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.comment-page__head h1 { margin: 0 0 6px; color: #05152b; font-size: 28px; font-weight: 500; }
.comment-page__head p { margin: 0; max-width: 640px; color: #6d7686; }
.board { padding: 14px; background: #fff; border: 1px solid #e7ebf2; border-radius: 14px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.filters :deep(.el-input),
.filters :deep(.el-select) { width: 180px; }
.filters__actions { display: flex; gap: 8px; }
.who { display: flex; flex-direction: column; gap: 2px; }
.who strong { color: #05152b; }
.who small, .field-hint { color: #6d7686; }
.content { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.danger {
  border: 0;
  background: transparent;
  color: #b42318;
  font: inherit;
  cursor: pointer;
}
.danger:disabled { cursor: default; opacity: 0.6; }
.board :deep(.el-pagination) { justify-content: flex-end; margin-top: 12px; }
.comment-select { width: 100%; }
@media (max-width: 720px) {
  .comment-page__head { flex-direction: column; }
  .filters :deep(.el-input),
  .filters :deep(.el-select) { width: 100%; }
}
</style>
