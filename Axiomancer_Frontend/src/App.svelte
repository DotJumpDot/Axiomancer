<script lang="ts">
  import { onMount } from "svelte";
  import { Router, Route, Link } from "svelte-routing";
  import Chat from '@/pages/Chat.svelte';
  import AnalyticsPage from '@/pages/AnalyticsPage.svelte';
  import Notification from '@/Components/Notification.svelte';
  import { authStore } from '@/Store/auth.svelte';

  // onMount(() => {
  //   authStore.initialize();
  // });
</script>

<Router>
  <Route path="/conversation/:id" let:params>
    <Chat conversationId={params.id} />
  </Route>
  <Route path="/analytics">
    <AnalyticsPage />
  </Route>
  <Route path="/">
    <Chat />
  </Route>
</Router>

<Notification />
