<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Column 1: Logo, Tagline, Social Icons -->
      <div class="footer-column footer-column-1">
        <div class="footer-logo">
          <LogoIcon class="logo-icon" />
        </div>
        <p class="footer-tagline">{{ $t('homepage.footer.tagline') }}</p>
        <div class="social-icons">
          <a href="#" class="social-icon" aria-label="Facebook">
            <span class="social-icon-text">f</span>
          </a>
          <a href="#" class="social-icon" aria-label="LinkedIn">
            <span class="social-icon-text">in</span>
          </a>
          <a href="#" class="social-icon" aria-label="Instagram">
            <span class="social-icon-text">📷</span>
          </a>
        </div>
      </div>

      <!-- Column 2: Navigation -->
      <div class="footer-column footer-column-2">
        <h3 class="footer-heading">OASIS ART</h3>
        <nav class="footer-nav">
          <router-link to="/" class="footer-nav-link">{{ $t('homepage.header.nav.home') }}</router-link>
          <router-link to="/services" class="footer-nav-link">{{ $t('homepage.header.nav.services') }}</router-link>
          <router-link to="/about" class="footer-nav-link">{{ $t('homepage.header.nav.about') }}</router-link>
          <router-link to="/order-history" class="footer-nav-link">{{ $t('homepage.header.nav.orderHistory') }}</router-link>
        </nav>
      </div>

      <!-- Column 3: Working Hours -->
      <div class="footer-column footer-column-3">
        <h3 class="footer-heading">{{ $t('homepage.footer.workingHours.title') }}</h3>
        <div class="working-hours">
          <p class="working-hours-item">{{ $t('homepage.footer.workingHours.weekday') }}</p>
          <p class="working-hours-item">{{ $t('homepage.footer.workingHours.saturday') }}</p>
          <p class="working-hours-item">{{ $t('homepage.footer.workingHours.sunday') }}</p>
        </div>
      </div>

      <!-- Column 4: Contact -->
      <div class="footer-column footer-column-4">
        <h3 class="footer-heading">{{ $t('homepage.footer.contactUs') }}</h3>
        <div class="contact-info">
          <p class="contact-item">{{ contactInfo.email }}</p>
          <p class="contact-item">{{ contactInfo.phone }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { contactInfo } from '../../data/homepage';
import LogoIcon from '@/assets/images/homepage/logo.svg?component';
</script>

<style scoped lang="scss">
.app-footer {
  background-color: #000000;
  color: #ffffff;
  height: 342px;
  padding: 0;
  display: flex;
  align-items: center;
}

.footer-container {
  max-width: 1920px;
  width: 100%;
  margin: 0 auto;
  padding: 0 200px;
  display: grid;
  grid-template-columns: 266px auto auto auto;
  gap: 0;
  align-items: start;
}

.footer-column {
  display: flex;
  flex-direction: column;
  padding: 0 50px;

  &:first-child {
    padding-left: 0;
  }

  &:last-child {
    padding-right: 0;
  }
}

.footer-column-1 {
  gap: 1.5rem;
}

.footer-column-2,
.footer-column-3,
.footer-column-4 {
  white-space: nowrap;
  min-width: fit-content;
}

.footer-logo {
  .logo-icon {
    height: 21px;
    width: auto;
    color: #ffffff;
  }
}

.footer-tagline {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  max-width: 400px;
}

.social-icons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  text-decoration: none;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
  }

  .social-icon-text {
    font-size: 16px;
    color: #ffffff;
    font-weight: 500;
  }
}

.footer-heading {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 1.5rem 0;
  color: #ffffff;
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  transition: color 0.3s ease;
  white-space: nowrap;

  &:hover {
    color: #ffffff;
  }
}

.working-hours {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.working-hours-item {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
  white-space: nowrap;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-item {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
  white-space: nowrap;
}
</style>
