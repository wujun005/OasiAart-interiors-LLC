<template>
  <div class="page">
    <div v-if="isPackageService" class="package-service-heading">
      <h2>{{ t('admin.packageService.title') }}</h2>
      <p>{{ t('admin.packageService.description') }}</p>
    </div>
    <el-card>
      <div class="toolbar">
        <div class="toolbar-fields">
          <el-select
            v-model="query.categoryId"
            :placeholder="t('admin.product.filters.categoryPlaceholder')"
            clearable
            filterable
            remote
            :remote-method="searchCategoryOptions"
            :loading="categorySearchLoading"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="query.serviceSubCategoryId"
            :placeholder="productText('admin.product.filters.serviceSubCategoryPlaceholder')"
            clearable
            filterable
            remote
            :remote-method="remoteSearchSubCategoryOptions"
            :loading="subCategorySearchLoading"
          >
            <el-option
              v-for="item in searchSubCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-if="!isPackageService"
            v-model="query.shelfStatus"
            :placeholder="t('admin.product.filters.shelfStatusPlaceholder')"
            clearable
          >
            <el-option
              v-for="item in shelfStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-model="query.nameKeyword"
            :placeholder="t('admin.product.filters.nameKeywordPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-select
            v-if="!isPackageService"
            v-model="query.exclusive"
            :placeholder="t('admin.product.filters.exclusivePlaceholder')"
            clearable
          >
            <el-option
              v-for="item in exclusiveOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="toolbar-actions">
          <el-button type="primary" @click="handleSearch">{{ t('admin.product.actions.search') }}</el-button>
          <el-button @click="reset">{{ t('admin.product.actions.reset') }}</el-button>
          <el-button v-if="!isPackageService" :loading="exportLoading" @click="handleExportI18n">
            {{ t('admin.product.actions.export') }}
          </el-button>
          <el-button type="primary" @click="openCreate">{{ t(isPackageService ? 'admin.packageService.create' : 'admin.product.actions.create') }}</el-button>
        </div>
      </div>

      <el-table
        class="product-sort-table"
        :data="products"
        border
        v-loading="tableLoading || sortSubmitting"
        row-key="id"
        :row-class-name="productRowClassName"
        @dragover.prevent="handleProductDragOver"
        @drop.prevent="handleProductDrop"
      >
        <el-table-column
          :label="t('admin.product.table.sort')"
          width="64"
          align="center"
        >
          <template #default="{ row }">
            <button
              class="product-sort-handle"
              type="button"
              :draggable="canSortProducts && !tableLoading && !sortSubmitting"
              :disabled="!canSortProducts || tableLoading || sortSubmitting"
              :title="t('admin.product.table.sortHint')"
              :aria-label="`${t('admin.product.table.sort')}: ${row.name}`"
              @dragstart.stop="handleProductDragStart(row, $event)"
              @dragend.stop="resetProductDrag"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="8" cy="6" r="1.5" />
                <circle cx="16" cy="6" r="1.5" />
                <circle cx="8" cy="12" r="1.5" />
                <circle cx="16" cy="12" r="1.5" />
                <circle cx="8" cy="18" r="1.5" />
                <circle cx="16" cy="18" r="1.5" />
              </svg>
            </button>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.image')" width="76">
          <template #default="{ row }">
            <div class="thumbs">
              <img
                v-for="(img, idx) in row.images.slice(0, 1)"
                :key="idx"
                :src="img"
                alt=""
              />
              <span v-if="row.images.length > 1" class="more"
                >+{{ row.images.length - 1 }}</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          :label="t('admin.product.table.name')"
          min-width="130"
          show-overflow-tooltip
        />
        <el-table-column v-if="isPackageService" :label="t('admin.product.table.packages')" min-width="200">
          <template #default="{ row }">
            <ul v-if="row.packages.length" class="bound-packages">
              <li v-for="pkg in row.packages" :key="pkg.key">
                <RouterLink v-if="pkg.id" :to="{ path: '/admin/package/packages', query: { editId: String(pkg.id) } }">{{ pkg.name }}</RouterLink>
                <span v-else>{{ pkg.name }}</span>
              </li>
            </ul>
            <span v-else class="unbound-package">{{ t('admin.product.text.noPackages') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.tags')" min-width="160">
          <template #default="{ row }">
            <div v-if="productTagLabels(row).length" class="biz-tag-list">
              <el-tag
                v-for="label in productTagLabels(row)"
                :key="label"
                size="small"
                effect="plain"
              >{{ label }}</el-tag>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="categoryName"
          :label="t('admin.product.table.category')"
          min-width="125"
          show-overflow-tooltip
        />
        <el-table-column
          prop="subCategoryName"
          :label="productText('admin.product.table.subcategory')"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="specNames" :label="t('admin.product.table.specs')" min-width="155">
          <template #default="{ row }">
            <el-tooltip
              :content="row.specNames.join(t('admin.product.text.separator')) || '-'"
              placement="top"
              :show-after="250"
            >
              <span class="pricing-rules-chip">
                {{ row.specNames.join(t('admin.product.text.separator')) || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column v-if="!isPackageService" :label="t('admin.product.table.saleStatus')" width="92">
          <template #default="{ row }">
            <el-button
              class="sale-status-button"
              :class="row.isOnSale ? 'is-on' : 'is-off'"
              link
              size="small"
              @click="toggleSale(row)"
            >
              {{ row.isOnSale ? t('admin.product.sale.on') : t('admin.product.sale.off') }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.price')" width="58">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="openPriceDialog(row)"
            >
              {{ t('admin.product.table.price') }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.createdUpdated')" width="132">
          <template #default="{ row }">
            <el-tooltip
              :content="`${t('admin.product.table.createdAt')}: ${formatDate(row.createdAt) || '-'}`"
              placement="top"
              :show-after="250"
            >
              <div class="product-date-line">
                {{ t('admin.product.table.createdAt') }}: {{ formatDate(row.createdAt) || '-' }}
              </div>
            </el-tooltip>
            <el-tooltip
              :content="`${t('admin.product.table.updatedAt')}: ${formatDate(row.updatedAt) || '-'}`"
              placement="top"
              :show-after="250"
            >
              <div class="product-date-line">
                {{ t('admin.product.table.updatedAt') }}: {{ formatDate(row.updatedAt) || '-' }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.actions')" width="70">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" size="small" @click="openEdit(row)">
                {{ t('admin.product.actions.edit') }}
              </el-button>
              <el-button
                v-if="!isPackageService"
                link
                type="primary"
                size="small"
                :disabled="!row.previewUrl"
                @click="openPreview(row)"
              >
                {{ t('admin.product.actions.preview') }}
              </el-button>
              <el-button link type="danger" size="small" @click="remove(row)">
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="!isPackageService" :label="t('admin.product.table.limitedOffer')" width="78">
          <template #default="{ row }">
            <el-button
              link
              :type="row.exclusive ? 'danger' : 'primary'"
              size="small"
              @click="toggleRecommend(row)"
            >
              {{ row.exclusive ? t('admin.product.actions.removeLimited') : t('admin.product.actions.addLimited') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          layout="prev, pager, next, jumper, ->, total, sizes"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isPackageService
        ? t(isEdit ? 'admin.packageService.editTitle' : 'admin.packageService.createTitle')
        : t(isEdit ? 'admin.product.dialog.editTitle' : 'admin.product.dialog.createTitle')"
      :close-on-click-modal="false"
      :close-on-press-escape="!submitLoading"
      :show-close="!submitLoading"
      width="min(760px, calc(100vw - 32px))"
    >
      <el-form v-if="isPackageService && !isEdit" label-width="110px">
        <el-form-item :label="t('admin.packageService.sourceLabel')">
          <div class="source-service-field">
            <el-select
              :model-value="sourceServiceId"
              filterable
              clearable
              :loading="sourceServicesLoading || detailLoading"
              :disabled="submitLoading || uploading"
              :placeholder="t('admin.packageService.sourcePlaceholder')"
              @visible-change="(open) => open && ensureSourceServices()"
              @change="importSourceService"
            >
              <el-option v-for="item in sourceServiceOptions" :key="item.id" :value="item.id" :label="item.name" />
            </el-select>
            <p>{{ t('admin.packageService.sourceHint') }}</p>
          </div>
        </el-form-item>
      </el-form>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        :disabled="detailLoading || submitLoading"
        v-loading="detailLoading"
      >
        <el-form-item :label="t('admin.product.form.category')" prop="product.categoryId">
          <el-select
            v-model="form.product.categoryId"
            :placeholder="t('admin.product.form.categoryPlaceholder')"
            filterable
            remote
            :remote-method="searchCategoryOptions"
            :loading="categorySearchLoading"
            style="width: 100%"
            @change="onCategoryChange"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="productText('admin.product.form.subcategory')" prop="product.subCategoryId">
          <el-select
            v-model="form.product.subCategoryId"
            :placeholder="productText('admin.product.form.subcategoryPlaceholder')"
            filterable
            remote
            :remote-method="remoteSearchSubCategoryOptions"
            :loading="subCategorySearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in filteredSubCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <div class="group-box spec-groups">
          <div class="group-title">{{ t('admin.product.form.specGroupTitle') }}</div>
          <div
            v-for="(group, idx) in form.specGroups"
            :key="idx"
            class="spec-box"
          >
            <div class="spec-box__header">
              <div class="spec-box__title">{{ `${t('admin.product.form.specGroupPrefix')}${idx + 1}` }}</div>
              <el-button
                type="danger"
                link
                :disabled="form.specGroups.length === 1"
                @click="removeSpecGroup(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-form-item
              :prop="`specGroups.${idx}.specTypeId`"
              :label="t('admin.product.form.specType')"
              label-width="90px"
            >
              <el-select
                v-model="group.specTypeId"
                :placeholder="t('admin.product.form.specTypePlaceholder')"
                filterable
                remote
                :remote-method="searchSpecOptions"
                :loading="specSearchLoading"
                style="width: 100%"
                @change="
                  () => {
                    group.specIds = group.specIds.filter((id) =>
                      filteredSpecOptions(
                        group.specTypeId,
                        form.product.subCategoryId,
                      ).some(
                        (o) => o.value === id,
                      ),
                    );
                  }
                "
              >
                <el-option
                  v-for="item in specTypeOptionsFor(group)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :prop="`specGroups.${idx}.specIds`"
              :label="t('admin.product.form.spec')"
              label-width="90px"
            >
              <el-select
                v-model="group.specIds"
                :placeholder="t('admin.product.form.specPlaceholder')"
                multiple
                filterable
                remote
                :remote-method="searchSpecOptions"
                :loading="specSearchLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="item in filteredSpecOptions(group.specTypeId, form.product.subCategoryId)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div v-if="pricedSpecLines(group).length" class="spec-price-lines">
                <p v-for="item in pricedSpecLines(group)" :key="item.value">
                  {{ item.label }}
                  <span>+{{ formatSkuMoney(item.price) }}</span>
                </p>
              </div>
            </el-form-item>
          </div>
          <el-form-item label="" prop="specGroups">
            <el-button type="primary" link @click="addSpecGroup"
              >{{ t('admin.product.actions.addSpecGroup') }}</el-button
            >
          </el-form-item>
        </div>

        <div class="group-box spec-groups">
          <div class="group-title">{{ t('admin.product.form.addonGroupTitle') }}</div>
          <div
            v-for="(group, idx) in form.addonGroups"
            :key="idx"
            class="spec-box"
          >
            <div class="spec-box__header">
              <div class="spec-box__title">{{ `${t('admin.product.form.addonGroupPrefix')}${idx + 1}` }}</div>
              <el-button
                type="danger"
                link
                @click="removeAddonGroup(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-form-item
              :prop="`addonGroups.${idx}.categoryId`"
              :label="t('admin.product.form.addonCategory')"
              label-width="90px"
            >
              <el-select
                v-model="group.categoryId"
                :placeholder="t('admin.product.form.addonCategoryPlaceholder')"
                filterable
                style="width: 100%"
                @change="
                  () => {
                    group.addonIds = (group.addonIds || []).filter((id) =>
                      filteredAddonOptions(group.categoryId).some(
                        (o) => o.value === id,
                      ),
                    );
                  }
                "
              >
                <el-option
                  v-for="item in addonCategoryOptionsFor(group)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :prop="`addonGroups.${idx}.addonIds`"
              :label="t('admin.product.form.addon')"
              label-width="90px"
            >
              <el-select
                v-model="group.addonIds"
                :placeholder="t('admin.product.form.addonPlaceholder')"
                multiple
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in filteredAddonOptions(group.categoryId)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="" prop="addonGroups">
            <el-button type="primary" link @click="addAddonGroup"
              >{{ t('admin.product.actions.addAddonGroup') }}</el-button
            >
          </el-form-item>
        </div>
        <el-form-item v-if="!isPackageService" :label="t('admin.product.form.sale')" prop="product.isOnSale">
          <el-switch v-model="form.product.isOnSale" />
        </el-form-item>
        <el-form-item :label="t('admin.bizTag.label')">
          <div class="biz-tag-picks">
            <span
              v-for="tag in selectedProductTags"
              :key="tag.id"
              class="biz-tag-chip"
            >
              {{ tagPicker.englishLabel(tag) }}
              <button
                type="button"
                :aria-label="t('admin.bizTag.remove')"
                @click="tagPicker.remove(Number(tag.id))"
              >×</button>
            </span>
            <span
              v-for="(name, index) in pendingTagNames"
              :key="`${name}-${index}`"
              class="biz-tag-chip"
            >
              {{ name }}
              <button
                type="button"
                :aria-label="t('admin.bizTag.remove')"
                @click="pendingTagNames.splice(index, 1)"
              >×</button>
            </span>
            <input
              v-if="tagAdderOpen"
              ref="tagDraftRef"
              v-model="tagDraft"
              class="biz-tag-draft"
              type="text"
              maxlength="64"
              :placeholder="t('admin.bizTag.enPlaceholder')"
              @keydown.enter.prevent="confirmEnglishTag"
              @keydown.esc.prevent="closeTagAdder"
              @blur="confirmEnglishTag"
            />
            <button
              v-else
              type="button"
              class="biz-tag-add"
              :aria-label="t('admin.bizTag.create')"
              @click="openTagAdder"
            >
              <el-icon><Plus /></el-icon>
            </button>
          </div>
        </el-form-item>
        <!-- <el-form-item label="币种" prop="product.currency">
          <el-select
            v-model="form.product.currency"
            filterable
            placeholder="选择币种"
            :loading="currencyLoading"
          >
            <el-option
              v-for="item in currencyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item> -->

        <div class="group-box">
          <div class="group-title">{{ t('admin.product.form.nameDescGroupTitle') }}</div>
        <el-form-item :label="t('admin.product.form.nameI18n')" prop="productI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.productI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.langCode"
                :placeholder="t('admin.product.form.languagePlaceholder')"
                filterable
                allow-create
                default-first-option
              >
                <el-option
                  v-for="lang in langOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <el-input v-model="item.name" :placeholder="t('admin.product.form.namePlaceholder')" class="full-width" />
              <el-button
                v-if="form.productI18nList.length > 1"
                type="danger"
                link
                @click="removeLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addLang">{{ t('admin.product.actions.addLang') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.product.form.descI18n')" prop="descI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.descI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.product.form.languagePlaceholder')"
                filterable
                allow-create
                default-first-option
              >
                <el-option
                  v-for="lang in langOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <div class="quill-wrapper">
                <QuillEditor
                  v-model:content="item.value"
                  content-type="html"
                  theme="snow"
                  :placeholder="t('admin.product.form.descPlaceholder')"
                />
              </div>
              <el-button
                v-if="form.descI18nList.length > 1"
                type="danger"
                link
                @click="removeDescLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addDescLang"
              >{{ t('admin.product.actions.addLang') }}</el-button
            >
          </div>
        </el-form-item>
        </div>

        <div class="group-box">
          <div class="group-title">{{ t('admin.product.form.serviceContentGroupTitle') }}</div>
        <el-form-item :label="t('admin.product.form.serviceContent')" prop="serviceContentI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.serviceContentI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.product.form.languagePlaceholder')"
                filterable
                allow-create
                default-first-option
              >
                <el-option
                  v-for="lang in langOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <div class="quill-wrapper">
                <QuillEditor
                  v-model:content="item.value"
                  content-type="html"
                  theme="snow"
                  :placeholder="t('admin.product.form.serviceContentPlaceholder')"
                />
              </div>
              <el-button
                v-if="form.serviceContentI18nList.length > 1"
                type="danger"
                link
                @click="removeServiceContentLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addServiceContentLang"
              >{{ t('admin.product.actions.addLang') }}</el-button
            >
          </div>
        </el-form-item>
        </div>

        <div class="group-box">
          <div class="group-title">{{ t('admin.product.form.bookingNoticeGroupTitle') }}</div>
        <el-form-item :label="t('admin.product.form.bookingNotice')" prop="bookingNoticeI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.bookingNoticeI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.product.form.languagePlaceholder')"
                filterable
                allow-create
                default-first-option
              >
                <el-option
                  v-for="lang in langOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <div class="quill-wrapper">
                <QuillEditor
                  v-model:content="item.value"
                  content-type="html"
                  theme="snow"
                  :placeholder="t('admin.product.form.bookingNoticePlaceholder')"
                />
              </div>
              <el-button
                v-if="form.bookingNoticeI18nList.length > 1"
                type="danger"
                link
                @click="removeBookingNoticeLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addBookingNoticeLang"
              >{{ t('admin.product.actions.addLang') }}</el-button
            >
          </div>
        </el-form-item>
        </div>

        <el-form-item :label="t('admin.product.form.images')" prop="productImages">
          <div class="product-image-manager">
            <div class="product-image-grid">
              <article
                v-for="(file, idx) in uploadList"
                :key="file.uid ?? `${file.url}-${idx}`"
                class="product-image-card"
                :class="{
                  'is-dragging': draggedImageIndex === idx,
                  'is-drag-over': dragOverImageIndex === idx && draggedImageIndex !== idx,
                }"
                :draggable="!uploading"
                @dragstart="handleImageDragStart(idx, $event)"
                @dragenter.prevent="handleImageDragEnter(idx)"
                @dragover.prevent
                @drop.prevent="handleImageDrop(idx)"
                @dragend="resetImageDrag"
              >
                <img :src="file.url" :alt="file.name" draggable="false" />
                <span v-if="idx === 0" class="product-image-card__cover">
                  {{ t('admin.product.imageManager.cover') }}
                </span>
                <span class="product-image-card__order">{{ idx + 1 }}</span>
                <div class="product-image-card__actions">
                  <span
                    class="product-image-card__drag"
                    :title="t('admin.product.imageManager.drag')"
                    aria-hidden="true"
                  >⠿</span>
                  <button
                    type="button"
                    :disabled="idx === 0 || uploading"
                    :aria-label="t('admin.product.imageManager.moveBefore')"
                    @click.stop="moveImage(idx, idx - 1)"
                  >‹</button>
                  <button
                    type="button"
                    :disabled="idx === uploadList.length - 1 || uploading"
                    :aria-label="t('admin.product.imageManager.moveAfter')"
                    @click.stop="moveImage(idx, idx + 1)"
                  >›</button>
                  <button
                    class="is-remove"
                    type="button"
                    :disabled="uploading"
                    :aria-label="t('admin.product.imageManager.remove')"
                    @click.stop="removeImage(idx)"
                  >×</button>
                </div>
              </article>
              <el-upload
                class="product-image-uploader"
                :http-request="handleUpload"
                list-type="picture-card"
                :show-file-list="false"
                multiple
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </div>
            <p v-if="uploadList.length > 1" class="product-image-manager__hint">
              {{ t('admin.product.imageManager.hint') }}
            </p>
            <div v-if="uploading" class="uploading-tip">
              {{ t('admin.product.message.uploadingTip') }}
            </div>
          </div>
        </el-form-item>
        <el-form-item v-if="isPackageService && importedPriceEditor" :label="t('admin.packageService.importPrices')">
          <div class="imported-prices">
            <p>{{ t('admin.packageService.priceCopyHint') }}</p>
            <el-table :data="importedPriceEditor.rows" border>
              <el-table-column v-for="col in importedPriceEditor.columns" :key="col.key" :label="col.label" min-width="100">
                <template #default="{ row }">{{ row.specMap[col.key] }}</template>
              </el-table-column>
              <el-table-column :label="t('admin.product.table.originPrice')" min-width="155">
                <template #default="{ row }">
                  <el-input-number v-model="row.originPrice" :min="0" :precision="2" :value-on-clear="null" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column :label="t('admin.product.table.discountPrice')" min-width="155">
                <template #default="{ row }">
                  <el-input-number v-model="row.discountPrice" :min="0" :precision="2" :value-on-clear="null" controls-position="right" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="submitLoading" @click="dialogVisible = false">{{ t('admin.product.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="uploading || detailLoading"
          :loading="submitLoading"
          @click="save"
        >
          {{ t('admin.product.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="priceDialogVisible"
      class="price-maintain-dialog"
      :title="t('admin.product.dialog.priceTitle')"
      :close-on-click-modal="false"
      width="min(1040px, calc(100vw - 32px))"
    >
      <div v-if="priceAddons.length" class="price-addon-hint">
        <p>{{ t('admin.product.message.priceAddonHint') }}</p>
        <div class="price-addon-list">
          <span v-for="group in priceAddons" :key="group.key">
            <strong>{{ group.label }}</strong>
            <template v-for="(option, index) in group.options" :key="option.id">
              {{ index ? t('admin.product.text.separator') : (String(locale).startsWith('en') ? ': ' : '：') }}{{ option.label }}
              {{ option.price == null ? t('admin.product.message.optionPriceMissing') : `+${formatSkuMoney(option.price)}` }}
            </template>
          </span>
        </div>
      </div>
      <el-table v-loading="priceLoading" :data="priceRows" border stripe class="price-table">
        <el-table-column
          v-for="col in priceColumns"
          :key="col.key"
          :label="col.label"
          :prop="col.key"
          :min-width="120"
        >
          <template #default="{ row }">
            {{ row.specMap[col.key] }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.originPrice')" width="168">
          <template #default="{ row }">
            <el-input-number
              :model-value="row.originPrice ?? undefined"
              :min="0"
              :precision="2"
              :step="1"
              :value-on-clear="null"
              @update:model-value="(value) => { row.originPrice = value == null ? null : Number(value) }"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.discountPrice')" width="168">
          <template #default="{ row }">
            <el-input-number
              :model-value="row.discountPrice ?? undefined"
              :min="0"
              :precision="2"
              :step="1"
              :value-on-clear="null"
              @update:model-value="(value) => { row.discountPrice = value == null ? null : Number(value) }"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="priceAddons.length"
          :label="t('admin.product.table.totalPrice')"
          min-width="240"
        >
          <template #default="{ row }">
            <div
              v-for="(line, index) in priceTotalLines(row)"
              :key="`${row.id}-${index}`"
              class="price-total-line"
            >
              <span v-if="line.label" class="price-total-line__name">{{ line.label }}</span>
              <span v-if="line.missingPrice">{{ t('admin.product.message.optionPriceMissing') }}</span>
              <template v-else>
                <span>{{ t('admin.product.table.originPrice') }} {{ formatSkuMoney(line.origin) }}</span>
                <span>{{ t('admin.product.table.discountPrice') }} {{ formatSkuMoney(line.sale) }}</span>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="priceDialogVisible = false">{{ t('admin.product.actions.cancel') }}</el-button>
        <el-button type="primary" @click="savePrice">{{ t('admin.product.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import type {
  FormInstance,
  FormRules,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { QuillEditor } from '@vueup/vue-quill';
import { useI18n } from 'vue-i18n';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { upload, currencies } from '@/modules/admin/api/product';
import {
  page,
  sortProducts,
  addOrUpdate,
  deleteProduct,
  detial,
  enable,
  disable,
  batchUpdatePrices,
  listBySpu,
  enableExclusive,
  disableExclusive,
} from '@/modules/admin/api/spu';
import {
  fuzzySearchCategory,
  getPage as getCategoryPage,
  searchCategory,
} from '@/modules/admin/api/category';
import {
  fuzzySearch as fuzzySearchPackageServiceCategory,
  getPage as getPackageServiceCategoryPage,
} from '@/modules/admin/api/packageServiceCategory';
import {
  fuzzySearchSpecType,
  getSpecTypePage,
} from '@/modules/admin/api/specType';
import { getSpecValuePage } from '@/modules/admin/api/spec';
import { getPage as getAddonTypePage } from '@/modules/admin/api/addonType';
import { getPage as getAddonPage } from '@/modules/admin/api/addon';
import { ADMIN_LANG_EN, ADMIN_LANG_ZH, pickI18nText } from '@/modules/admin/utils/i18n';
import {
  buildSkuPriceEditor,
  effectiveSalePrice,
  formatSkuMoney,
  skuPriceTotals,
  type SkuPriceAddonGroup,
  type SkuPriceRow,
  type SkuPriceEditor,
} from '@/modules/admin/utils/skuPriceTable';
import { bizTagsByRef } from '@/modules/admin/api/bizTag';
import { useBizTagPicker } from '@/modules/admin/utils/bizTagPicker';
import { bizTagLabels, type BizTag } from '@/modules/client/utils/biz-tag';
import { getAdminAuthStorageValue } from '@/utils/auth-state';

const props = withDefaults(defineProps<{ packageService?: 0 | 1 }>(), {
  packageService: 0,
});
const isPackageService = computed(() => props.packageService === 1);
const packageProductLabelKey: Record<string, string> = {
  'admin.product.filters.serviceSubCategoryPlaceholder': 'admin.packageCatalog.subcategory.placeholder',
  'admin.product.table.subcategory': 'admin.packageCatalog.subcategory.label',
  'admin.product.form.subcategory': 'admin.packageCatalog.subcategory.label',
  'admin.product.form.subcategoryPlaceholder': 'admin.packageCatalog.subcategory.placeholder',
};
const productText = (key: string, values?: Record<string, unknown>) =>
  t(isPackageService.value ? packageProductLabelKey[key] || key : key, values || {});
const specCategoryDomain = computed(() => (isPackageService.value ? '4' : '2'));
const route = useRoute();
const router = useRouter();
const editorPath = computed(() => isPackageService.value ? '/admin/package/services' : '/admin/products');
let pageMounted = false;
let linkedEditorActive = false;
const clearLinkedEditQuery = () => {
  if (route.path !== editorPath.value || route.query.editId === undefined) return;
  const { editId: _editId, ...query } = route.query;
  void router.replace({ path: route.path, query, hash: route.hash });
};

type ProductEntity = {
  id?: number;
  price?: number;
  stock?: number;
  isOnSale: boolean;
  currency: string;
  sort?: number;
  categoryId?: number;
  subCategoryId?: number;
  specTypeId?: number;
  specIds?: number[];
  createdAt?: string;
  updatedAt?: string;
};

type ProductI18n = {
  id?: number;
  productId?: number;
  langCode: string;
  name: string;
  details?: string;
};

type ProductImage = {
  id?: number;
  productId?: number;
  imageUrl: string;
  sort?: number;
  createdAt?: string;
};

type ProductRow = {
  id: number;
  name: string;
  packages: Array<{ id: number | null; key: string; name: string }>;
  images: string[];
  previewUrl?: string;
  price: number;
  stock: number;
  isOnSale: boolean;
  currency: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
  langs: string[];
  categoryId?: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;
  specTypeId?: number;
  specIds?: number[];
  specNames: string[];
  exclusive?: number;
  tags: BizTag[];
};

type SpecGroup = {
  specTypeId: number | null;
  specIds: number[];
};

type AddonGroup = {
  categoryId: number | null;
  addonIds: number[];
};

const normalizeOptionalId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

type CategoryOption = { label: string; value: number };
type SubCategoryOption = CategoryOption & { parentId: number | null };
type SpecTypeOption = CategoryOption & { subCategoryId: number | null; priced: boolean };
type SpecOption = CategoryOption & {
  typeId: number | null;
  subCategoryId: number | null;
  price: number | null;
};

const subCategoryOptions = ref<SubCategoryOption[]>([]);
const { locale, t } = useI18n({ useScope: 'global' });
const tagPicker = useBizTagPicker();
const tagAdderOpen = ref(false);
const tagDraft = ref('');
const tagDraftRef = ref<HTMLInputElement | null>(null);
const pendingTagNames = ref<string[]>([]);
const productTagLabels = (row: ProductRow) => bizTagLabels(row.tags, String(locale.value));
const selectedProductTags = computed(() =>
  tagPicker.selectedIds.value
    .map((id) => tagPicker.options.value.find((tag) => Number(tag.id) === id))
    .filter((tag): tag is BizTag => Boolean(tag)),
);
const openTagAdder = () => {
  tagDraft.value = '';
  tagAdderOpen.value = true;
  nextTick(() => tagDraftRef.value?.focus());
};
const closeTagAdder = () => {
  tagDraft.value = '';
  tagAdderOpen.value = false;
};
const confirmEnglishTag = () => {
  if (!tagAdderOpen.value) return;
  const name = tagDraft.value.trim();
  if (!name) {
    closeTagAdder();
    return;
  }
  const existing = tagPicker.options.value.find(
    (tag) => tagPicker.englishLabel(tag).toLowerCase() === name.toLowerCase(),
  );
  const existingId = Number(existing?.id);
  if (existingId > 0) tagPicker.select(existingId);
  else if (!pendingTagNames.value.some((item) => item.toLowerCase() === name.toLowerCase())) {
    pendingTagNames.value.push(name);
  }
  closeTagAdder();
};
const getDefaultI18nLang = () => ADMIN_LANG_EN;
const getNextAvailableLang = (langs: string[]) => {
  const used = new Set(langs.filter(Boolean));
  return [ADMIN_LANG_EN, ADMIN_LANG_ZH].find((lang) => !used.has(lang)) || getDefaultI18nLang();
};
const createEmptyProductI18n = (lang = ADMIN_LANG_EN): ProductI18n => ({
  langCode: lang,
  name: '',
  details: '',
});
const createEmptyLangValue = (lang = ADMIN_LANG_EN, value = '') => ({
  lang,
  value,
});

const categoryOptions = ref<CategoryOption[]>([]);

const specOptions = ref<SpecOption[]>([]);

const specTypeOptions = ref<SpecTypeOption[]>([]);
const baseCategoryOptions = ref<CategoryOption[]>([]);
const baseSubCategoryOptions = ref<SubCategoryOption[]>([]);
const baseSpecTypeOptions = ref<SpecTypeOption[]>([]);
const baseSpecOptions = ref<SpecOption[]>([]);
const categorySearchLoading = ref(false);
const subCategorySearchLoading = ref(false);
const specSearchLoading = ref(false);
let categorySearchSequence = 0;
let subCategorySearchSequence = 0;
let specSearchSequence = 0;

const addonCategoryOptions = ref<{ label: string; value: number }[]>([]);

const addonOptions = ref<
  { label: string; value: number; categoryId: number; price?: number }[]
>([]);

const filteredAddonOptions = (categoryId: number | null) =>
  (addonOptions.value || []).filter(
    (o) => !categoryId || o.categoryId === categoryId,
  );

const subCategoryMap = computed(() => {
  const map = new Map<number, string>();
  subCategoryOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});
const subCategoryParentMap = computed(() => {
  const map = new Map<number, number>();
  subCategoryOptions.value.forEach((item) => {
    if (item.parentId) {
      map.set(item.value, item.parentId);
    }
  });
  return map;
});
const categoryMap = computed(() => {
  const map = new Map<number, string>();
  categoryOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});

const specMap = computed(() => {
  const map = new Map<number, string>();
  specOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});
const filteredSpecOptions = (
  typeId: number | null,
  subCategoryId?: number | null,
) =>
  specOptions.value.filter((item) => {
    const typeMatched = !typeId || item.typeId === typeId;
    const subCategoryMatched = isPackageService.value
      ? subCategoryId != null && item.subCategoryId === subCategoryId
      : !subCategoryId || !item.subCategoryId || item.subCategoryId === subCategoryId;
    return typeMatched && subCategoryMatched;
  });

const specMoney = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const specTypeIsPriced = (typeId: number | null) =>
  typeId != null &&
  specTypeOptions.value.some((item) => item.value === typeId && item.priced);

const pricedSpecLines = (group: SpecGroup) => {
  if (!specTypeIsPriced(group.specTypeId)) return [];
  const byId = new Map(
    filteredSpecOptions(group.specTypeId, form.product.subCategoryId).map((item) => [
      item.value,
      item,
    ]),
  );
  return group.specIds.flatMap((id) => {
    const item = byId.get(id);
    if (!item || item.price == null) return [];
    return [{ value: item.value, label: item.label, price: item.price }];
  });
};

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  spuCode: '',
  categoryId: '' as '' | number,
  shelfStatus: '',
  serviceSubCategoryId: '' as '' | number,
  nameKeyword: '',
  status: '',
  exclusive: '',
});
const hasProductFilterConditions = computed(
  () =>
    Boolean(query.spuCode.trim()) ||
    normalizeOptionalId(query.categoryId) !== null ||
    (!isPackageService.value && Boolean(String(query.shelfStatus ?? '').trim())) ||
    normalizeOptionalId(query.serviceSubCategoryId) !== null ||
    Boolean(query.nameKeyword.trim()) ||
    (!isPackageService.value && Boolean(String(query.status ?? '').trim())) ||
    (!isPackageService.value && Boolean(String(query.exclusive ?? '').trim())),
);
// 默认先禁用，只有一次无筛选查询成功后，才能确认当前列表是全量顺序的一部分。
const loadedProductsAreFiltered = ref(true);
const canSortProducts = computed(
  () => !hasProductFilterConditions.value && !loadedProductsAreFiltered.value,
);
const products = ref<ProductRow[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const exportLoading = ref(false);
const sortSubmitting = ref(false);
const draggedProductId = ref<number | null>(null);
const dragOverProductId = ref<number | null>(null);

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const detailLoading = ref(false);
const submitLoading = ref(false);
const sourceServiceId = ref<number | null>(null);
let appliedSourceServiceId: number | null = null;
const sourceServicesLoading = ref(false);
const sourceServiceCatalog = ref<any[]>([]);
const sourceServiceOptions = computed(() => sourceServiceCatalog.value.map((item) => ({
  id: Number(item.spu?.id ?? item.id),
  name: pickName(item.nameI18n, item.spu?.spuName || String(item.spu?.id ?? item.id)),
})));
let sourceCatalogLoaded = false;
let sourceCatalogInflight: Promise<void> | null = null;
let sourceImportVersion = 0;
let applyingServiceDetail = false;
let metadataReady: Promise<unknown> = Promise.resolve();
const importedPriceEditor = ref<SkuPriceEditor | null>(null);
const importedPriceSpecSignature = ref('');
const specSignature = () => JSON.stringify(form.specGroups
  .map((group) => ({ type: group.specTypeId, values: [...group.specIds].sort((a, b) => a - b) }))
  .sort((a, b) => Number(a.type) - Number(b.type)));
const priceDialogVisible = ref(false);
const priceLoading = ref(false);
const uploadList = ref<UploadUserFile[]>([]);
const uploadCount = ref(0);
const draggedImageIndex = ref<number | null>(null);
const dragOverImageIndex = ref<number | null>(null);
const currencyOptions = ref<{ label: string; value: string }[]>([]);
const currencyLoading = ref(false);
const uploading = computed(() => uploadCount.value > 0);

type PriceColumn = { key: string; label: string };
const priceProductId = ref<number | null>(null);
const priceRows = ref<SkuPriceRow[]>([]);
const priceColumns = ref<PriceColumn[]>([]);
const priceAddons = ref<SkuPriceAddonGroup[]>([]);

const normalizeCurrencyOptions = (
  list: any,
): { label: string; value: string }[] => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (item && typeof item === 'object') {
        const value = item.value ?? item.code ?? item.currency ?? item.key;
        const label = item.label ?? item.name ?? item.title ?? value;
        if (value) {
          const valueStr = String(value);
          return { label: label ? String(label) : valueStr, value: valueStr };
        }
      }
      return null;
    })
    .filter((item): item is { label: string; value: string } => !!item);
};

const ensureCurrencyOption = (value?: string) => {
  if (!value) return;
  const exists = currencyOptions.value.some((item) => item.value === value);
  if (!exists) {
    currencyOptions.value = [...currencyOptions.value, { label: value, value }];
  }
};

const defaultProduct = (): ProductEntity => ({
  id: undefined,
  price: undefined as any,
  stock: undefined as any,
  isOnSale: !isPackageService.value,
  currency: 'CNY',
  sort: undefined,
  categoryId: categoryOptions.value[0]?.value,
  subCategoryId: subCategoryOptions.value.find(
    (s) =>
      !categoryOptions.value[0]?.value ||
      !s.parentId ||
      s.parentId === categoryOptions.value[0]?.value,
  )?.value ?? subCategoryOptions.value[0]?.value,
  specTypeId: null,
  specIds: [],
});

const defaultI18nList = (): ProductI18n[] => [createEmptyProductI18n(ADMIN_LANG_EN)];

const form = reactive<{
  product: ProductEntity;
  productI18nList: ProductI18n[];
  // 描述多语言
  descI18nList: { lang: string; value: string }[];
  // 服务内容
  serviceContentI18nList: { lang: string; value: string }[];
  // 预订须知
  bookingNoticeI18nList: { lang: string; value: string }[];
  productImages: ProductImage[];
  specGroups: SpecGroup[];
  addonGroups: AddonGroup[];
}>({
  product: defaultProduct(),
  productI18nList: defaultI18nList(),
  descI18nList: [createEmptyLangValue()],
  serviceContentI18nList: [createEmptyLangValue()],
  bookingNoticeI18nList: [createEmptyLangValue()],
  productImages: [],
  specGroups: [{ specTypeId: null, specIds: [] }],
  addonGroups: [],
});

const filteredSubCategoryOptions = computed(() =>
  subCategoryOptions.value.filter(
    (item) =>
      !form.product.categoryId ||
      !item.parentId ||
      item.parentId === form.product.categoryId,
  ),
);

const queryCategoryId = computed(() => normalizeOptionalId(query.categoryId));

const searchSubCategoryOptions = computed(() =>
  subCategoryOptions.value.filter(
    (item) =>
      !queryCategoryId.value ||
      !item.parentId ||
      item.parentId === queryCategoryId.value,
  ),
);

const filteredSpecTypeOptions = computed(() =>
  specTypeOptions.value.filter((item) => {
    if (isPackageService.value) {
      return (
        form.product.subCategoryId != null &&
        item.subCategoryId === form.product.subCategoryId
      );
    }
    return (
      !form.product.subCategoryId ||
      !item.subCategoryId ||
      item.subCategoryId === form.product.subCategoryId
    );
  }),
);

const getDefaultSpecTypeId = (group?: SpecGroup) => filteredSpecTypeOptions.value.find(
  (item) => !group || !form.specGroups.some((other) => other !== group && other.specTypeId === item.value),
)?.value ?? null;

const specTypeOptionsFor = (group: SpecGroup) => filteredSpecTypeOptions.value.filter(
  (item) => item.value === group.specTypeId || !form.specGroups.some(
    (other) => other !== group && other.specTypeId === item.value,
  ),
);
const addonCategoryOptionsFor = (group: AddonGroup) => addonCategoryOptions.value.filter(
  (item) => item.value === group.categoryId || !form.addonGroups.some(
    (other) => other !== group && other.categoryId === item.value,
  ),
);
const hasDuplicateIds = (ids: Array<number | null>) => {
  const selected = ids.filter((id) => id != null && id > 0);
  return new Set(selected).size !== selected.length;
};

const normalizeSpecGroup = (group: SpecGroup, autoFillType = true) => {
  const availableTypeIds = new Set(
    filteredSpecTypeOptions.value.map((item) => item.value),
  );
  if (
    group.specTypeId &&
    !availableTypeIds.has(group.specTypeId)
  ) {
    group.specTypeId = autoFillType ? getDefaultSpecTypeId(group) : null;
  } else if (!group.specTypeId && autoFillType) {
    group.specTypeId = getDefaultSpecTypeId(group);
  }
  const availableSpecIds = new Set(
    filteredSpecOptions(
      group.specTypeId,
      form.product.subCategoryId ?? null,
    ).map((item) => item.value),
  );
  group.specIds = (group.specIds || []).filter((id) => availableSpecIds.has(id));
};

const normalizeSpecGroups = (autoFillType = true) => {
  if (!form.specGroups.length) {
    form.specGroups = [{ specTypeId: autoFillType ? getDefaultSpecTypeId() : null, specIds: [] }];
    return;
  }
  form.specGroups.forEach((group) => normalizeSpecGroup(group, autoFillType));
};

const langOptions = computed(() => [
  { label: t('admin.common.langZhCn'), value: 'zh-CN' },
  { label: t('admin.common.langEnCode'), value: 'en' },
]);

const shelfStatusOptions = computed(() => [
  { label: t('admin.product.sale.on'), value: '1' },
  { label: t('admin.product.sale.off'), value: '0' },
]);

const exclusiveOptions = computed(() => [
  { label: t('admin.product.filters.recommended'), value: '1' },
  { label: t('admin.product.filters.notRecommended'), value: '0' },
]);

const pickName = (
  value: Record<string, unknown> | undefined | null,
  fallback = '',
) => pickI18nText(value, locale.value, fallback);

const rules: FormRules = {
  'product.categoryId': [
    { required: true, message: t('admin.product.validation.categoryRequired'), trigger: 'change' },
  ],
  'product.subCategoryId': [{ required: false, trigger: 'change' }],
  // 'product.currency': [{ required: true, message: '请选择币种', trigger: 'change' }],
  productI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as ProductI18n[];
        if (!list || list.length === 0) {
          callback(new Error(t('admin.product.validation.nameI18nRequired')));
          return;
        }
        const invalid = list.find(
          (item) => !item.langCode || !item.name.trim(),
        );
        if (invalid) {
          callback(new Error(t('admin.product.validation.nameI18nIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  descI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as { lang: string; value: string }[];
        const invalid = list.find(
          (item) => !item.lang?.trim() || isRichTextEmpty(item.value),
        );
        if (invalid) return callback(new Error(t('admin.product.validation.descI18nIncomplete')));
        callback();
      },
      trigger: 'blur',
    },
  ],
  specGroups: [
    {
      validator: (_rule, value: SpecGroup[], callback) => {
        if (!value || !value.length) {
          callback(new Error(t('admin.product.validation.specGroupRequired')));
          return;
        }
        if (hasDuplicateIds(value.map((group) => group.specTypeId))) {
          callback(new Error(t('admin.product.validation.specTypeDuplicate')));
          return;
        }
        const invalid = value.find(
          (g) => !g.specTypeId || !g.specIds || g.specIds.length === 0,
        );
        if (invalid) {
          callback(new Error(t('admin.product.validation.specGroupIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
  addonGroups: [
    {
      validator: (_rule, value: AddonGroup[], callback) => {
        if (!value || !value.length) {
          callback();
          return;
        }
        if (hasDuplicateIds(value.map((group) => group.categoryId))) {
          callback(new Error(t('admin.product.validation.addonTypeDuplicate')));
          return;
        }
        const filledGroups = value.filter(
          (g) => g.categoryId || (g.addonIds && g.addonIds.length > 0),
        );
        const invalid = filledGroups.find(
          (g) => !g.categoryId || !g.addonIds || g.addonIds.length === 0,
        );
        if (invalid) {
          callback(new Error(t('admin.product.validation.addonGroupIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
  serviceContentI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as { lang: string; value: string }[];
        const invalid = list.find(
          (item) => !item.lang?.trim() || isRichTextEmpty(item.value),
        );
        if (invalid) return callback(new Error(t('admin.product.validation.serviceContentIncomplete')));
        callback();
      },
      trigger: 'blur',
    },
  ],
  bookingNoticeI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as { lang: string; value: string }[];
        const candidates = list.filter(
          (item) => item.lang?.trim() || !isRichTextEmpty(item.value),
        );
        if (!candidates.length) {
          return callback(new Error(t('admin.product.validation.bookingNoticeRequired')));
        }
        const invalid = candidates.find(
          (item) => !item.lang?.trim() || isRichTextEmpty(item.value),
        );
        if (invalid) return callback(new Error(t('admin.product.validation.bookingNoticeIncomplete')));
        callback();
      },
      trigger: 'blur',
    },
  ],
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isRichTextEmpty = (html?: string) => {
  if (!html) return true;
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, '')
    .trim();
  return text.length === 0;
};

const resetForm = () => {
  sourceImportVersion += 1;
  applyingServiceDetail = false;
  sourceServiceId.value = null;
  appliedSourceServiceId = null;
  importedPriceEditor.value = null;
  importedPriceSpecSignature.value = '';
  detailLoading.value = false;
  form.product = defaultProduct();
  if (!form.product.subCategoryId && filteredSubCategoryOptions.value.length) {
    form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
  }
  form.productI18nList = defaultI18nList();
  form.descI18nList = [createEmptyLangValue()];
  form.serviceContentI18nList = [createEmptyLangValue()];
  form.bookingNoticeI18nList = [createEmptyLangValue()];
  form.productImages = [];
  form.specGroups = [
    {
      specTypeId: getDefaultSpecTypeId(),
      specIds: [],
    },
  ];
  form.addonGroups = [];
  tagPicker.reset();
  pendingTagNames.value = [];
  tagAdderOpen.value = false;
  tagDraft.value = '';
  uploadList.value = [];
  uploadCount.value = 0;
  draggedImageIndex.value = null;
  dragOverImageIndex.value = null;
  ensureCurrencyOption(form.product.currency);
  normalizeSpecGroups(true);
  nextTick(() => formRef.value?.clearValidate());
};

const boundPackages = (packages: unknown): ProductRow['packages'] => {
  const seen = new Set<string>();
  return (Array.isArray(packages) ? packages : []).flatMap((pkg: any) => {
    if (!pkg || typeof pkg !== 'object') return [];
    const id = Number(pkg.id);
    const hasId = Number.isInteger(id) && id > 0;
    const name = pickName({
      [ADMIN_LANG_ZH]: pkg.packageName,
      [ADMIN_LANG_EN]: pkg.packageEnglishName,
    });
    if (!hasId && !name) return [];
    const key = hasId ? `package:${id}` : `name:${name}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: hasId ? id : null, key, name: name || t('admin.product.fallback.package', { id }) }];
  });
};

const toRow = (item: any): ProductRow => {
  // new page schema uses spu + i18n fields
  const spu = item?.spu ?? {};
  const previewUrl = item?.previewUrl || spu?.previewUrl || '';
  const nameI18n = item?.nameI18n ?? {};
  const descI18n = item?.descI18n ?? {};
  const i18nList: ProductI18n[] = Object.keys(nameI18n || {}).map((lang) => ({
    langCode: lang,
    name: nameI18n[lang],
    details: descI18n?.[lang] || '',
  }));
  const images: string[] = Array.isArray(item?.imageUrls)
    ? item.imageUrls.filter(Boolean)
    : [];

  const name = pickName(nameI18n, spu.spuName || '');

  const categoryIds: (string | number)[] = Array.isArray(item?.categoryIds)
    ? item.categoryIds
    : [];
  const categoryNameI18n = item?.categoryNameI18n || {};
  const categoryId = categoryIds[0] ? Number(categoryIds[0]) : undefined;
  const subCategoryId = categoryIds[1] ? Number(categoryIds[1]) : undefined;
  const getCatName = (id?: string | number) => {
    if (id === undefined || id === null) return '';
    const map = categoryNameI18n?.[String(id)];
    return pickName(map, '');
  };

  const specBindings: { specTypeId: number; specValueIds: number[] }[] =
    Array.isArray(item?.specBindings) ? item.specBindings : [];
  const specTypeNameI18n = item?.specTypeNameI18n || {};
  const specValueNameI18n = item?.specValueNameI18n || {};
  const specNames: string[] = specBindings.map((bind) => {
    const typeLabel = pickName(
      specTypeNameI18n?.[String(bind.specTypeId)],
      t('admin.product.fallback.specType', { id: bind.specTypeId }),
    );
    const valueLabels = (bind.specValueIds || []).map((vid) => {
      const map = specValueNameI18n?.[String(vid)];
      return pickName(map, t('admin.product.fallback.specValue', { id: vid }));
    });
    return `${typeLabel}: ${valueLabels.join(t('admin.product.text.separator'))}`;
  });

  return {
    id: spu.id ?? item.id ?? 0,
    name,
    packages: boundPackages(item?.packages),
    images,
    previewUrl: typeof previewUrl === 'string' ? previewUrl : '',
    price: spu.price ?? undefined,
    stock: spu.stock ?? undefined,
    isOnSale:
      spu.status === 1 ||
      spu.status === '1' ||
      spu.status === true ||
      spu.status === 'ON' ||
      spu.status === 'on',
    currency: spu.currency ?? 'CNY',
    sort: spu.sort ?? item.sort,
    createdAt: spu.createTime ?? spu.createdAt,
    updatedAt: spu.modifyTime ?? spu.updatedAt,
    langs: Array.isArray(i18nList)
      ? i18nList.map((i) => i.langCode).filter(Boolean)
      : [],
    categoryId,
    categoryName:
      getCatName(categoryId) || categoryMap.value.get(categoryId ?? -1) || '',
    subCategoryId,
    subCategoryName:
      getCatName(subCategoryId) ||
      subCategoryMap.value.get(subCategoryId ?? -1) ||
      '',
    specTypeId: undefined,
    specIds: [],
    specNames,
    exclusive: spu.exclusive ?? undefined,
    tags: Array.isArray(item?.tags) ? item.tags : [],
  };
};

const extractPage = (payload: any) => {
  const page = payload?.data ?? payload ?? {};
  const listRaw = Array.isArray(page.list) ? page.list : [];
  const list = listRaw.map((item) => toRow(item));
  return {
    list,
    total: typeof page.total === 'number' ? page.total : list.length,
    pageNum: page.pageNum ?? query.pageNum,
    pageSize: page.pageSize ?? query.pageSize,
  };
};

const fetchCurrencies = async () => {
  currencyLoading.value = true;
  try {
    const res = await currencies({});
    const options = normalizeCurrencyOptions(res?.data ?? res);
    currencyOptions.value = options;
    ensureCurrencyOption(form.product.currency);
  } catch (error: any) {
    ensureCurrencyOption(form.product.currency);
    ElMessage.error(error?.message || t('admin.product.message.fetchCurrencyFailed'));
  } finally {
    currencyLoading.value = false;
  }
};

const unwrapSearchList = (res: any): any[] => {
  const payload = res?.data ?? res ?? {};
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.list)) return payload.data.list;
  return [];
};

const mergeWithSelected = <T extends { value: number }>(
  matches: T[],
  available: T[],
  selectedIds: Array<unknown>,
) => {
  const selected = new Set(
    selectedIds
      .map(normalizeOptionalId)
      .filter((id): id is number => id !== null),
  );
  const merged = new Map<number, T>();
  available.forEach((item) => {
    if (selected.has(item.value)) merged.set(item.value, item);
  });
  matches.forEach((item) => merged.set(item.value, item));
  return Array.from(merged.values());
};

const mapCategoryOption = (item: any): SubCategoryOption | null => {
  const category = item?.category ?? item ?? {};
  const id = Number(category.id ?? category.categoryId ?? item?.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const nameI18n = item?.nameI18n || category.nameI18n || {};
  return {
    value: id,
    label: pickName(
      nameI18n,
      category.categoryName || item?.categoryName || item?.displayName || '',
    ),
    parentId: normalizeOptionalId(
      category.pcategoryId ??
        category.parentId ??
        category.rootId ??
        item?.pcategoryId ??
        item?.parentId ??
        item?.rootId,
    ),
  };
};

const searchCategoryOptions = async (rawKeyword: string) => {
  const keyword = rawKeyword.trim();
  const sequence = ++categorySearchSequence;
  if (!keyword) {
    categoryOptions.value = baseCategoryOptions.value;
    categorySearchLoading.value = false;
    return;
  }
  categorySearchLoading.value = true;
  try {
    const res = await fuzzySearchCategory({
      nameKeyword: keyword,
      categoryDomain: '1',
      level: '1',
    });
    if (sequence !== categorySearchSequence) return;
    const matches = unwrapSearchList(res)
      .map(mapCategoryOption)
      .filter((item): item is SubCategoryOption => Boolean(item))
      .map(({ label, value }) => ({ label, value }));
    categoryOptions.value = mergeWithSelected(
      matches,
      [...categoryOptions.value, ...baseCategoryOptions.value],
      [query.categoryId, form.product.categoryId],
    );
  } catch (error) {
    console.error('fuzzy search category failed:', error);
  } finally {
    if (sequence === categorySearchSequence) categorySearchLoading.value = false;
  }
};

const remoteSearchSubCategoryOptions = async (rawKeyword: string) => {
  const keyword = rawKeyword.trim();
  const sequence = ++subCategorySearchSequence;
  if (!keyword) {
    subCategoryOptions.value = baseSubCategoryOptions.value;
    subCategorySearchLoading.value = false;
    return;
  }
  subCategorySearchLoading.value = true;
  try {
    const res = isPackageService.value
      ? await fuzzySearchPackageServiceCategory({ nameKeyword: keyword })
      : await fuzzySearchCategory({
          nameKeyword: keyword,
          categoryDomain: specCategoryDomain.value,
        });
    if (sequence !== subCategorySearchSequence) return;
    const matches = unwrapSearchList(res)
      .map(mapCategoryOption)
      .filter((item): item is SubCategoryOption => Boolean(item));
    subCategoryOptions.value = mergeWithSelected(
      matches,
      [...subCategoryOptions.value, ...baseSubCategoryOptions.value],
      [query.serviceSubCategoryId, form.product.subCategoryId],
    );
  } catch (error) {
    console.error('fuzzy search subcategory failed:', error);
  } finally {
    if (sequence === subCategorySearchSequence) {
      subCategorySearchLoading.value = false;
    }
  }
};

const searchSpecOptions = async (rawKeyword: string) => {
  const keyword = rawKeyword.trim();
  const sequence = ++specSearchSequence;
  if (!keyword) {
    specTypeOptions.value = baseSpecTypeOptions.value;
    specOptions.value = baseSpecOptions.value;
    specSearchLoading.value = false;
    return;
  }
  specSearchLoading.value = true;
  try {
    const res = await fuzzySearchSpecType({
      nameKeyword: keyword,
      categoryDomain: specCategoryDomain.value,
    });
    if (sequence !== specSearchSequence) return;
    const typeMatches: SpecTypeOption[] = [];
    const valueMatches: SpecOption[] = [];
    unwrapSearchList(res).forEach((item: any) => {
      const specType = item?.specType ?? item ?? {};
      const typeId = normalizeOptionalId(specType.id ?? item?.id);
      if (!typeId) return;
      const subCategoryId = normalizeOptionalId(
        item?.categoryId ??
          specType.categoryId ??
          specType.subCategoryId ??
          specType.pcategoryId,
      );
      typeMatches.push({
        value: typeId,
        label: pickName(
          item?.nameI18n || specType.nameI18n,
          specType.typeName || item?.name || '',
        ),
        subCategoryId,
        priced: Number(specType.priced ?? item?.priced) === 1,
      });
      const values = Array.isArray(item?.values) ? item.values : [];
      values.forEach((valueItem: any) => {
        const specValue = valueItem?.specValue ?? valueItem ?? {};
        const valueId = normalizeOptionalId(specValue.id ?? valueItem?.id);
        if (!valueId) return;
        valueMatches.push({
          value: valueId,
          label: pickName(
            valueItem?.nameI18n || specValue.nameI18n,
            specValue.specValue || valueItem?.name || '',
          ),
          typeId,
          subCategoryId:
            normalizeOptionalId(valueItem?.categoryId) ?? subCategoryId,
          price: specMoney(specValue.price ?? valueItem?.price),
        });
      });
    });
    const allowedSubcategoryIds = new Set(baseSubCategoryOptions.value.map((item) => item.value));
    const allowedTypeIds = new Set(baseSpecTypeOptions.value.map((item) => item.value));
    const visibleTypes = typeMatches.filter(
      (item) =>
        allowedTypeIds.has(item.value) ||
        (item.subCategoryId != null && allowedSubcategoryIds.has(item.subCategoryId)),
    );
    const visibleTypeIds = new Set(visibleTypes.map((item) => item.value));
    const visibleValues = valueMatches.filter(
      (item) => item.typeId != null && visibleTypeIds.has(item.typeId),
    );
    const selectedTypeIds = form.specGroups.map((group) => group.specTypeId);
    const selectedValueIds = form.specGroups.flatMap((group) => group.specIds);
    specTypeOptions.value = mergeWithSelected(
      visibleTypes,
      [...specTypeOptions.value, ...baseSpecTypeOptions.value],
      selectedTypeIds,
    );
    specOptions.value = mergeWithSelected(
      visibleValues,
      [...specOptions.value, ...baseSpecOptions.value],
      selectedValueIds,
    );
  } catch (error) {
    console.error('fuzzy search spec failed:', error);
  } finally {
    if (sequence === specSearchSequence) specSearchLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const [level1Res, level2Res] = await Promise.all([
      getCategoryPage({ pageNum: 1, pageSize: 200, level: '1' }),
      isPackageService.value
        ? getPackageServiceCategoryPage({ pageNum: 1, pageSize: 500 })
        : searchCategory({
            pageNum: 1,
            pageSize: 500,
            categoryDomain: specCategoryDomain.value,
            nameKeyword: '',
            offset: 0,
          }),
    ]);
    const normalizeList = (res: any) => {
      const payload = res?.data ?? res ?? {};
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload.list)) return payload.list;
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.data?.list)) return payload.data.list;
      return [];
    };
    const level1 = normalizeList(level1Res).map((item: any) => {
      const cat = item.category ?? item;
      const id = Number(cat.id ?? cat.categoryId);
      const nameI18n = item.nameI18n || cat.nameI18n || {};
      const label = pickName(
        nameI18n,
        cat.categoryName || item.displayName || cat.name || '',
      );
      return { value: id, label };
    });
    const level2 = normalizeList(level2Res)
      .map((item: any) => {
        const cat = item.category ?? item;
        const id = Number(cat.id ?? cat.categoryId ?? item.id);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        const parentId = normalizeOptionalId(
          cat.pcategoryId ??
            cat.parentId ??
            cat.rootId ??
            item.pcategoryId ??
            item.parentId ??
            item.rootId,
        );
        const nameI18n = item.nameI18n || cat.nameI18n || {};
        const label = pickName(
          nameI18n,
          cat.categoryName || item.categoryName || item.displayName || cat.name || '',
        );
        return { value: id, label, parentId };
      })
      .filter(
        (
          item,
        ): item is { label: string; value: number; parentId: number | null } =>
          Boolean(item),
      );
    baseCategoryOptions.value = level1;
    baseSubCategoryOptions.value = level2;
    categoryOptions.value = [...level1];
    subCategoryOptions.value = [...level2];
    // adjust defaults if empty
    if (!form.product.categoryId && level1.length)
      form.product.categoryId = level1[0].value;
    if (
      !form.product.subCategoryId ||
      !filteredSubCategoryOptions.value.some(
        (item) => item.value === form.product.subCategoryId,
      )
    ) {
      form.product.subCategoryId = filteredSubCategoryOptions.value[0]?.value;
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchCategoryFailed'));
  }
};

const fetchSpecTypes = async () => {
  try {
    const res = await getSpecTypePage({
      pageNum: 1,
      pageSize: 500,
      categoryDomain: specCategoryDomain.value,
    });
    const payload = res?.data ?? res ?? {};
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.list)
        ? payload.list
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.list)
            ? payload.data.list
            : [];
    const options = records
      .map((item: any) => {
        const specType = item.specType ?? item;
        const id = Number(specType.id ?? item.id);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        const nameI18n = item.nameI18n || specType.nameI18n || {};
        const label = pickName(nameI18n, specType.typeName || item.name || '');
        const subCategoryId = normalizeOptionalId(
          specType.subCategoryId ??
            specType.categoryId ??
            specType.pcategoryId ??
            item.subCategoryId ??
            item.categoryId ??
            item.pcategoryId,
        );
        const priced = Number(specType.priced ?? item.priced) === 1;
        return { value: id, label, subCategoryId, priced };
      })
      .filter(
        (
          item,
        ): item is {
          label: string;
          value: number;
          subCategoryId: number | null;
          priced: boolean;
        } => Boolean(item),
      );
    baseSpecTypeOptions.value = options;
    specTypeOptions.value = [...options];
    normalizeSpecGroups(true);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchSpecTypeFailed'));
  }
};

const fetchSpecs = async () => {
  try {
    const res = await getSpecValuePage({
      pageNum: 1,
      pageSize: 500,
      categoryDomain: specCategoryDomain.value,
    });
    const payload = res?.data ?? res ?? {};
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.list)
        ? payload.list
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.list)
            ? payload.data.list
            : [];
    const options = records
      .map((item: any) => {
        const specValue = item.specValue ?? item;
        const id = Number(specValue.id ?? item.id);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        const typeId = normalizeOptionalId(
          specValue.specTypeId ?? specValue.typeId ?? item.specTypeId,
        );
        const subCategoryId = normalizeOptionalId(
          specValue.subCategoryId ??
            specValue.categoryId ??
            specValue.pcategoryId ??
            item.subCategoryId ??
            item.categoryId ??
            item.pcategoryId,
        );
        const nameI18n = item.nameI18n || specValue.nameI18n || {};
        const label = pickName(nameI18n, specValue.specValue || item.name || '');
        const price = specMoney(specValue.price ?? item.price);
        return { value: id, label, typeId, subCategoryId, price };
      })
      .filter(
        (
          item,
        ): item is {
          label: string;
          value: number;
          typeId: number | null;
          subCategoryId: number | null;
          price: number | null;
        } => Boolean(item),
      );
    baseSpecOptions.value = options;
    specOptions.value = [...options];
    normalizeSpecGroups(true);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchSpecFailed'));
  }
};

const fetchAddonCategories = async () => {
  try {
    const res = await getAddonTypePage({ pageNum: 1, pageSize: 200 });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    addonCategoryOptions.value = records.map((item: any) => {
      const attach = item.attachType ?? item;
      const id = Number(attach.id ?? attach.typeId ?? attach.attachTypeId);
      const nameI18n = item.nameI18n || attach.nameI18n || {};
      const label = pickName(nameI18n, attach.typeName || '');
      return { value: id, label };
    });
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchAddonCategoryFailed'));
  }
};

const fetchAddons = async () => {
  try {
    const res = await getAddonPage({ pageNum: 1, pageSize: 500 });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    addonOptions.value = records.map((item: any) => {
      const attach = item.attachValue ?? item;
      const id = Number(attach.id ?? attach.attachValueId);
      const categoryId = Number(attach.attachTypeId ?? attach.categoryId ?? 0);
      const nameI18n = item.nameI18n || attach.nameI18n || {};
      const label = pickName(nameI18n, attach.attachValue || '');
      return { value: id, label, categoryId, price: attach.price };
    });
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchAddonFailed'));
  }
};

const fetchProducts = async () => {
  tableLoading.value = true;
  try {
    const requestHasFilters = hasProductFilterConditions.value;
    const payload: Record<string, unknown> = {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      packageService: props.packageService,
    };
    const spuCode = query.spuCode?.trim();
    if (spuCode) payload.spuCode = spuCode;

    const categoryId = normalizeOptionalId(query.categoryId);
    if (categoryId !== null) payload.categoryId = String(categoryId);

    const shelfStatus = String(query.shelfStatus ?? '').trim();
    if (!isPackageService.value && shelfStatus) payload.shelfStatus = shelfStatus;

    const serviceSubCategoryId = normalizeOptionalId(query.serviceSubCategoryId);
    if (serviceSubCategoryId !== null) {
      payload.serviceSubCategoryId = serviceSubCategoryId;
    }

    const nameKeyword = query.nameKeyword?.trim();
    if (nameKeyword) payload.nameKeyword = nameKeyword;

    const status = String(query.status ?? '').trim();
    if (!isPackageService.value && status) payload.status = status;

    const exclusive = String(query.exclusive ?? '').trim();
    if (!isPackageService.value && exclusive) payload.exclusive = exclusive;

    const res = await page(payload);
    const { list, total: t, pageNum, pageSize } = extractPage(res);
    products.value = list;
    total.value = t;
    query.pageNum = pageNum;
    query.pageSize = pageSize;
    loadedProductsAreFiltered.value = requestHasFilters;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchListFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const productRowClassName = ({ row }: { row: ProductRow }) =>
  canSortProducts.value &&
  row.id === dragOverProductId.value &&
  row.id !== draggedProductId.value
    ? 'product-sort-row--target'
    : '';

const getProductDropIndex = (event: DragEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return -1;
  const row = target.closest('tbody tr');
  const body = row?.parentElement;
  if (!row || body?.tagName !== 'TBODY') return -1;
  return Array.from(body.children).indexOf(row);
};

const handleProductDragStart = (row: ProductRow, event: DragEvent) => {
  if (!canSortProducts.value || tableLoading.value || sortSubmitting.value) {
    event.preventDefault();
    return;
  }
  draggedProductId.value = row.id;
  dragOverProductId.value = row.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(row.id));
  }
};

const handleProductDragOver = (event: DragEvent) => {
  if (!canSortProducts.value || draggedProductId.value === null || sortSubmitting.value) return;
  const targetIndex = getProductDropIndex(event);
  if (targetIndex < 0 || targetIndex >= products.value.length) return;
  dragOverProductId.value = products.value[targetIndex]?.id ?? null;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
};

const resetProductDrag = () => {
  draggedProductId.value = null;
  dragOverProductId.value = null;
};

const handleProductDrop = async (event: DragEvent) => {
  const draggedId = draggedProductId.value;
  const targetIndex = getProductDropIndex(event);
  if (
    !canSortProducts.value ||
    draggedId === null ||
    targetIndex < 0 ||
    targetIndex >= products.value.length ||
    sortSubmitting.value
  ) {
    resetProductDrag();
    return;
  }

  const sourceIndex = products.value.findIndex((item) => item.id === draggedId);
  if (sourceIndex < 0 || sourceIndex === targetIndex) {
    resetProductDrag();
    return;
  }

  const previous = [...products.value];
  const reordered = [...products.value];
  const [moved] = reordered.splice(sourceIndex, 1);
  if (!moved) {
    resetProductDrag();
    return;
  }
  reordered.splice(targetIndex, 0, moved);
  products.value = reordered;
  resetProductDrag();

  sortSubmitting.value = true;
  try {
    await sortProducts(reordered.map((item) => item.id));
    ElMessage.success(t('admin.product.message.sortSuccess'));
  } catch (error: any) {
    products.value = previous;
    ElMessage.error(error?.message || t('admin.product.message.sortFailed'));
  } finally {
    sortSubmitting.value = false;
  }
};

const onPageChange = (page: number) => {
  query.pageNum = page;
  fetchProducts();
};

const onSizeChange = (size: number) => {
  query.pageSize = size;
  query.pageNum = 1;
  fetchProducts();
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchProducts();
};

const reset = () => {
  query.spuCode = '';
  query.categoryId = '';
  query.shelfStatus = '';
  query.serviceSubCategoryId = '';
  query.nameKeyword = '';
  query.status = '';
  query.exclusive = '';
  query.pageNum = 1;
  fetchProducts();
};

const getExportFilename = (response: Response) => {
  const disposition = response.headers.get('content-disposition') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }
  return 'product-spu-i18n.xlsx';
};

const getExportErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  }
  const text = await response.text().catch(() => '');
  return text.trim() || `Export failed (${response.status})`;
};

const handleExportI18n = async () => {
  if (typeof window === 'undefined') return;
  const token = getAdminAuthStorageValue('token');
  if (!token) {
    ElMessage.error(locale.value.startsWith('zh') ? '未登录，请重新登录' : 'Please sign in again.');
    return;
  }

  exportLoading.value = true;
  try {
    const response = await fetch('/api/api/productSpu/export/i18n', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await getExportErrorMessage(response));
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = getExportFilename(response);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.operationFailed'));
  } finally {
    exportLoading.value = false;
  }
};

const addLang = () => {
  form.productI18nList.push(
    createEmptyProductI18n(
      getNextAvailableLang(form.productI18nList.map((item) => item.langCode)),
    ),
  );
};

const removeLang = (idx: number) => {
  form.productI18nList.splice(idx, 1);
};

const addDescLang = () => {
  form.descI18nList.push(
    createEmptyLangValue(
      getNextAvailableLang(form.descI18nList.map((item) => item.lang)),
    ),
  );
};

const removeDescLang = (idx: number) => {
  if (form.descI18nList.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneDescLang'));
    return;
  }
  form.descI18nList.splice(idx, 1);
};

const addServiceContentLang = () => {
  form.serviceContentI18nList.push(createEmptyLangValue());
};

const removeServiceContentLang = (idx: number) => {
  if (form.serviceContentI18nList.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneServiceLang'));
    return;
  }
  form.serviceContentI18nList.splice(idx, 1);
};

const addBookingNoticeLang = () => {
  form.bookingNoticeI18nList.push(createEmptyLangValue());
};

const removeBookingNoticeLang = (idx: number) => {
  if (form.bookingNoticeI18nList.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneBookingNoticeLang'));
    return;
  }
  form.bookingNoticeI18nList.splice(idx, 1);
};

const setUploadList = (images: ProductImage[]) => {
  const normalizedImages = images
    .filter((img) => img.imageUrl)
    .map((img, idx) => ({ ...img, sort: idx }));
  form.productImages = normalizedImages;
  uploadList.value = normalizedImages
    .map((img, idx) => ({
      name: `${img.id ?? idx}`,
      url: img.imageUrl,
      uid: -(idx + 1),
    }));
};

const syncProductImagesToUploadOrder = () => {
  const imagesByUrl = new Map<string, ProductImage[]>();
  form.productImages.forEach((image) => {
    const queue = imagesByUrl.get(image.imageUrl) || [];
    queue.push(image);
    imagesByUrl.set(image.imageUrl, queue);
  });
  form.productImages = uploadList.value
    .map((file) => {
      const url = String(file.url || '');
      const image = imagesByUrl.get(url)?.shift();
      return image ? { ...image, sort: 0 } : null;
    })
    .filter((image): image is ProductImage => Boolean(image))
    .map((image, idx) => ({ ...image, sort: idx }));
};

const resetImageDrag = () => {
  draggedImageIndex.value = null;
  dragOverImageIndex.value = null;
};

const moveImage = (fromIndex: number, toIndex: number) => {
  if (
    uploading.value ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= uploadList.value.length ||
    toIndex >= uploadList.value.length
  ) {
    return;
  }
  const [file] = uploadList.value.splice(fromIndex, 1);
  if (!file) return;
  uploadList.value.splice(toIndex, 0, file);
  syncProductImagesToUploadOrder();
};

const handleImageDragStart = (index: number, event: DragEvent) => {
  if (uploading.value) {
    event.preventDefault();
    return;
  }
  draggedImageIndex.value = index;
  dragOverImageIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
};

const handleImageDragEnter = (index: number) => {
  if (draggedImageIndex.value !== null) {
    dragOverImageIndex.value = index;
  }
};

const handleImageDrop = (index: number) => {
  const fromIndex = draggedImageIndex.value;
  if (fromIndex !== null) {
    moveImage(fromIndex, index);
  }
  resetImageDrag();
};

const openCreate = () => {
  if (submitLoading.value) return;
  linkedEditorActive = false;
  clearLinkedEditQuery();
  isEdit.value = false;
  resetForm();
  if (!form.product.subCategoryId && filteredSubCategoryOptions.value.length) {
    form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
  }
  dialogVisible.value = true;
  if (isPackageService.value) ensureSourceServices();
  tagPicker.loadOptions().catch((error: any) => {
    ElMessage.error(error?.message || t('admin.bizTag.saveFailed'));
  });
};

const openPreview = (row: ProductRow) => {
  const url = row.previewUrl?.trim();
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const ensureSourceServices = () => {
  if (sourceCatalogLoaded) return Promise.resolve();
  if (sourceCatalogInflight) return sourceCatalogInflight;
  sourceServicesLoading.value = true;
  sourceCatalogInflight = (async () => {
    const collected: any[] = [];
    for (let pageNum = 1; ; pageNum += 1) {
      const res = await page({ pageNum, pageSize: 200, packageService: 0 });
      const data = res?.data ?? res ?? {};
      const list = Array.isArray(data.list) ? data.list : [];
      collected.push(...list);
      if (!list.length || collected.length >= Number(data.total ?? collected.length)) break;
    }
    sourceServiceCatalog.value = [...new Map(collected
      .filter((item) => Number(item.spu?.id ?? item.id) > 0)
      .map((item) => [Number(item.spu?.id ?? item.id), item])).values()];
    sourceCatalogLoaded = true;
  })().catch((error: any) => {
    ElMessage.error(error?.message || t('admin.packageService.sourceLoadFailed'));
  }).finally(() => {
    sourceServicesLoading.value = false;
    sourceCatalogInflight = null;
  });
  return sourceCatalogInflight;
};

const importSourceService = async (id: number | null) => {
  if (!isPackageService.value || isEdit.value || submitLoading.value || uploading.value) return;
  const previousId = appliedSourceServiceId;
  const version = ++sourceImportVersion;
  sourceServiceId.value = id || null;
  detailLoading.value = Boolean(id);
  if (!id) {
    appliedSourceServiceId = null;
    applyingServiceDetail = false;
    return;
  }
  try {
    const [detailRes, tagRes] = await Promise.all([
      detial(id), bizTagsByRef(1, id), metadataReady,
    ]);
    if (version !== sourceImportVersion || !dialogVisible.value) return;
    const detail = detailRes?.data ?? detailRes ?? {};
    if (Number(detail.spu?.id) !== Number(id) || Number(detail.spu?.packageService ?? 0) !== 0) {
      throw new Error(t('admin.packageService.sourceImportFailed'));
    }
    const selected = sourceServiceCatalog.value.find((item) => Number(item.spu?.id ?? item.id) === Number(id));
    const selectedRow = selected ? toRow(selected) : {} as Partial<ProductRow>;
    const categoryId = normalizeOptionalId(detail.categoryIds?.[0]);
    if (categoryId && !categoryOptions.value.some((item) => item.value === categoryId)) {
      const option = { value: categoryId, label: selectedRow.categoryName || String(categoryId) };
      categoryOptions.value.push(option);
      baseCategoryOptions.value.push(option);
    }
    applyingServiceDetail = true;
    applyServiceDetail(detail, selectedRow, true);
    const tags: BizTag[] = unwrapSearchList(tagRes);
    tagPicker.options.value = [...new Map([...tagPicker.options.value, ...tags].map((tag) => [Number(tag.id), tag])).values()];
    tagPicker.selectedIds.value = tags.map((tag) => Number(tag.id)).filter((tagId) => tagId > 0);
    pendingTagNames.value = [];
    closeTagAdder();
    importedPriceEditor.value = null;
    importedPriceSpecSignature.value = '';
    appliedSourceServiceId = id;
    await nextTick();
    formRef.value?.clearValidate();
    ElMessage.success(t('admin.packageService.sourceImported'));
  } catch (error: any) {
    if (version !== sourceImportVersion || !dialogVisible.value) return;
    sourceServiceId.value = previousId;
    ElMessage.error(error?.message || t('admin.packageService.sourceImportFailed'));
  } finally {
    if (version === sourceImportVersion) {
      applyingServiceDetail = false;
      detailLoading.value = false;
    }
  }
};

const applyServiceDetail = (detail: any, row: Partial<ProductRow> = {}, copy = false) => {
  const spu = detail.spu ?? {};
  const nameI18n = detail.nameI18n || {};
  const descI18n = detail.descI18n || {};
  const serviceContentI18n = detail.serviceContentI18n || {};
  const bookingNoticeI18n = detail.bookingNoticeI18n || {};
  const images = Array.isArray(detail.imageUrls) ? detail.imageUrls : [];
  const categoryIds = Array.isArray(detail.categoryIds)
    ? detail.categoryIds
    : [];
  const specBindings: any[] = Array.isArray(detail.specBindings)
    ? detail.specBindings
    : [];
  const attachBindings: any[] = Array.isArray(detail.attachBindings)
    ? detail.attachBindings
    : [];

  const categoryId =
    (categoryIds[0] !== undefined ? Number(categoryIds[0]) : undefined) ??
    row.categoryId ??
    categoryOptions.value[0]?.value;
  const subCategoryId = copy
    ? undefined
    : (categoryIds[1] !== undefined ? Number(categoryIds[1]) : undefined) ??
      row.subCategoryId;
  form.product = {
    id: copy ? undefined : spu.id,
    price: spu.price ?? row.price,
    stock: spu.stock ?? row.stock,
    isOnSale: !copy && (
      spu.status === 1 ||
      spu.status === '1' ||
      spu.status === true ||
      spu.status === 'ON' ||
      spu.status === 'on'),
    currency: spu.currency ?? row.currency ?? 'CNY',
    sort: undefined,
    categoryId,
    subCategoryId,
    specTypeId: undefined,
    specIds: [],
  };
  const mappedSpecGroups: SpecGroup[] = copy || !specBindings.length
    ? [
        {
          specTypeId: null,
          specIds: [],
        },
      ]
    : specBindings.map((g: any) => ({
        specTypeId: g.specTypeId ?? null,
        specIds: Array.isArray(g.specValueIds) ? [...g.specValueIds] : [],
      }));
  form.specGroups = mappedSpecGroups;
  if (!copy) normalizeSpecGroups(true);
  form.product.specIds = mappedSpecGroups[0]?.specIds ?? [];
  form.product.specTypeId = mappedSpecGroups[0]?.specTypeId ?? undefined;

  const mappedAddonGroups: AddonGroup[] = attachBindings.length
    ? attachBindings.map((g: any) => ({
        categoryId: g.attachTypeId ?? null,
        addonIds: Array.isArray(g.attachValueIds) ? [...g.attachValueIds] : [],
      }))
    : [];
  form.addonGroups = mappedAddonGroups;

  const i18nList =
    Object.keys(nameI18n).length > 0
      ? Object.keys(nameI18n).map((lang) => ({
          langCode: lang,
          name: nameI18n[lang],
          details: descI18n?.[lang] || '',
        }))
      : defaultI18nList();
  form.productI18nList = i18nList;
  form.descI18nList = Object.keys(descI18n || {}).length
    ? Object.keys(descI18n).map((lang) => ({ lang, value: descI18n[lang] }))
    : [createEmptyLangValue()];
  form.serviceContentI18nList = Object.keys(serviceContentI18n || {}).length
    ? Object.keys(serviceContentI18n).map((lang) => ({
        lang,
        value: serviceContentI18n[lang],
      }))
    : [createEmptyLangValue()];
  form.bookingNoticeI18nList = Object.keys(bookingNoticeI18n || {}).length
    ? Object.keys(bookingNoticeI18n).map((lang) => ({
        lang,
        value: bookingNoticeI18n[lang],
      }))
    : [createEmptyLangValue()];

  form.productImages = images.map((url: string) => ({
    productId: copy ? undefined : spu.id,
    imageUrl: url,
  }));
  setUploadList(form.productImages);
  ensureCurrencyOption(form.product.currency);
};

const openEdit = async (row: Partial<ProductRow> & { id: number }, linked = false) => {
  if (submitLoading.value) return;
  if (!Number.isSafeInteger(row.id) || row.id <= 0) return;
  if (!linked) {
    linkedEditorActive = false;
    clearLinkedEditQuery();
  }
  isEdit.value = true;
  resetForm();
  const version = sourceImportVersion;
  const current = () => version === sourceImportVersion && dialogVisible.value
    && (!linked || (route.path === editorPath.value && route.query.editId === String(row.id)));
  dialogVisible.value = true;
  detailLoading.value = true;
  try {
    const [detailRes] = await Promise.all([detial(row.id), metadataReady]);
    if (!current()) return;
    const detail = detailRes?.data ?? detailRes ?? {};
    if (Number(detail.spu?.id) !== row.id) {
      throw new Error(t('admin.product.message.fetchDetailFailed'));
    }
    const actualPackageService = Number(detail.spu?.packageService ?? 0) === 1 ? 1 : 0;
    if (linked && actualPackageService !== props.packageService) {
      linkedEditorActive = false;
      await router.replace({
        path: actualPackageService === 1 ? '/admin/package/services' : '/admin/products',
        query: { ...route.query, editId: String(row.id) },
        hash: route.hash,
      });
      if (version === sourceImportVersion) dialogVisible.value = false;
      return;
    }
    const [tagRes] = await Promise.all([bizTagsByRef(1, row.id), tagPicker.loadOptions()]);
    if (!current()) return;
    applyServiceDetail(detail, row);
    const tags: BizTag[] = unwrapSearchList(tagRes);
    tagPicker.options.value = [...new Map([...tagPicker.options.value, ...tags].map((tag) => [Number(tag.id), tag])).values()];
    tagPicker.selectedIds.value = tags.map((tag) => Number(tag.id)).filter((id) => Number.isFinite(id) && id > 0);
    nextTick(() => formRef.value?.clearValidate());
  } catch (error: any) {
    if (!current()) return;
    dialogVisible.value = false;
    ElMessage.error(error?.message || t('admin.product.message.fetchDetailFailed'));
  } finally {
    if (version === sourceImportVersion) detailLoading.value = false;
  }
};

const openLinkedEditor = () => {
  if (!pageMounted || route.path !== editorPath.value) return;
  const value = route.query.editId;
  const id = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : 0;
  if (!Number.isSafeInteger(id) || id <= 0) {
    if (linkedEditorActive) dialogVisible.value = false;
    linkedEditorActive = false;
    return;
  }
  linkedEditorActive = true;
  void openEdit({ id }, true);
};

const handleUpload = async (options: UploadRequestOptions) => {
  uploadCount.value += 1;
  try {
    const formData = new FormData();
    formData.append('file', options.file as File);
    const res = await upload(formData);
    const url =
      typeof res?.data === 'string'
        ? res.data
        : res?.data?.url || res?.url || '';
    if (!url) throw new Error(t('admin.product.message.uploadEmptyUrl'));
    form.productImages.push({ imageUrl: url, sort: form.productImages.length });
    uploadList.value.push({ name: options.file.name, url, uid: options.file.uid });
    options.onSuccess?.({ url } as any);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.uploadFailed'));
    options.onError?.(error);
  } finally {
    uploadCount.value = Math.max(0, uploadCount.value - 1);
  }
};

const removeImage = (index: number) => {
  if (uploading.value || index < 0 || index >= uploadList.value.length) return;
  uploadList.value.splice(index, 1);
  syncProductImagesToUploadOrder();
  resetImageDrag();
};

const addSpecGroup = () => {
  form.specGroups.push({
    specTypeId: filteredSpecTypeOptions.value.find(
      (item) => !form.specGroups.some((group) => group.specTypeId === item.value),
    )?.value ?? null,
    specIds: [],
  });
};

const removeSpecGroup = (idx: number) => {
  if (form.specGroups.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneSpecGroup'));
    return;
  }
  form.specGroups.splice(idx, 1);
};

const onCategoryChange = () => {
  // 重置服务子类到当前类别下的第一个
  const target = filteredSubCategoryOptions.value[0];
  form.product.subCategoryId = target ? target.value : undefined;
};

const addAddonGroup = () => {
  form.addonGroups.push({
    categoryId: addonCategoryOptions.value.find(
      (item) => !form.addonGroups.some((group) => group.categoryId === item.value),
    )?.value ?? null,
    addonIds: [],
  });
};

const removeAddonGroup = (idx: number) => {
  form.addonGroups.splice(idx, 1);
};

const toggleSale = async (row: ProductRow) => {
  const targetStatus = !row.isOnSale;
  try {
    if (targetStatus) {
      await enable(row.id);
    } else {
      await disable(row.id);
    }
    row.isOnSale = targetStatus;
    ElMessage.success(
      t('admin.product.message.saleChanged', {
        status: targetStatus ? t('admin.product.sale.on') : t('admin.product.sale.off'),
      }),
    );
    fetchProducts();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.operationFailed'));
  }
};

const filledMoney = (value: number | null | undefined) =>
  value != null && Number.isFinite(Number(value)) && Number(value) >= 0;

const priceTotalLines = (row: SkuPriceRow) =>
  skuPriceTotals(row.originPrice, row.discountPrice, priceAddons.value);

const openPriceDialog = async (row: ProductRow) => {
  priceProductId.value = row.id;
  priceDialogVisible.value = true;
  priceLoading.value = true;
  priceRows.value = [];
  priceColumns.value = [];
  priceAddons.value = [];
  try {
    const res = await listBySpu(row.id);
    const data = res?.data ?? res ?? {};
    const editor = buildSkuPriceEditor(
      Array.isArray(data.specTypes) ? data.specTypes : [],
      Array.isArray(data.skus) ? data.skus : [],
      (value, fallback = '') => pickName(value, fallback),
    );
    priceColumns.value = editor.columns;
    priceRows.value = editor.rows;
    priceAddons.value = editor.addons;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchSpecFailed'));
    priceRows.value = [];
    priceColumns.value = [];
    priceAddons.value = [];
  } finally {
    priceLoading.value = false;
  }
};

const savePrice = () => {
  if (priceProductId.value == null) return;
  const missingAddon = priceAddons.value.some((group) =>
    group.options.some((option) => option.price == null),
  );
  if (missingAddon) {
    ElMessage.error(t('admin.product.message.optionPriceMissing'));
    return;
  }
  const missingOrigin = priceRows.value.find((row) => !filledMoney(row.originPrice));
  if (missingOrigin) {
    ElMessage.error(t('admin.product.message.originPriceRequired'));
    return;
  }
  const payload = {
    productId: priceProductId.value,
    bases: priceRows.value.map((row) => ({
      specValueIds: row.specValueIds,
      price: Number(effectiveSalePrice(row.originPrice, row.discountPrice)),
      originalPrice: Number(row.originPrice),
    })),
  };
  batchUpdatePrices(payload)
    .then(() => {
      ElMessage.success(t('admin.product.message.priceSaved'));
      priceDialogVisible.value = false;
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || t('admin.product.message.saveFailed'));
    });
};

const save = () => {
  if (detailLoading.value || submitLoading.value) return;
  if (hasDuplicateIds(form.specGroups.map((group) => group.specTypeId))) {
    ElMessage.warning(t('admin.product.validation.specTypeDuplicate'));
    return;
  }
  if (hasDuplicateIds(form.addonGroups.map((group) => group.categoryId))) {
    ElMessage.warning(t('admin.product.validation.addonTypeDuplicate'));
    return;
  }
  formRef.value?.validate(async (valid) => {
    if (!valid || detailLoading.value || submitLoading.value) return;
    if (uploading.value) {
      ElMessage.warning(t('admin.product.message.uploadingTip'));
      return;
    }
    const copiedPrices = importedPriceEditor.value;
    if (copiedPrices && (!copiedPrices.rows.length || copiedPrices.rows.some((row) => !filledMoney(row.originPrice)))) {
      ElMessage.error(t('admin.packageService.priceUnavailable'));
      return;
    }
    if (copiedPrices?.addons.some((group) => group.options.some((option) => option.price == null))) {
      ElMessage.error(t('admin.product.message.optionPriceMissing'));
      return;
    }
    submitLoading.value = true;
    const wasEdit = isEdit.value;
    let copyingPrices = false;
    try {
      // 同步兼容字段：取第一个规格组
      const firstGroup = form.specGroups[0] || {
        specTypeId: null,
        specIds: [],
      };
      form.product.specTypeId = firstGroup.specTypeId ?? undefined;
      form.product.specIds = firstGroup.specIds ?? [];
      // 确保分类与服务子类一致
      if (form.product.subCategoryId) {
        const parentId = subCategoryParentMap.value.get(
          form.product.subCategoryId,
        );
        if (parentId) {
          form.product.categoryId = parentId;
        }
      }
      const nameI18n = form.productI18nList.reduce<Record<string, string>>(
        (acc, cur) => {
          if (cur.langCode && cur.name) acc[cur.langCode] = cur.name;
          return acc;
        },
        {},
      );
      const descI18n = form.descI18nList.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {});
      const serviceContentI18n = form.serviceContentI18nList.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {});
      const bookingNoticeI18n = form.bookingNoticeI18nList.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {});
      const payload = {
        id: form.product.id,
        packageService: props.packageService,
        spuCode: '',
        categoryId: form.product.categoryId
          ? String(form.product.categoryId)
          : undefined,
        spuName: nameI18n['zh-CN'] || Object.values(nameI18n)[0],
        spuEnglishName: nameI18n['en'] || nameI18n['en-US'],
        nameI18n,
        descI18n,
        serviceContentI18n,
        bookingNoticeI18n,
        ...(!isPackageService.value ? { status: form.product.isOnSale ? 1 : 0 } : {}),
        sort: undefined,
        imageUrl: form.productImages[0]?.imageUrl,
        imageUrls: form.productImages
          .map((img) => img.imageUrl)
          .filter(Boolean),
        categoryIds: [form.product.categoryId, form.product.subCategoryId]
          .filter((v) => v !== undefined && v !== null)
          .map(String),
        specBindings: form.specGroups.map((g) => ({
          specTypeId: g.specTypeId,
          specValueIds: g.specIds,
        })),
        attachBindings: form.addonGroups
          .filter((g) => g.categoryId && g.addonIds && g.addonIds.length > 0)
          .map((g) => ({
            attachTypeId: g.categoryId,
            attachValueIds: g.addonIds,
          })),
        tags: tagPicker.saveItems(pendingTagNames.value),
      };
      const saved = await addOrUpdate(payload);
      if (copiedPrices) {
        const newId = payload.id ?? normalizeOptionalId(saved?.data ?? saved?.id ?? saved);
        if (!newId) {
          ElMessage.warning(t('admin.packageService.createdIdMissing'));
          dialogVisible.value = false;
          fetchProducts();
          return;
        }
        // Keep the created ID before saving prices so retry updates this service.
        form.product.id = newId;
        isEdit.value = true;
        copyingPrices = true;
        await batchUpdatePrices({
          productId: newId,
          bases: copiedPrices.rows.map((row) => ({
            specValueIds: [...row.specValueIds],
            price: Number(effectiveSalePrice(row.originPrice, row.discountPrice)),
            originalPrice: Number(row.originPrice),
          })),
        });
        importedPriceEditor.value = null;
      }
      pendingTagNames.value = [];
      ElMessage.success(
        t(wasEdit ? 'admin.product.message.updateSuccess' : 'admin.product.message.createSuccess'),
      );
      dialogVisible.value = false;
      fetchProducts();
    } catch (error: any) {
      ElMessage.error(copyingPrices
        ? t('admin.packageService.priceCopyFailed')
        : error?.message || t('admin.product.message.saveFailed'));
    } finally {
      submitLoading.value = false;
    }
  });
};
const toggleRecommend = async (row) => {
  if (row.exclusive) {
    await disableExclusive(row.id);
  } else {
    await enableExclusive(row.id);
  }
  ElMessage.success(t('admin.product.message.recommendUpdated'));
  fetchProducts();
};
const remove = async (row: ProductRow) => {
  try {
    await ElMessageBox.confirm(
      t('admin.product.message.deleteConfirm', { name: row.name }),
      t('admin.common.confirmTitle'),
      {
      type: 'warning',
      },
    );
    await deleteProduct(row.id);
    ElMessage.success(t('admin.product.message.deleteSuccess'));
    fetchProducts();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  }
};

onMounted(() => {
  fetchCurrencies();
  metadataReady = Promise.all([
    fetchCategories(), fetchSpecTypes(), fetchSpecs(), fetchAddonCategories(), fetchAddons(),
  ]);
  fetchProducts();
  pageMounted = true;
  openLinkedEditor();
});

watch([() => route.path, () => route.query.editId], openLinkedEditor);
onBeforeUnmount(() => {
  pageMounted = false;
  sourceImportVersion += 1;
});

watch(dialogVisible, (open) => {
  if (open) return;
  linkedEditorActive = false;
  clearLinkedEditQuery();
  sourceImportVersion += 1;
  detailLoading.value = false;
  applyingServiceDetail = false;
});

watch(() => form.specGroups, () => {
  if (!importedPriceEditor.value || applyingServiceDetail) return;
  if (specSignature() === importedPriceSpecSignature.value) return;
  importedPriceEditor.value = null;
  ElMessage.warning(t('admin.packageService.pricesChanged'));
}, { deep: true });

watch(
  () => form.product.subCategoryId,
  () => {
    if (applyingServiceDetail) return;
    normalizeSpecGroups(true);
  },
);

watch(
  queryCategoryId,
  () => {
    if (
      query.serviceSubCategoryId &&
      !searchSubCategoryOptions.value.some(
        (item) => item.value === query.serviceSubCategoryId,
      )
    ) {
      query.serviceSubCategoryId = '';
    }
  },
);

watch(
  () => locale.value,
  () => {
    fetchCategories();
    fetchSpecTypes();
    fetchSpecs();
    fetchAddonCategories();
    fetchAddons();
    fetchProducts();
  },
);
</script>

<style scoped>
.source-service-field, .imported-prices { width: 100%; min-width: 0; }
.source-service-field p, .imported-prices > p { margin: 8px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.imported-prices > p { margin: 0 0 10px; }
.imported-prices :deep(.el-input-number) { width: 130px; }
.package-service-heading { margin-bottom: 20px; }
.package-service-heading h2 { margin: 0 0 8px; font-size: 20px; }
.package-service-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 14px; }
.bound-packages { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin: 0; padding: 0; list-style: none; }
.bound-packages li { max-width: 100%; box-sizing: border-box; padding: 3px 7px; border-radius: 4px; background: #eaf2ff; color: #2f7ee0; font-size: 12px; line-height: 1.5; white-space: normal; overflow-wrap: anywhere; }
.bound-packages a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.bound-packages a:hover { color: #1557b0; }
.bound-packages a:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.unbound-package { color: var(--el-text-color-secondary); }
.biz-tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.biz-tag-picks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}
.biz-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px 0 10px;
  border: 1px solid #f3c7a0;
  border-radius: 4px;
  background: #fff4e8;
  color: #e07a2f;
  font-size: 13px;
  line-height: 1;
}
.biz-tag-chip button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #e07a2f;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.biz-tag-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 4px;
  background: #3b6cff;
  color: #fff;
  cursor: pointer;
}
.biz-tag-add :deep(svg) {
  width: 14px;
  height: 14px;
}
.biz-tag-draft {
  width: 168px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #f3c7a0;
  border-radius: 4px;
  background: #fff;
  color: #142033;
  font: inherit;
  font-size: 13px;
}
.biz-tag-draft:focus {
  outline: 2px solid rgba(59, 108, 255, 0.35);
  border-color: #3b6cff;
}
.page {
  --el-font-size-base: 12px;
  --el-component-size: 30px;
  padding: 12px;
  font-size: 12px;
}
.page > :deep(.el-card) {
  --el-card-padding: 12px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 12px;
  gap: 8px;
}
.toolbar-fields,
.toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar :deep(.el-input),
.toolbar :deep(.el-select) {
  width: 160px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.product-sort-handle {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #7b8797;
  cursor: grab;
  transition: color 0.2s, background-color 0.2s, transform 0.2s;
}
.product-sort-handle:hover {
  background: var(--hx-ivory-150, #f4eee4);
  color: var(--hx-champagne-600, #a97b38);
}
.product-sort-handle:active {
  cursor: grabbing;
  transform: scale(0.94);
}
.product-sort-handle:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.product-sort-handle svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}
:deep(.el-table__body tr.product-sort-row--target > td.el-table__cell) {
  background: #f7f0e3 !important;
  box-shadow: inset 0 2px 0 var(--hx-champagne-500, #cfa45c);
}
.thumbs {
  display: flex;
  align-items: center;
  gap: 6px;
}
.thumbs img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 4px;
}
.more {
  font-size: 11px;
  color: #666;
}
.pricing-rules-chip {
  display: block;
  max-width: 100%;
  overflow: hidden;
  padding: 3px 7px;
  border-radius: 4px;
  background: #eaf2ff;
  color: #2f7ee0;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sale-status-button {
  height: 24px;
  padding: 0 7px !important;
  border: 1px solid transparent;
  border-radius: 4px;
  font-weight: 600;
}
.sale-status-button.is-on {
  border-color: #c9ecd4;
  background: #e4f7ea;
  color: #1a8a3e;
}
.sale-status-button.is-off {
  border-color: #f7d3d1;
  background: #fdeceb;
  color: #e5484d;
}
.product-date-line {
  color: #606266;
  font-size: 11px;
  line-height: 1.55;
  white-space: nowrap;
}
.table-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.product-sort-table :deep(.el-table__cell) {
  padding: 7px 0;
  font-size: 12px;
}
.product-sort-table :deep(.el-table__header .cell),
.product-sort-table :deep(.el-table__body .cell) {
  padding-right: 6px;
  padding-left: 6px;
  line-height: 1.35;
}
.product-sort-table :deep(.el-table__header .cell) {
  white-space: nowrap;
}
.product-sort-table :deep(.el-button.is-link) {
  height: 22px;
  padding: 0 2px;
  font-size: 11.5px;
}
.lang {
  margin-right: 4px;
}
.i18n-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.spec-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.spec-box {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  background: #fafbff;
}
.spec-box__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.spec-price-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
}
.spec-price-lines p {
  margin: 0;
  color: #61738a;
  font-size: 12px;
  line-height: 1.5;
}
.spec-price-lines span {
  margin-left: 8px;
  color: var(--hx-champagne-600, #a97b38);
  font-variant-numeric: tabular-nums;
}
.spec-box__title {
  font-weight: 600;
}
.price-table {
  margin-bottom: 0;
}
.price-addon-hint {
  margin-bottom: 12px;
  color: #61738a;
  font-size: 13px;
  line-height: 1.6;
}
.price-addon-hint p {
  margin: 0;
}
.price-addon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 6px;
  color: #243044;
}
.price-total-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  line-height: 1.7;
}
.price-total-line + .price-total-line {
  margin-top: 4px;
}
.price-total-line__name {
  color: #61738a;
}
.price-maintain-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  margin: 16px auto !important;
  overflow: hidden;
}
.price-maintain-dialog :deep(.el-dialog__header),
.price-maintain-dialog :deep(.el-dialog__footer) {
  flex: 0 0 auto;
}
.price-maintain-dialog :deep(.el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.i18n-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 8px;
  align-items: center;
}
.full-width {
  width: 100%;
}
.group-box {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.group-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}
.quill-wrapper {
  width: 100%;
}
.quill-wrapper :deep(.ql-container) {
  min-height: 140px;
  border-radius: 4px;
}
.quill-wrapper :deep(.ql-editor) {
  min-height: 120px;
}
.uploading-tip {
  margin-top: 8px;
  color: #f59b00;
  font-size: 12px;
}
.product-image-manager {
  width: 100%;
}
.product-image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
}
.product-image-card {
  position: relative;
  width: 148px;
  height: 148px;
  overflow: hidden;
  border: 1px solid #d9e2ec;
  border-radius: 12px;
  background: #f5f7fa;
  cursor: grab;
  box-shadow: 0 4px 14px rgba(5, 21, 43, 0.07);
  transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s, transform 0.2s;
}
.product-image-card:hover {
  border-color: var(--hx-champagne-500, #cfa45c);
  box-shadow: 0 8px 22px rgba(169, 123, 56, 0.18);
}
.product-image-card:active {
  cursor: grabbing;
}
.product-image-card.is-dragging {
  opacity: 0.45;
  transform: scale(0.96);
}
.product-image-card.is-drag-over {
  border-color: var(--hx-champagne-600, #a97b38);
  box-shadow: 0 0 0 3px rgba(169, 123, 56, 0.18);
}
.product-image-card > img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  user-select: none;
}
.product-image-card__cover,
.product-image-card__order {
  position: absolute;
  top: 8px;
  z-index: 1;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 3px 10px rgba(5, 21, 43, 0.2);
}
.product-image-card__cover {
  left: 8px;
  color: #fffaf0;
  background: linear-gradient(135deg, var(--hx-champagne-600, #a97b38), #79521f);
}
.product-image-card__order {
  right: 8px;
  padding: 0 7px;
  background: rgba(5, 21, 43, 0.76);
}
.product-image-card__actions {
  position: absolute;
  inset: auto 0 0;
  height: 40px;
  padding: 5px 7px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  background: linear-gradient(transparent, rgba(5, 21, 43, 0.88));
  opacity: 0;
  transform: translateY(5px);
  transition: opacity 0.2s, transform 0.2s;
}
.product-image-card:hover .product-image-card__actions,
.product-image-card:focus-within .product-image-card__actions {
  opacity: 1;
  transform: translateY(0);
}
.product-image-card__actions button,
.product-image-card__drag {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  display: inline-grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.92);
  color: #26374a;
  font-size: 20px;
  line-height: 1;
}
.product-image-card__drag {
  margin-right: auto;
  color: var(--hx-champagne-600, #a97b38);
  font-size: 18px;
  cursor: grab;
}
.product-image-card__actions button {
  cursor: pointer;
}
.product-image-card__actions button:hover:not(:disabled) {
  background: #fff;
  color: var(--hx-champagne-600, #a97b38);
}
.product-image-card__actions button.is-remove:hover:not(:disabled) {
  color: #f56c6c;
}
.product-image-card__actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.product-image-uploader :deep(.el-upload--picture-card) {
  width: 148px;
  height: 148px;
  border-radius: 12px;
  background: #f8fafc;
}
.product-image-manager__hint {
  margin: 10px 0 0;
  color: #7b8797;
  font-size: 12px;
  line-height: 1.5;
}
@media (max-width: 640px) {
  .i18n-row {
    grid-template-columns: 1fr;
  }
  .product-image-card,
  .product-image-uploader :deep(.el-upload--picture-card) {
    width: 112px;
    height: 112px;
  }
  .product-image-card__actions {
    opacity: 1;
    transform: none;
  }
}
</style>
