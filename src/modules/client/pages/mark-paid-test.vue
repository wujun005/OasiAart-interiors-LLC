<template>
  <main class="bench">
    <section class="sheet">
      <p class="eyebrow">HourX · 测试环境</p>
      <h1>模拟支付成功</h1>
      <p class="lead">
        调用 <code>POST /client/order/markPaidTest</code>。只接受测试环境里的未支付订单，会写成已支付、已确认，并走支付成功后的通知、套餐额度和购物车清理。
      </p>

      <form @submit.prevent="submit">
        <label for="order-no">订单号</label>
        <input
          id="order-no"
          v-model="orderNo"
          name="orderNo"
          autocomplete="off"
          spellcheck="false"
          placeholder="例如 HX202610190001"
          :disabled="submitting"
        />
        <div v-if="recent.length" class="recent">
          <button
            v-for="item in recent"
            :key="item"
            type="button"
            :disabled="submitting"
            @click="orderNo = item"
          >
            {{ item }}
          </button>
        </div>
        <label class="confirm">
          <input v-model="confirmed" type="checkbox" :disabled="submitting" />
          <span>我确认把这张未支付订单写成已支付，并发送支付成功通知。</span>
        </label>
        <button class="go" type="submit" :disabled="!canSubmit">
          {{ submitting ? '正在写入…' : '标记为已支付' }}
        </button>
      </form>

      <p v-if="error" class="result bad" role="alert">{{ error }}</p>
      <section v-else-if="result" class="result ok" aria-live="polite">
        <h2>{{ result.alreadyPaid ? '订单原本已支付' : '已写成已支付' }}</h2>
        <p v-if="result.alreadyPaid">这次没有重发通知，只补了套餐额度和首约。</p>
        <dl>
          <div><dt>订单号</dt><dd>{{ result.orderNo || '—' }}</dd></div>
          <div><dt>订单 ID</dt><dd>{{ result.orderId ?? '—' }}</dd></div>
          <div><dt>订单状态</dt><dd>{{ statusText(result.orderStatus, orderStatusLabels) }}</dd></div>
          <div><dt>支付状态</dt><dd>{{ statusText(result.paymentStatus, payStatusLabels) }}</dd></div>
          <div><dt>套餐订单</dt><dd>{{ result.packageOrder ? '是' : '否' }}</dd></div>
          <div><dt>可约次数</dt><dd>{{ result.redeemTimes ?? '—' }}</dd></div>
          <div><dt>已占用次数</dt><dd>{{ result.occupiedTimes ?? '—' }}</dd></div>
          <div><dt>有效期至</dt><dd>{{ formatTime(result.validUntil) }}</dd></div>
          <div class="wide">
            <dt>履约单号</dt>
            <dd>{{ result.fulfillmentNos?.length ? result.fulfillmentNos.join('、') : '—' }}</dd>
          </div>
        </dl>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import http from '@/modules/client/utils/request';

type MarkPaidResult = {
  orderId?: number;
  orderNo?: string;
  orderStatus?: number;
  paymentStatus?: number;
  alreadyPaid?: boolean;
  packageOrder?: boolean;
  redeemTimes?: number | null;
  occupiedTimes?: number | null;
  validUntil?: string | number | null;
  fulfillmentNos?: string[];
};

const RECENT_KEY = 'hourx-mark-paid-recent';
const orderStatusLabels: Record<number, string> = {
  0: '未支付',
  1: '已确认',
  2: '已完成',
  3: '已取消',
  4: '退款中',
  5: '已退款',
  6: '退款失败',
};
const payStatusLabels: Record<number, string> = {
  0: '未支付',
  1: '已支付',
  2: '已取消',
  3: '支付失败',
  4: '退款中',
  5: '已退款',
  6: '退款失败',
};

const route = useRoute();
const orderNo = ref('');
const confirmed = ref(false);
const submitting = ref(false);
const error = ref('');
const result = ref<MarkPaidResult | null>(null);
const recent = ref<string[]>([]);

const canSubmit = computed(() => Boolean(orderNo.value.trim()) && confirmed.value && !submitting.value);

const readRecent = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    recent.value = Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, 6) : [];
  } catch {
    recent.value = [];
  }
};

const remember = (value: string) => {
  recent.value = [value, ...recent.value.filter((item) => item !== value)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
};

const statusText = (code: number | undefined, labels: Record<number, string>) => {
  if (code == null || code === ('' as unknown)) return '—';
  return labels[Number(code)] || String(code);
};

const formatTime = (value: MarkPaidResult['validUntil']) => {
  if (value == null || value === '') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
};

const submit = async () => {
  const next = orderNo.value.trim();
  if (!next || !confirmed.value || submitting.value) return;
  submitting.value = true;
  error.value = '';
  result.value = null;
  try {
    const data = await http.post('/client/order/markPaidTest', null, { params: { orderNo: next } });
    result.value = (data || {}) as MarkPaidResult;
    remember(next);
  } catch (cause: any) {
    error.value = cause?.message || '模拟支付失败';
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  readRecent();
  const preset = String(route.query.orderNo || '').trim();
  if (preset) orderNo.value = preset;
});
</script>

<style scoped>
.bench {
  min-height: 100vh;
  padding: 48px 20px;
  background:
    linear-gradient(90deg, #f2c14e 0 14px, transparent 14px) 0 0 / 100% 14px no-repeat,
    #f4efe6;
  color: #1c1915;
  font-family: "Iowan Old Style", Palatino, "Palatino Linotype", serif;
}
.sheet {
  width: min(680px, 100%);
  margin: 0 auto;
  padding: 32px 28px 28px;
  background: #fffdf8;
  border: 1px solid #e4d8c4;
  box-shadow: 0 18px 50px rgba(58, 42, 18, 0.08);
}
.eyebrow {
  margin: 0;
  color: #8a5a12;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  margin: 8px 0 10px;
  font-size: 40px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.lead {
  margin: 0 0 24px;
  color: #5c5348;
  font-size: 16px;
  line-height: 1.6;
}
code {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 0.92em;
}
form {
  display: grid;
  gap: 10px;
}
label {
  font-size: 13px;
  font-weight: 700;
}
input[type='text'],
input:not([type]) {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 12px;
  border: 1px solid #d9cbb6;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  font: 18px/1.3 "IBM Plex Mono", ui-monospace, monospace;
}
input:focus {
  outline: 2px solid #1c1915;
  outline-offset: 1px;
}
.recent {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.recent button {
  padding: 6px 8px;
  border: 1px solid #e4d8c4;
  border-radius: 999px;
  background: #faf6ef;
  color: #5c5348;
  font: 12px/1 "IBM Plex Mono", ui-monospace, monospace;
  cursor: pointer;
}
.confirm {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 6px;
  color: #5c5348;
  font-weight: 500;
  line-height: 1.5;
}
.confirm input {
  margin-top: 3px;
}
.go {
  justify-self: start;
  margin-top: 6px;
  padding: 12px 18px;
  border: 0;
  border-radius: 8px;
  background: #1c1915;
  color: #fffdf8;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}
.go:disabled {
  background: #b7aa98;
  cursor: default;
}
.result {
  margin-top: 22px;
  padding: 16px;
  border-radius: 10px;
}
.result.ok {
  background: #eef6ef;
}
.result.bad {
  background: #fdecec;
  color: #8d1d18;
}
.result h2 {
  margin: 0 0 6px;
  font-size: 20px;
}
.result p {
  margin: 0 0 12px;
}
dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin: 0;
}
dt {
  color: #74685a;
  font-size: 12px;
}
dd {
  margin: 2px 0 0;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.wide {
  grid-column: 1 / -1;
}
@media (max-width: 640px) {
  h1 { font-size: 32px; }
  dl { grid-template-columns: 1fr; }
}
</style>
