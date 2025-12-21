<template>
  <footer class="home-footer">
    <div class="footer-container">
      <!-- Left Column: Company Info -->
      <div class="footer-column">
        <div class="footer-logo">
          <h2>OASIS ART</h2>
        </div>
        <p class="footer-tagline">{{ $t('homepage.footer.tagline') }}</p>
        <div class="social-icons">
          <span class="social-icon">f</span>
          <span class="social-icon">in</span>
          <span class="social-icon">💬</span>
          <span class="social-icon">📷</span>
        </div>
      </div>

      <!-- Middle Column: Navigation and Working Hours -->
      <div class="footer-column">
        <h3 class="footer-heading">OASIS ART</h3>
        <nav class="footer-nav">
          <router-link to="/" class="footer-nav-link">{{ $t('homepage.header.nav.home') }}</router-link>
          <router-link to="/services" class="footer-nav-link">{{ $t('homepage.header.nav.services') }}</router-link>
          <router-link to="/about" class="footer-nav-link">{{ $t('homepage.header.nav.about') }}</router-link>
          <router-link to="/order-history" class="footer-nav-link">{{ $t('homepage.header.nav.orderHistory') }}</router-link>
        </nav>
        <div class="working-hours">
          <h4 class="hours-title">{{ $t('homepage.footer.workingHours.weekday') }}</h4>
          <p>{{ $t('homepage.footer.workingHours.weekday') }}</p>
          <p>{{ $t('homepage.footer.workingHours.saturday') }}</p>
          <p>{{ $t('homepage.footer.workingHours.sunday') }}</p>
        </div>
      </div>

      <!-- Right Column: Contact -->
      <div class="footer-column">
        <h3 class="footer-heading">{{ $t('homepage.footer.contactUs') }}</h3>
        <p class="contact-info">{{ contactInfo.email }}</p>
        <p class="contact-info">{{ contactInfo.phone }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { contactInfo } from '../../data/homepage';
</script>

<style scoped lang="scss">
.home-footer {
  background-color: #000000;
  color: #ffffff;
  padding: 4rem 2rem 2rem;
}

.footer-container {
  max-width: 1920px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4rem;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.footer-logo {
  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    color: #ffffff;
  }
}

.footer-tagline {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #cccccc;
  margin: 0;
}

.social-icons {
  display: flex;
  gap: 1rem;
}

.social-icon {
  font-size: 1.25rem;
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
}

.footer-heading {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #ffffff;
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-nav-link {
  color: #cccccc;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
}

.working-hours {
  p {
    font-size: 0.875rem;
    color: #cccccc;
    margin: 0.5rem 0;
  }
}

.hours-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.contact-info {
  font-size: 0.875rem;
  color: #cccccc;
  margin: 0.5rem 0;
}
</style>

