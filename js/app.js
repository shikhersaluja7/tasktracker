// Task Manager App
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.storageKey = 'tasks_app';
        this.sharedTaskId = null;
        
        // Validation rules
        this.validationRules = {
            taskMinLength: 1,
            taskMaxLength: 200,
            emailMaxLength: 254,
            messageMaxLength: 500,
            validPriorities: ['low', 'medium', 'high']
        };
        
        // DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.taskError = document.getElementById('taskError');
        this.priorityError = document.getElementById('priorityError');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        // Share Modal Elements
        this.shareModal = document.getElementById('shareModal');
        this.closeModalBtn = document.getElementById('closeModal');
        this.shareForm = document.getElementById('shareForm');
        this.cancelShareBtn = document.getElementById('cancelShare');
        this.shareEmail = document.getElementById('shareEmail');
        this.shareMessage = document.getElementById('shareMessage');
        this.taskPreview = document.getElementById('taskPreview');
        this.emailError = document.getElementById('emailError');
        this.messageLength = document.getElementById('messageLength');
        this.srAnnouncements = document.getElementById('srAnnouncements');
        
        this.init();
    }
    
    init() {
        this.loadTasks();
        this.attachEventListeners();
        this.render();
    }
    
    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Real-time task input validation
        this.taskInput.addEventListener('blur', () => this.validateTaskInput());
        this.taskInput.addEventListener('input', () => {
            this.validateTaskInput();
        });
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });
        
        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.handleClearCompleted());
        
        // Share Modal Events
        this.closeModalBtn.addEventListener('click', () => this.closeShareModal());
        this.cancelShareBtn.addEventListener('click', () => this.closeShareModal());
        this.shareForm.addEventListener('submit', (e) => this.handleShareTask(e));
        
        // Real-time email validation
        this.shareEmail.addEventListener('blur', () => this.validateEmail());
        this.shareEmail.addEventListener('input', () => {
            this.validateEmail();
        });
        
        // Character counter for message
        this.shareMessage.addEventListener('input', () => this.updateMessageCharCount());
        
        // Close modal when clicking outside
        this.shareModal.addEventListener('click', (e) => {
            if (e.target === this.shareModal) {
                this.closeShareModal();
            }
        });
        
        // Keyboard: Escape key closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.shareModal.classList.contains('active')) {
                this.closeShareModal();
            }
        });
    }
    
    handleAddTask(e) {
        e.preventDefault();
        
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;
        
        // Validate both fields
        const taskValid = this.validateTaskInput();
        const priorityValid = this.validatePriority();
        
        if (!taskValid || !priorityValid) {
            return;
        }
        
        const task = {
            id: Date.now(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        
        // Reset form
        this.taskInput.value = '';
        this.prioritySelect.value = 'medium';
        this.taskError.textContent = '';
        this.priorityError.textContent = '';
        this.taskInput.removeAttribute('aria-invalid');
        this.taskInput.focus();
        this.announceToScreenReader(`Task added: ${text}`);
    }
    
    validateTaskInput() {
        const text = this.taskInput.value.trim();
        this.taskError.textContent = '';
        this.taskInput.removeAttribute('aria-invalid');
        
        if (!text) {
            this.taskError.textContent = 'Task description is required';
            this.taskInput.setAttribute('aria-invalid', 'true');
            return false;
        }
        
        if (text.length < this.validationRules.taskMinLength) {
            this.taskError.textContent = `Task must be at least ${this.validationRules.taskMinLength} character`;
            this.taskInput.setAttribute('aria-invalid', 'true');
            return false;
        }
        
        if (text.length > this.validationRules.taskMaxLength) {
            this.taskError.textContent = `Task must not exceed ${this.validationRules.taskMaxLength} characters`;
            this.taskInput.setAttribute('aria-invalid', 'true');
            return false;
        }
        
        this.taskInput.setAttribute('aria-invalid', 'false');
        return true;
    }
    
    validatePriority() {
        const priority = this.prioritySelect.value;
        this.priorityError.textContent = '';
        
        if (!this.validationRules.validPriorities.includes(priority)) {
            this.priorityError.textContent = 'Please select a valid priority level';
            return false;
        }
        
        return true;
    }
    
    handleFilterChange(e) {
        const filter = e.target.dataset.filter;
        this.currentFilter = filter;
        
        // Update active button
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        this.render();
    }
    
    handleTaskToggle(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }
    
    handleTaskDelete(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }
    
    openShareModal(taskId) {
        this.sharedTaskId = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            // Reset form
            this.shareEmail.value = '';
            this.shareMessage.value = '';
            this.emailError.textContent = '';
            this.messageLength.textContent = '0';
            this.shareEmail.removeAttribute('aria-invalid');
            
            // Show task preview
            this.taskPreview.innerHTML = `
                <div class="preview-label">Task:</div>
                <div class="preview-content">
                    <p>${this.escapeHtml(task.text)}</p>
                    <small>${task.priority} priority</small>
                </div>
            `;
            
            // Show modal
            this.shareModal.classList.add('active');
            this.shareModal.setAttribute('aria-hidden', 'false');
            
            // Focus on email input
            this.shareEmail.focus();
            
            // Announce to screen readers
            this.announceToScreenReader(`Share task dialog opened. Task: ${task.text}`);
        }
    }
    
    closeShareModal() {
        this.shareModal.classList.remove('active');
        this.shareModal.setAttribute('aria-hidden', 'true');
        this.sharedTaskId = null;
        this.shareEmail.value = '';
        this.shareMessage.value = '';
        this.emailError.textContent = '';
        this.messageLength.textContent = '0';
        this.shareEmail.removeAttribute('aria-invalid');
        this.announceToScreenReader('Share task dialog closed');
    }
    
    validateEmailFormat(email) {
        // RFC 5322 simplified email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validateEmail() {
        const email = this.shareEmail.value.trim();
        this.emailError.textContent = '';
        this.shareEmail.removeAttribute('aria-invalid');
        
        // If email is empty, show required error
        if (!email) {
            this.emailError.textContent = 'Email address is required';
            this.shareEmail.setAttribute('aria-invalid', 'true');
            return false;
        }
        
        // Check length
        if (email.length > this.validationRules.emailMaxLength) {
            this.emailError.textContent = `Email must not exceed ${this.validationRules.emailMaxLength} characters`;
            this.shareEmail.setAttribute('aria-invalid', 'true');
            return false;
        }
        
        // Check format
        if (!this.validateEmailFormat(email)) {
            this.emailError.textContent = 'Please enter a valid email address (e.g., user@example.com)';
            this.shareEmail.setAttribute('aria-invalid', 'true');
            return false;
        }
        
        this.shareEmail.setAttribute('aria-invalid', 'false');
        return true;
    }
    
    validateMessage() {
        const message = this.shareMessage.value.trim();
        
        if (message.length > this.validationRules.messageMaxLength) {
            return false;
        }
        
        return true;
    }
    
    updateMessageCharCount() {
        const message = this.shareMessage.value;
        this.messageLength.textContent = message.length;
        
        // Show warning at 80% capacity
        if (message.length >= this.validationRules.messageMaxLength * 0.8) {
            this.messageLength.parentElement.classList.add('near-limit');
        } else {
            this.messageLength.parentElement.classList.remove('near-limit');
        }
    }
    
    handleShareTask(e) {
        e.preventDefault();
        
        const email = this.shareEmail.value.trim();
        const message = this.shareMessage.value.trim();
        
        // Clear previous errors
        this.emailError.textContent = '';
        
        // Validate email
        if (!this.validateEmail()) {
            this.shareEmail.focus();
            return;
        }
        
        // Validate message length
        if (!this.validateMessage()) {
            this.emailError.textContent = `Message must not exceed ${this.validationRules.messageMaxLength} characters`;
            return;
        }
        
        const task = this.tasks.find(t => t.id === this.sharedTaskId);
        if (!task) return;
        
        // Create email subject and body
        const subject = `Check out this task: ${task.text.substring(0, 50)}`;
        const body = this.generateEmailBody(task, message);
        
        // Create mailto link
        const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Announce success
        this.announceToScreenReader(`Email to ${email} is being prepared`);
        
        // Show success message
        setTimeout(() => {
            this.announceToScreenReader('Share dialog closed. Task shared successfully.');
            this.closeShareModal();
        }, 100);
    }
    
    generateEmailBody(task, personalMessage) {
        let body = 'I wanted to share this task with you:\n\n';
        body += `Task: ${task.text}\n`;
        body += `Priority: ${task.priority}\n`;
        body += `Created: ${task.createdAt}\n`;
        
        if (personalMessage) {
            body += `\nMessage from sender:\n${personalMessage}\n`;
        }
        
        body += '\n---\n';
        body += 'Shared from Task Manager';
        
        return body;
    }
    
    announceToScreenReader(message) {
        this.srAnnouncements.textContent = message;
        // Clear after announcement
        setTimeout(() => {
            this.srAnnouncements.textContent = '';
        }, 3000);
    }
    
    handleClearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }
    
    saveTasks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }
    
    loadTasks() {
        const stored = localStorage.getItem(this.storageKey);
        this.tasks = stored ? JSON.parse(stored) : [];
    }
    
    render() {
        const filtered = this.getFilteredTasks();
        
        // Update task count
        const activeTasks = this.tasks.filter(t => !t.completed).length;
        this.taskCount.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'}`;
        
        // Clear list
        this.taskList.innerHTML = '';
        
        // Show/hide empty state
        if (filtered.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        } else {
            this.emptyState.style.display = 'none';
        }
        
        // Render tasks
        filtered.forEach(task => {
            const taskItem = this.createTaskElement(task);
            this.taskList.appendChild(taskItem);
        });
        
        // Update clear completed button state
        const hasCompleted = this.tasks.some(t => t.completed);
        this.clearCompletedBtn.disabled = !hasCompleted;
    }
    
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                data-id="${task.id}"
                aria-label="Toggle completion status for task: ${this.escapeHtml(task.text)}"
            >
            <div class="task-content">
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <div class="task-meta">
                    <span class="priority-badge ${task.priority}" aria-label="Priority: ${task.priority}">${task.priority}</span>
                    <span class="task-date">${task.createdAt}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn share-btn" data-id="${task.id}" aria-label="Share task: ${this.escapeHtml(task.text)}">
                    📧
                </button>
                <button class="task-btn delete-btn" data-id="${task.id}" aria-label="Delete task: ${this.escapeHtml(task.text)}">
                    🗑️
                </button>
            </div>
        `;
        
        // Attach event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const shareBtn = li.querySelector('.share-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => this.handleTaskToggle(task.id));
        shareBtn.addEventListener('click', () => this.openShareModal(task.id));
        deleteBtn.addEventListener('click', () => this.handleTaskDelete(task.id));
        
        return li;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
