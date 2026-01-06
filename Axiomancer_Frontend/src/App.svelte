<script lang="ts">
  import { onMount } from "svelte";
  import Chat from '@/pages/Chat.svelte';
  import Notification from '@/Components/Notification.svelte';
  import { authStore } from '@/Store/auth.svelte';

  // onMount(() => {
  //   authStore.initialize();
  // });
</script>

<Chat />
<Notification />
