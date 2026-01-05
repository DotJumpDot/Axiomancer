<script lang="ts">
  import { onMount } from 'svelte';

  interface NotificationItem {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
    duration?: number;
    closable?: boolean;
  }

  let notifications = $state<NotificationItem[]>([]);

  function addNotification(notification: Omit<NotificationItem, 'id'>) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationItem = {
      id,
      duration: 4500, // Default 4.5 seconds
      closable: true,
      ...notification
    };

    notifications = [...notifications, newNotification];

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  function removeNotification(id: string) {
    notifications = notifications.filter(n => n.id !== id);
  }

  function clearAll() {
    notifications = [];
  }

  // Expose functions globally for easy access
  onMount(() => {
    // Make notification functions available globally
    (window as any).notification = {
      success: (title: string, message?: string, options?: Partial<NotificationItem>) =>
        addNotification({ type: 'success', title, message, ...options }),
      error: (title: string, message?: string, options?: Partial<NotificationItem>) =>
        addNotification({ type: 'error', title, message, ...options }),
      info: (title: string, message?: string, options?: Partial<NotificationItem>) =>
        addNotification({ type: 'info', title, message, ...options }),
      warning: (title: string, message?: string, options?: Partial<NotificationItem>) =>
        addNotification({ type: 'warning', title, message, ...options }),
      remove: removeNotification,
      clear: clearAll
    };
  });
</script>

<!-- Notification Container -->
<div class="notification-container">
  {#each notifications as notification (notification.id)}
    <div
      class="notification notification-{notification.type}"
      class:closable={notification.closable}
      role="alert"
    >
      <div class="notification-content">
        <div class="notification-icon">
          {#if notification.type === 'success'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          {:else if notification.type === 'error'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          {:else if notification.type === 'warning'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          {:else if notification.type === 'info'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          {/if}
        </div>
        <div class="notification-body">
          <div class="notification-title">{notification.title}</div>
          {#if notification.message}
            <div class="notification-message">{notification.message}</div>
          {/if}
        </div>
      </div>
      {#if notification.closable}
        <button
          class="notification-close"
          onclick={() => removeNotification(notification.id)}
          aria-label="Close notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    top: 24px;
    left: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
    pointer-events: none;
  }

  .notification {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    backdrop-filter: blur(8px);
  }

  .notification-success {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
    color: #16a34a;
  }

  .notification-error {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #dc2626;
  }

  .notification-warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: #f59e0b;
    color: #d97706;
  }

  .notification-info {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    color: #2563eb;
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
  }

  .notification-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notification-body {
    flex: 1;
  }

  .notification-title {
    font-weight: 600;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .notification-message {
    font-size: 13px;
    line-height: 1.4;
    opacity: 0.9;
  }

  .notification-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .notification-close:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  .notification.closable .notification-close {
    opacity: 0.7;
  }

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Dark theme adjustments */
  @media (prefers-color-scheme: dark) {
    .notification {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .notification-container {
      left: 12px;
      right: 12px;
      max-width: none;
    }

    .notification {
      padding: 12px;
    }
  }
</style>