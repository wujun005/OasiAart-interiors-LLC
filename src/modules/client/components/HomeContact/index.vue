<template>
  <div class="floating-contact">
    <el-button
      class="contact-btn"
      @click="handleContact"
    >
      <el-icon :size="24"><ChatDotSquare /></el-icon>
    </el-button>

    <el-dialog
      v-model="contactDialogVisible"
      :title="$t('homepage.contact.contactUs')"
      width="480px"
      :close-on-click-modal="false"
      class="contact-dialog"
    >
      <div class="contact-dialog-content">
        <div class="contact-item">
          <span class="contact-label">{{ $t('aboutPage.join.dialog.emailLabel') }}</span>
          <span class="contact-value">{{ contactInfo.email }}</span>
        </div>
        <div class="contact-item">
          <span class="contact-label">{{ $t('aboutPage.join.dialog.phoneLabel') }}</span>
          <span class="contact-value">{{ contactInfo.phone }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChatDotSquare } from '@element-plus/icons-vue';
import { contactInfo } from '../../data/homepage';

const contactDialogVisible = ref(false);

const handleContact = () => {
  contactDialogVisible.value = true;
};
</script>

<style scoped lang="scss">
.floating-contact {
  position: fixed;
  right: 30px;
  bottom: 150px;
  z-index: 999;

  .contact-btn {
    width: 50px;
    height: 50px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    color: #fff;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #333;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    
    .el-icon {
      color: #fff;
    }
  }
}

.contact-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }
  
  :deep(.el-dialog__header) {
    padding: 4rem 4rem 2rem 4rem;
    border-bottom: 1px solid #e0e0e0;
    margin: 0;
    position: relative;
    display: block !important;
    text-align: center;
    min-height: 120px;
    
    .el-dialog__title {
      font-size: 1.75rem;
      font-weight: bold !important;
      color: #333;
      line-height: 1.5;
      text-align: center !important;
      position: absolute;
      left: 50%;
      top: 4rem;
      transform: translateX(-50%);
      width: auto;
      margin: 0;
      padding: 0;
    }
    
    .el-dialog__headerbtn {
      position: absolute;
      top: 3rem;
      right: 4rem;
      width: 32px;
      height: 32px;
      z-index: 1;
      
      .el-dialog__close {
        font-size: 1.5rem;
        color: #333;
        font-weight: 500;
      }
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 4rem;
  }
}

.contact-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  
  .contact-item {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    line-height: 1.5;
    
    .contact-label {
      color: #333;
      font-weight: 400;
    }
    
    .contact-value {
      color: #333;
      font-weight: 400;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .floating-contact {
    right: 20px;
    bottom: 120px;
    
    .contact-btn {
      width: 44px;
      height: 44px;
      
      .el-icon {
        font-size: 20px;
      }
    }
  }
}
</style>
