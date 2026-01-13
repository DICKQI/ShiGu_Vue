<template>
  <Layout />
</template>

<script setup lang="ts">
import Layout from './components/Layout.vue'
</script>

<style>
#app {
  min-height: 100vh;
  height: 100%;
  /* 禁用移动端弹性滚动（果冻效果） */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  position: relative;
}
</style>
