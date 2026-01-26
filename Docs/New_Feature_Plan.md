# New Feature Plan

This document outlines planned features for the Axiomancer AI chat platform. Features are marked with checkboxes: [ ] Not Done, [x] Done, [~] In Progress.
Update Date: 26-01-2026

## Features

- [ ] **Custom Theme Builder**
  - **Description**: Allow users to create and save custom themes (color pickers for all CSS variables).
  - **Why?** The modular theme system we created is perfect for this; empowers creative users.
  - **Implementation**: Expand settings with a theme editor tab, save custom themes to localStorage.

- [x] **Auto-Save Drafts**
  - **Description**: Automatically save message drafts per conversation (in localStorage or backend).
  - **Why?** Prevents loss of work if the page refreshes or crashes.
  - **Implementation**: Save on input change, restore on conversation load.

- [ ] **Usage Analytics Dashboard**
  - **Description**: A simple dashboard showing token usage, favorite models, conversation stats (e.g., "You chatted with GPT-4 50 times this month").
  - **Why?** Provides insights into usage patterns; ties into the "Performance Metrics" mentioned in AGENTS.md.
  - **Implementation**: New component, aggregate data from backend logs.

- [x] **Conversation Search**
  - **Description**: Add a search bar in the sidebar to filter conversations by title, content, or date.
  - **Why?** Essential for users with many conversations; complements the existing favorites system.
  - **Implementation**: Add search API endpoint, frontend search input with debouncing.

- [ ] **Message Regenerate Button**
  - **Description**: Allow users to regenerate the last AI response (with different parameters like model or reasoning effort).
  - **Why?** If users aren't satisfied with a response, they can easily retry.
  - **Implementation**: Add button to AI messages, call backend with modified parameters.

- [ ] **Conversation Export Options**
  - **Description**: Export conversations as Markdown, JSON, or PDF (with options to include/exclude timestamps, search context).
  - **Why?** Users might want to save or share conversations externally.
  - **Implementation**: Add export buttons to conversation menu, use libraries like jsPDF or marked.

- [~] **Sound Notifications**
  - **Description**: Toggle for subtle sound effects on message send/receive, errors, etc. (with volume slider).
  - **Why?** Enhances the chat experience without being intrusive.
  - **Implementation**: Add audio files, Web Audio API usage, settings in General tab.
  - **Status**: Settings UI implemented (toggle + volume slider), audio playback pending.

- [ ] **Keyboard Shortcuts Customization**
  - **Description**: A dedicated section in settings to view/edit keyboard shortcuts (e.g., Ctrl+K for model selector, Ctrl+Shift+F for favorites).
  - **Why?** Power users appreciate customization; aligns with "Input Behavior" section.
  - **Implementation**: Add to settings store as a JSON object, create a shortcuts editor modal.

- [x] **Conversation Folders/Categories**
  - **Description**: Allow users to create custom folders (e.g., "Work", "Personal", "Research") and drag conversations into them.
  - **Why?** The current favorites system is binary; folders would provide better organization for many conversations.
  - **Implementation**: Full folder management with database table, API endpoints, drag-and-drop UI, favorites folder section.
  - **Status**: Complete - includes folder CRUD, drag-and-drop, collapsible folders, favorites folder toggle, auto-expand settings.

- [ ] **Bulk Favorite Actions**
  - **Description**: Multi-select conversations (checkboxes) and bulk favorite/unfavorite or move to folders.
  - **Why?** Improves efficiency for users with many conversations.
  - **Implementation**: Add selection mode to Sidebar.svelte, with action buttons.

- [x] **Enhanced Search Queries**
  - **Description**: Use AI to optimize search queries by extracting key terms before web/image search.
  - **Why?** Improves search relevance by letting AI filter out filler words.
  - **Implementation**: Settings toggle with 3 modes (disabled, server default, current model).
  - **Status**: Complete - enhanceSearchMode setting with UI in Conversation Settings.
