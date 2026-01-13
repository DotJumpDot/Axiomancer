<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { promptStore, authStore } from "@/Store";

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

						{#each promptStore.profiles as profile (profile.id)}
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
										<span class="item-name">{profile.name}</span>
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
	@import './ChatHeader.popup.css';

	.prompt-edit-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.prompt-meta {
		color: #6b7280;
		font-size: 12px;
		margin-top: 4px;
	}
</style>
