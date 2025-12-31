// Task Manager App
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.storageKey = 'tasks_app';
        
        // DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
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
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });
        
        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.handleClearCompleted());
    }
    
    handleAddTask(e) {
        e.preventDefault();
        
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;
        
        if (!text) return;
        
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
        this.taskInput.focus();
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
            >
            <div class="task-content">
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <div class="task-meta">
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    <span class="task-date">${task.createdAt}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn delete-btn" data-id="${task.id}" title="Delete">
                    🗑️
                </button>
            </div>
        `;
        
        // Attach event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => this.handleTaskToggle(task.id));
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
