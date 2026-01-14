<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { promptStore, authStore, favoriteStore } from "@/Store";


	// Focus helper used throughout the popup to reduce clicks
	function focusInput(node: HTMLInputElement | HTMLTextAreaElement) {
		node.focus();
		if (node instanceof HTMLInputElement) {
			node.select();
		}
	}

	let {
		isOpen = false,
		onClose
	}: {
		isOpen?: boolean;
		onClose?: () => void;
	} = $props();

	const dispatch = createEventDispatcher<{ select: { promptId: string | null } }>();

	let selectedPromptId = $state<string | null>(null);
	let showPromptSystemPrompt = $state<string | null>(null);
	let editingPromptId = $state<string | null>(null);
	let editingPromptName = $state('');
	let editingPromptDescription = $state('');
	let editingSystemPrompt = $state<string | null>(null);
	let editingSystemPromptValue = $state('');
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Reset transient state whenever the modal opens
	$effect(() => {
		if (isOpen) {
			selectedPromptId = promptStore.selectedProfile?.id ?? null;
			showPromptSystemPrompt = null;
			editingPromptId = null;
			editingPromptName = '';
			editingPromptDescription = '';
			editingSystemPrompt = null;
			editingSystemPromptValue = '';
			errorMessage = null;
			successMessage = null;
		}
	});

	function closeModal() {
		if (onClose) onClose();
	}

	function togglePromptSystemPrompt(promptId: string | null) {
		showPromptSystemPrompt = showPromptSystemPrompt === promptId ? null : promptId;
	}

	function getNextAvailablePromptName(): string {
		const existingNames = promptStore.profiles.map((p) => p.name);
		let counter = 1;
		while (existingNames.includes(`New Prompt ${counter}`)) {
			counter++;
		}
		return `New Prompt ${counter}`;
	}

	async function createNewPrompt() {
		if (!authStore.currentUser?.uuid) {
			errorMessage = "⚠️ Please log in to create prompts.";
			return;
		}

		errorMessage = null;
		successMessage = null;

		try {
			const newPrompt = await promptStore.createProfile({
				name: getNextAvailablePromptName(),
				description: "Starter prompt for coding assistance.",
				system_prompt: "You are a coding assistant. Provide concise, correct answers with brief reasoning and clear code.",
			});

			if (newPrompt?.id) {
				selectedPromptId = newPrompt.id;
				successMessage = "✓ Prompt created";
				setTimeout(() => (successMessage = null), 2600);
			}
		} catch (error) {
			console.error("Failed to create prompt:", error);
			errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to create prompt.");
		}
	}

	function startEditPromptInfo(promptId: string) {
		const profile = promptStore.profiles.find((p) => p.id === promptId);
		if (!profile) return;
		editingPromptId = promptId;
		editingPromptName = profile.name;
		editingPromptDescription = profile.description || '';
	}

	function cancelEditPromptInfo() {
		editingPromptId = null;
		editingPromptName = '';
		editingPromptDescription = '';
	}

	async function saveEditPromptInfo() {
		if (!editingPromptId || !editingPromptName.trim()) {
			cancelEditPromptInfo();
			return;
		}

		errorMessage = null;
		successMessage = null;

		try {
			await promptStore.updateProfile(editingPromptId, {
				name: editingPromptName.trim(),
				description: editingPromptDescription.trim() || undefined,
			});
			successMessage = "✓ Prompt updated";
			setTimeout(() => (successMessage = null), 2600);
		} catch (error) {
			console.error("Failed to update prompt:", error);
			errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to update prompt.");
		} finally {
			cancelEditPromptInfo();
		}
	}

	function startEditSystemPrompt(promptId: string) {
		const profile = promptStore.profiles.find((p) => p.id === promptId);
		if (!profile) return;
		editingSystemPrompt = promptId;
		editingSystemPromptValue = profile.system_prompt;
	}

	function cancelEditSystemPrompt() {
		editingSystemPrompt = null;
		editingSystemPromptValue = '';
	}

	async function saveEditSystemPrompt() {
		if (!editingSystemPrompt || !editingSystemPromptValue.trim()) {
			cancelEditSystemPrompt();
			return;
		}

		errorMessage = null;
		successMessage = null;

		try {
			await promptStore.updateProfile(editingSystemPrompt, {
				system_prompt: editingSystemPromptValue.trim(),
			});
			successMessage = "✓ System prompt updated";
			setTimeout(() => (successMessage = null), 2600);
		} catch (error) {
			console.error("Failed to update system prompt:", error);
			errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to update system prompt.");
		} finally {
			cancelEditSystemPrompt();
		}
	}

	async function deletePrompt(promptId: string) {
		if (!confirm('Are you sure you want to delete this prompt?')) {
			return;
		}

		errorMessage = null;
		successMessage = null;

		try {
			await promptStore.deleteProfile(promptId);
			if (selectedPromptId === promptId) {
				selectedPromptId = null;
			}
			successMessage = "✓ Prompt deleted";
			setTimeout(() => (successMessage = null), 2600);
		} catch (error) {
			console.error("Failed to delete prompt:", error);
			errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to delete prompt.");
		}

		if (editingPromptId === promptId) {
			cancelEditPromptInfo();
		}
		if (editingSystemPrompt === promptId) {
			cancelEditSystemPrompt();
		}
	}

	function applyPrompt() {
		dispatch('select', { promptId: selectedPromptId });
		closeModal();
	}

	// Derived value for filtered prompts - reactive to favorites
	let filteredPrompts = $derived.by(() => {
	  // Force reactivity with favorite store
	  const favorites = favoriteStore.favorites;
	  
	  const profiles = [...promptStore.profiles];
	  
	  // Sort prompts with favorites first
	  return profiles.sort((a, b) => {
	    const aIsFavorite = favoriteStore.isFavorite('prompt', a.id);
	    const bIsFavorite = favoriteStore.isFavorite('prompt', b.id);
	    
	    if (aIsFavorite && !bIsFavorite) return -1;
	    if (!aIsFavorite && bIsFavorite) return 1;
	    return 0;
	  });
	});

	async function togglePromptFavorite(e: Event, promptId: string) {
	  e.stopPropagation();
	  if (!authStore.currentUser?.uuid) return;
	  
	  const isFav = favoriteStore.isFavorite('prompt', promptId);
	  try {
	    if (isFav) {
	      await favoriteStore.removeFromFavorite(authStore.currentUser.uuid, 'prompt', promptId);
	    } else {
	      await favoriteStore.addToFavorite(authStore.currentUser.uuid, 'prompt', promptId);
	    }
	    // Force reactivity by triggering a small delay
	    await new Promise(resolve => setTimeout(resolve, 10));
	  } catch (error) {
	    console.error("Failed to toggle prompt favorite:", error);
	  }
	}



</script>

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="preset-popup-backdrop" onmousedown={closeModal}>
		<div class="preset-popup" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
			<div class="preset-popup-header">
				<div class="prompt-edit-header">
					<div>
						<h3 class="preset-title">Prompt Manager</h3>
						<div class="prompt-meta">{promptStore.profiles.length} saved prompts</div>
					</div>
					<button class="add-prompt-btn" onclick={createNewPrompt} title="Add New Prompt">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						Add Prompt
					</button>
				</div>
				{#if errorMessage}
					<div class="message error-message">{errorMessage}</div>
				{/if}
				{#if successMessage}
					<div class="message success-message">{successMessage}</div>
				{/if}
			</div>

			<div class="preset-popup-content">
				<div class="preset-panel">
					<div class="preset-panel-header">
						<div class="header-left">
							<h4>Prompts</h4>
							<span class="model-count">{selectedPromptId ? 'Selected' : 'Default selected'}</span>
						</div>
					</div>
					<div class="prompt-list">
						<label class="prompt-radio-item {selectedPromptId === null ? 'selected' : ''}">
							<input
								type="radio"
								name="prompt-choice"
								bind:group={selectedPromptId}
								value={null}
							/>
							<div class="prompt-info">
								<span class="item-name">Default</span><br />
								<span class="item-desc">Standard helpful assistant</span>
							</div>
							<button class="show-prompt-label" onclick={() => togglePromptSystemPrompt('default')} title="Show System Prompt">
								<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</button>
						</label>
						{#if showPromptSystemPrompt === 'default'}
							<div class="individual-system-prompt">
								<div class="system-prompt-content">
									<pre>You are a helpful assistant.</pre>
								</div>
							</div>
						{/if}

						{#each filteredPrompts as profile (profile.id)}
							<label class="prompt-radio-item {selectedPromptId === profile.id ? 'selected' : ''}">
								<input
									type="radio"
									name="prompt-choice"
									bind:group={selectedPromptId}
									value={profile.id}
								/>
								<div class="prompt-info">
									{#if editingPromptId === profile.id}
										<div class="edit-prompt-form">
											<input
												type="text"
												class="edit-input"
												bind:value={editingPromptName}
												placeholder="Prompt name"
												use:focusInput
											/>
											<input
												type="text"
												class="edit-input"
												bind:value={editingPromptDescription}
												placeholder="Description"
											/>
											<div class="edit-actions">
												<button class="save-edit-btn" onclick={saveEditPromptInfo} title="Save prompt info">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<polyline points="20 6 9 17 4 12"></polyline>
													</svg>
												</button>
												<button class="cancel-edit-btn" onclick={cancelEditPromptInfo} title="Cancel">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<line x1="18" y1="6" x2="6" y2="18"></line>
														<line x1="6" y1="6" x2="18" y2="18"></line>
													</svg>
												</button>
											</div>
										</div>
									{:else}
										<span class="item-name">
											{profile.name}
											<button
												class="inline-favorite-btn {favoriteStore.isFavorite('prompt', profile.id) ? 'favorited' : ''}"
												onclick={(e) => togglePromptFavorite(e, profile.id)}
												title={favoriteStore.isFavorite('prompt', profile.id) ? "Remove from favorites" : "Add to favorites"}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={favoriteStore.isFavorite('prompt', profile.id) ? "#ffc107" : "none"} stroke="#ffc107" stroke-width="2">
													<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
												</svg>
											</button>
										</span>
										<button class="edit-prompt-btn" style="margin-left: 10px;" onclick={(e) => { e.preventDefault(); startEditPromptInfo(profile.id); }} title="Edit Name & Description">
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
											</svg>
										</button>
										<button class="delete-prompt-btn" style="margin-left: 2px;" onclick={(e) => { e.preventDefault(); deletePrompt(profile.id); }} title="Delete Prompt">
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<polyline points="3 6 5 6 21 6"></polyline>
												<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
											</svg>
										</button>
										{#if profile.description}
											<br />
											<span class="item-desc">{profile.description}</span>
										{/if}
									{/if}
								</div>
								{#if editingPromptId !== profile.id}
									<button class="show-prompt-label" onclick={() => togglePromptSystemPrompt(profile.id)} title="Show System Prompt">
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<polyline points="6 9 12 15 18 9"></polyline>
										</svg>
									</button>
								{/if}
							</label>
							{#if showPromptSystemPrompt === profile.id}
								<div class="individual-system-prompt">
									{#if editingSystemPrompt === profile.id}
										<div class="edit-system-prompt-form">
											<textarea
												class="edit-textarea"
												bind:value={editingSystemPromptValue}
												rows="6"
												use:focusInput
											></textarea>
											<div class="edit-actions">
												<button class="save-edit-btn" onclick={saveEditSystemPrompt}>
													<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<polyline points="20 6 9 17 4 12"></polyline>
													</svg>
													Save
												</button>
												<button class="cancel-edit-btn" onclick={cancelEditSystemPrompt}>
													<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<line x1="18" y1="6" x2="6" y2="18"></line>
														<line x1="6" y1="6" x2="18" y2="18"></line>
													</svg>
													Cancel
												</button>
											</div>
										</div>
									{:else}
										<div class="system-prompt-header">
											<h5>System Prompt</h5>
											<button class="edit-system-prompt-btn" onclick={() => startEditSystemPrompt(profile.id)} title="Edit System Prompt">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
													<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
												</svg>
												Edit
											</button>
										</div>
										<div class="system-prompt-content">
											<pre>{profile.system_prompt}</pre>
										</div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>

			<div class="preset-popup-footer">
				<button class="cancel-btn" onclick={closeModal}>Cancel</button>
				<button class="apply-btn" onclick={applyPrompt}>Apply</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ChatHeader - Preset Popup */
	.preset-popup-backdrop {
	  position: fixed;
	  top: 0;
	  left: 0;
	  right: 0;
	  bottom: 0;
	  background: #000000cc;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  z-index: 1000;
	}

	.preset-popup {
	  background: var(--bg-primary, #1a1a1a);
	  border: 1px solid var(--border-color, #2d2d2d);
	  border-radius: 12px;
	  width: 1200px;
	  height: 90vh;
	  display: flex;
	  flex-direction: column;
	  overflow: hidden;
	  animation: slideIn 0.2s ease-out;
	}

	.preset-popup-header {
	  display: flex;
	  flex-direction: column;
	  gap: 0;
	  padding: 20px 24px;
	  border-bottom: 1px solid var(--border-color, #2d2d2d);
	}

	.preset-popup-header > div:first-child {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  width: 100%;
	}

	.preset-popup-header h3 {
	  margin: 0;
	  color: var(--text-primary, #fff);
	  font-size: 18px;
	  font-weight: 600;
	}

	.preset-title {
	  margin: 0;
	  color: var(--text-primary, #fff);
	  font-size: 18px;
	  font-weight: 600;
	  transition: opacity 0.2s;
	}

	.preset-title:hover {
	  opacity: 0.8;
	}

	.preset-popup-header .message {
	  width: 100%;
	  padding: 8px 12px;
	  border-radius: 6px;
	  font-size: 13px;
	  margin-top: 12px;
	}

	.preset-popup-header .error-message {
	  background: rgba(255, 68, 68, 0.1);
	  border: 1px solid #ff4444;
	  color: #ff6666;
	}

	.preset-popup-header .success-message {
	  background: rgba(0, 255, 200, 0.1);
	  border: 1px solid #00ffc8;
	  color: #00ffc8;
	}

	.preset-popup-content {
	  display: flex;
	  flex-direction: column;
	  gap: 20px;
	  flex: 1;
	  overflow: hidden;
	  padding: 20px 24px;
	}

	.preset-panel {
	  display: flex;
	  flex-direction: column;
	  gap: 12px;
	  overflow: hidden;
	  min-height: 400px;
	}

	.preset-panel-header {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  margin-bottom: 8px;
	}

	.preset-panel-header .header-left {
	  display: flex;
	  flex-direction: column;
	  gap: 4px;
	}

	.preset-panel-header .header-left h4 {
	  margin: 0;
	  color: var(--text-primary, #fff);
	  font-size: 16px;
	  font-weight: 600;
	}

	.add-prompt-btn {
	  background: #00ffc8;
	  border: none;
	  color: #000000;
	  cursor: pointer;
	  padding: 6px 12px;
	  border-radius: 6px;
	  transition: all 0.2s;
	  display: flex;
	  align-items: center;
	  gap: 6px;
	  font-size: 13px;
	  font-weight: 500;
	}

	.add-prompt-btn:hover {
	  background: #01b18b;
	}

	.model-count {
	  font-size: 12px;
	  padding: 4px 12px;
	  background: var(--input-bg, #2d2d2d);
	  border-radius: 12px;
	  color: var(--text-secondary, #888);
	}

	.prompt-list {
	  display: flex;
	  flex-direction: column;
	  gap: 8px;
	  overflow-y: auto;
	  flex: 1;
	  padding-right: 8px;
	  min-height: 300px;
	}

	.prompt-list::-webkit-scrollbar {
	  width: 6px;
	}

	.prompt-list::-webkit-scrollbar-track {
	  background: transparent;
	}

	.prompt-list::-webkit-scrollbar-thumb {
	  background: var(--border-color, #3d3d3d);
	  border-radius: 3px;
	}

	.prompt-radio-item {
	  display: flex;
	  align-items: center;
	  gap: 12px;
	  padding: 12px;
	  background: var(--input-bg, #2d2d2d);
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 8px;
	  cursor: pointer;
	  transition: all 0.2s;
	}

	.prompt-radio-item:hover {
	  background: var(--hover-bg, #3d3d3d);
	  border-color: var(--border-color-hover, #4d4d4d);
	}

	.prompt-radio-item.selected {
	  background: rgba(99, 102, 241, 0.1);
	  border-color: var(--primary-color, #6366f1);
	  box-shadow: 0 0 0 1px var(--primary-color, #6366f1);
	}

	.prompt-radio-item input[type="radio"] {
	  accent-color: var(--primary-color, #6366f1);
	}

	.show-prompt-label {
	  margin-left: auto;
	  padding: 4px;
	  background: transparent;
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 4px;
	  color: var(--text-secondary, #888);
	  cursor: pointer;
	  transition: all 0.2s;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	}

	.show-prompt-label:hover {
	  background: var(--hover-bg, #3d3d3d);
	  color: var(--text-primary, #fff);
	  border-color: var(--border-color-hover, #4d4d4d);
	}

	.edit-prompt-btn,
	.delete-prompt-btn {
	  padding: 6px;
	  background: transparent;
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 4px;
	  color: var(--text-secondary, #888);
	  cursor: pointer;
	  transition: all 0.2s;
	  display: inline-flex;
	  align-items: center;
	  justify-content: center;
	}

	.edit-prompt-btn:hover {
	  background: var(--hover-bg, #3d3d3d);
	  color: #00ffc8;
	  border-color: #00ffc8;
	}

	.delete-prompt-btn:hover {
	  background: var(--danger-color, #e53e3e);
	  color: white;
	  border-color: var(--danger-color, #e53e3e);
	}

	.edit-prompt-form {
	  display: flex;
	  flex-direction: column;
	  gap: 8px;
	  width: 100%;
	}

	.edit-input {
	  background: var(--bg-secondary, #2a2a2a);
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 4px;
	  color: var(--text-primary, #fff);
	  padding: 6px 8px;
	  font-size: 13px;
	  outline: none;
	  width: 1080px;
	}

	.edit-input:focus {
	  border-color: var(--accent-color, #007acc);
	  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
	}

	.edit-actions {
	  display: flex;
	  gap: 6px;
	  justify-content: flex-end;
	}

	.save-edit-btn,
	.cancel-edit-btn {
	  padding: 10px 30px;
	  border-radius: 4px;
	  cursor: pointer;
	  transition: all 0.2s;
	  display: flex;
	  align-items: center;
	  gap: 4px;
	  font-size: 12px;
	  font-weight: 500;
	  border: none;
	}

	.save-edit-btn {
	  background: #00ffc8;
	  color: #000;
	}

	.save-edit-btn:hover {
	  background: #01b18b;
	}

	.cancel-edit-btn {
	  background: var(--danger-color, #e53e3e);
	  color: white;
	}

	.cancel-edit-btn:hover {
	  background: #8b2626;
	}

	.prompt-info .item-name {
	  color: var(--text-primary, #fff);
	  font-weight: 500;
	  font-size: 14px;
	}

	.prompt-info .item-desc {
	  color: var(--text-secondary, #888);
	  font-size: 12px;
	}

	.preset-popup-footer {
	  display: flex;
	  justify-content: flex-start;
	  gap: 12px;
	  padding: 20px 24px;
	  border-top: 1px solid var(--border-color, #2d2d2d);
	}

	.cancel-btn {
	  margin-left: auto;
	  padding: 8px 16px;
	  background: var(--danger-color, #e53e3e);
	  border: 1px solid var(--danger-color, #e53e3e);
	  border-radius: 6px;
	  color: white;
	  cursor: pointer;
	  font-size: 14px;
	  font-weight: 500;
	  transition: all 0.2s;
	}

	.cancel-btn:hover {
	  background: #8b2626;
	  border-color: #8b2626;
	}

	.apply-btn {
	  padding: 8px 16px;
	  background: var(--primary-color, #6366f1);
	  border: 1px solid var(--primary-color, #6366f1);
	  border-radius: 6px;
	  color: white;
	  cursor: pointer;
	  font-size: 14px;
	  font-weight: 500;
	  transition: all 0.2s;
	}

	.apply-btn:hover {
	  background: var(--primary-color-hover, #5855eb);
	  border-color: var(--primary-color-hover, #5855eb);
	}

	.individual-system-prompt {
	  margin: 8px 0 12px 36px;
	  padding: 12px;
	  background: var(--input-bg, #2d2d2d);
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 6px;
	}

	.individual-system-prompt .system-prompt-header {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  margin-bottom: 8px;
	}

	.individual-system-prompt .system-prompt-header h5 {
	  margin: 0;
	  color: var(--text-primary, #fff);
	  font-size: 13px;
	  font-weight: 600;
	}

	.edit-system-prompt-btn {
	  padding: 4px 8px;
	  background: transparent;
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 4px;
	  color: var(--text-secondary, #888);
	  cursor: pointer;
	  transition: all 0.2s;
	  display: flex;
	  align-items: center;
	  gap: 4px;
	  font-size: 12px;
	}

	.edit-system-prompt-btn:hover {
	  background: var(--hover-bg, #3d3d3d);
	  color: #00ffc8;
	  border-color: #00ffc8;
	}

	.edit-system-prompt-form {
	  display: flex;
	  flex-direction: column;
	  gap: 8px;
	}

	.edit-textarea {
	  background: var(--bg-secondary, #2a2a2a);
	  border: 1px solid var(--border-color, #3d3d3d);
	  border-radius: 4px;
	  color: var(--text-primary, #fff);
	  padding: 8px;
	  font-size: 12px;
	  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
	  outline: none;
	  resize: vertical;
	  line-height: 1.4;
	}

	.edit-textarea:focus {
	  border-color: var(--accent-color, #007acc);
	  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
	}

	.individual-system-prompt .system-prompt-content {
	  max-height: 150px;
	  overflow-y: auto;
	}

	.individual-system-prompt .system-prompt-content pre {
	  margin: 0;
	  color: var(--text-primary, #fff);
	  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
	  font-size: 12px;
	  line-height: 1.4;
	  white-space: pre-wrap;
	  word-wrap: break-word;
	}

	.prompt-edit-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	
	.inline-favorite-btn {
	  background: none;
	  border: none;
	  cursor: pointer;
	  padding: 2px;
	  margin-left: 6px;
	  border-radius: 3px;
	  transition: all 0.2s;
	  display: inline-flex;
	  align-items: center;
	  justify-content: center;
	  opacity: 0;
	  visibility: hidden;
	}
.inline-favorite-btn:hover {
	background: rgba(255, 193, 7, 0.2);
}

/* Show favorite button on hover of the parent item */
.prompt-radio-item:hover .inline-favorite-btn {
	opacity: 1;
	visibility: visible;
}

/* Always show favorite button if it's already favorited */
.inline-favorite-btn.favorited {
	opacity: 1;
	visibility: visible;
}

/* Ensure the item-name span can contain the button properly */
.item-name {
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
}
	.prompt-meta {
		color: #6b7280;
		font-size: 12px;
		margin-top: 4px;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
