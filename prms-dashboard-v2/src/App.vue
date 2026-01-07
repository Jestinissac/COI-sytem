<template>
  <div style="display:flex;min-height:100vh">
    <aside style="width:220px;border-right:1px solid #e5e7eb;padding:12px">
      <div style="font-weight:600;margin-bottom:8px">PRMS v2</div>
      <nav style="display:flex;flex-direction:column;gap:6px">
        <router-link :to="{name:'management'}">Management</router-link>
        <router-link :to="{name:'finance'}">Finance</router-link>
        <router-link :to="{name:'project', params:{id:'P1'}}">Project</router-link>
        <router-link :to="{name:'admin'}">Admin</router-link>
        <router-link :to="{name:'auditor'}">Auditor</router-link>
      </nav>
    </aside>
    <main style="flex:1;padding:16px">
      <router-view />
    </main>
  </div>
</template>
<script setup lang="ts"></script>
