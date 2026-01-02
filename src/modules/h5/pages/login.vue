<template>
  <div class="login-page">
    <van-nav-bar
      title="账户登录"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />

    <div class="page-section login-card">
      <div class="login-title">
        <h2>欢迎回来</h2>
        <p>预约记录、会员权益均可在移动端查看</p>
      </div>
      <van-form @submit="onSubmit">
        <van-field
          v-model="form.mobile"
          name="mobile"
          label="手机"
          type="tel"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
        <van-field
          v-model="form.code"
          name="code"
          label="验证码"
          placeholder="请输入验证码"
          :rules="[{ required: true, message: '请输入验证码' }]"
        >
          <template #button>
            <van-button size="small" type="primary" plain @click.prevent="sendCode">获取验证码</van-button>
          </template>
        </van-field>
        <div style="margin: 16px 0;">
          <van-button round block type="primary" native-type="submit">
            登录 / 注册
          </van-button>
        </div>
      </van-form>
      <van-cell center title="其他登录方式" value="即将上线" is-link icon="friends-o" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  mobile: '',
  code: '',
})

const sendCode = () => {
  if (!form.mobile) {
    showToast('请先填写手机号')
    return
  }
  showToast('验证码已发送')
}

const onSubmit = () => {
  if (!form.mobile || !form.code) {
    showToast('请填写完整信息')
    return
  }
  showToast('登录成功')
  router.replace('/')
}

const goBack = () => router.back()
</script>

<style scoped lang="scss">
.login-page {
  padding: 12px;
}

.login-card {
  margin-top: 8px;
}

.login-title {
  margin-bottom: 12px;
}

.login-title h2 {
  margin: 0;
  font-size: 20px;
}

.login-title p {
  margin: 4px 0 0;
  color: #666;
}
</style>
