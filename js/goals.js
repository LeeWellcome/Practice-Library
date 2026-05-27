/**
 * ==========================================================================
 * GOALS MANAGEMENT ENGINE - LifeNavigator 365
 * Handles Goal CRUD, milestone checkbox rendering, today's focus,
 * and high-fidelity Canvas Confetti achievements.
 * ==========================================================================
 */

const GoalsManager = {
    activeFilter: 'all',
    searchQuery: '',
    milestoneInputCount: 0,

    init() {
        this.bindEvents();
        this.renderGoals();
    },

    bindEvents() {
        // Category Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.getAttribute('data-filter');
                this.renderGoals();
            });
        });

        // Search goals
        const searchInput = document.getElementById('search-goals');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderGoals();
            });
        }

        // Add milestone input inside form
        const addMsInputBtn = document.getElementById('btn-add-milestone-input');
        if (addMsInputBtn) {
            addMsInputBtn.addEventListener('click', () => {
                this.addMilestoneInputField('', false);
            });
        }

        // Handle Add Goal button click
        const btnAddGoal = document.getElementById('btn-add-goal');
        if (btnAddGoal) {
            btnAddGoal.addEventListener('click', () => {
                this.openGoalModal();
            });
        }

        // Form Submit
        const goalForm = document.getElementById('goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGoalFromForm();
            });
        }

        // Modal Cancel buttons
        const btnCancelGoalModal = document.getElementById('btn-cancel-goal-modal');
        if (btnCancelGoalModal) {
            btnCancelGoalModal.addEventListener('click', () => this.closeGoalModal());
        }
        const btnCloseGoalModal = document.getElementById('btn-close-goal-modal');
        if (btnCloseGoalModal) {
            btnCloseGoalModal.addEventListener('click', () => this.closeGoalModal());
        }
    },

    // ================= GOALS RENDERING & LOGIC =================

    renderGoals() {
        const goals = StorageEngine.getGoals();
        const goalsGrid = document.getElementById('goals-grid');
        if (!goalsGrid) return;

        // Filter and Search
        let filteredGoals = goals.filter(goal => {
            const matchesFilter = this.activeFilter === 'all' || goal.category === this.activeFilter;
            const matchesSearch = goal.title.toLowerCase().includes(this.searchQuery);
            return matchesFilter && matchesSearch;
        });

        // Sort by priority (high > medium > low), then by month
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        filteredGoals.sort((a, b) => {
            if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            return parseInt(a.month) - parseInt(b.month);
        });

        if (filteredGoals.length === 0) {
            goalsGrid.innerHTML = `
                <div class="empty-state glass" style="grid-column: span 2;">
                    <i data-lucide="compass"></i>
                    <p>没有找到相关目标。点击右上方“新建年度目标”开始规划吧！</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        goalsGrid.innerHTML = filteredGoals.map(goal => {
            const totalMs = goal.milestones.length;
            const completedMs = goal.milestones.filter(m => m.completed).length;
            const progressPercent = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : (goal.status === 'done' ? 100 : 0);
            
            // Build Priority Badge text
            const priorityText = { high: '🔥 高优先级', medium: '⚡ 中优先级', low: '🌱 低优先级' }[goal.priority];
            const isDone = progressPercent === 100 || goal.status === 'done';

            return `
                <div class="goal-card glass glass-hover ${goal.category} ${isDone ? 'done-state' : ''}" id="goal-card-${goal.id}">
                    <div class="goal-card-top">
                        <div class="goal-badge-row">
                            <span class="goal-badge badge-priority-${goal.priority}">${priorityText}</span>
                            <span class="goal-badge badge-month">${goal.month}月达成</span>
                        </div>
                        <div class="goal-actions">
                            <button class="btn-card-action" onclick="GoalsManager.toggleFocus('${goal.id}')" title="${goal.focus ? '取消聚焦' : '标记为今日聚焦'}">
                                <i data-lucide="star" style="${goal.focus ? 'fill: var(--color-accent); color: var(--color-accent);' : ''}"></i>
                            </button>
                            <button class="btn-card-action" onclick="GoalsManager.openGoalModal('${goal.id}')" title="编辑目标">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-card-action action-delete" onclick="GoalsManager.deleteGoal('${goal.id}')" title="删除目标">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>

                    <h4 class="goal-title" onclick="GoalsManager.openGoalModal('${goal.id}')">${goal.title}</h4>

                    <div class="goal-progress-section">
                        <div class="goal-progress-header">
                            <span>里程碑达成进度</span>
                            <span>${completedMs}/${totalMs} (${progressPercent}%)</span>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                    </div>

                    ${totalMs > 0 ? `
                        <div class="goal-milestones-list">
                            ${goal.milestones.map(ms => `
                                <div class="milestone-item ${ms.completed ? 'completed' : ''}">
                                    <div class="milestone-checkbox" onclick="GoalsManager.toggleMilestone('${goal.id}', '${ms.id}')">
                                        <i data-lucide="check"></i>
                                    </div>
                                    <span class="milestone-text" title="${ms.text}">${ms.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        lucide.createIcons();
        
        // 渲染联动：如果有其他模块在监听数据，可以触发 app.js 的刷新
        if (typeof app !== 'undefined' && app.refreshDashboard) {
            app.refreshDashboard();
        }
    },

    // ================= ACTIONS =================

    toggleMilestone(goalId, milestoneId) {
        const goals = StorageEngine.getGoals();
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return;

        const milestone = goals[goalIndex].milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        // Toggle completed state
        milestone.completed = !milestone.completed;

        // Recalculate main goal status if all milestones completed
        const totalMs = goals[goalIndex].milestones.length;
        const completedMs = goals[goalIndex].milestones.filter(m => m.completed).length;
        
        const previousPercent = Math.round(((completedMs + (milestone.completed ? -1 : 1)) / totalMs) * 100);
        
        if (completedMs === totalMs) {
            goals[goalIndex].status = 'done';
            // 达成 100% 触发彩色纸屑礼花特效！
            this.triggerCelebration();
        } else if (completedMs > 0) {
            goals[goalIndex].status = 'doing';
        } else {
            goals[goalIndex].status = 'todo';
        }

        StorageEngine.saveGoals(goals);
        this.renderGoals();
    },

    toggleFocus(goalId) {
        const goals = StorageEngine.getGoals();
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return;

        goals[goalIndex].focus = !goals[goalIndex].focus;
        StorageEngine.saveGoals(goals);
        this.renderGoals();
    },

    deleteGoal(goalId) {
        if (confirm("确定要删除这个年度目标吗？该操作不可撤销。")) {
            let goals = StorageEngine.getGoals();
            goals = goals.filter(g => g.id !== goalId);
            StorageEngine.saveGoals(goals);
            this.renderGoals();
        }
    },

    // ================= ADD/EDIT GOAL MODAL =================

    openGoalModal(goalId = null) {
        const modal = document.getElementById('goal-overlay') || document.getElementById('goal-modal');
        const form = document.getElementById('goal-form');
        const titleInput = document.getElementById('goal-title');
        const categoryInput = document.getElementById('goal-category');
        const priorityInput = document.getElementById('goal-priority');
        const monthInput = document.getElementById('goal-month');
        const statusInput = document.getElementById('goal-status');
        const focusInput = document.getElementById('goal-focus');
        const modalTitle = document.getElementById('goal-modal-title');
        const msContainer = document.getElementById('milestones-input-container');

        if (!modal || !form) return;

        // Clear previous milestones inputs
        msContainer.innerHTML = '';
        this.milestoneInputCount = 0;
        form.reset();

        if (goalId) {
            // Edit mode
            modalTitle.innerText = "编辑年度目标";
            const goals = StorageEngine.getGoals();
            const goal = goals.find(g => g.id === goalId);
            if (!goal) return;

            document.getElementById('goal-id').value = goal.id;
            titleInput.value = goal.title;
            categoryInput.value = goal.category;
            priorityInput.value = goal.priority;
            monthInput.value = goal.month;
            statusInput.value = goal.status;
            focusInput.checked = !!goal.focus;

            // Load milestones to editor
            goal.milestones.forEach(ms => {
                this.addMilestoneInputField(ms.text, ms.completed, ms.id);
            });
        } else {
            // Create mode
            modalTitle.innerText = "新建年度目标";
            document.getElementById('goal-id').value = '';
            // Add two empty milestone rows by default for helper
            this.addMilestoneInputField('', false);
            this.addMilestoneInputField('', false);
        }

        modal.classList.add('active');
        lucide.createIcons();
    },

    closeGoalModal() {
        const modal = document.getElementById('goal-overlay') || document.getElementById('goal-modal');
        if (modal) modal.classList.remove('active');
    },

    addMilestoneInputField(text = '', completed = false, id = null) {
        const msContainer = document.getElementById('milestones-input-container');
        if (!msContainer) return;

        this.milestoneInputCount++;
        const uniqueId = id || `ms-input-${Date.now()}-${this.milestoneInputCount}`;
        
        const row = document.createElement('div');
        row.className = 'milestone-input-row';
        row.id = `ms-row-${uniqueId}`;
        row.innerHTML = `
            <input type="text" class="milestone-text-input" data-id="${uniqueId}" data-completed="${completed}" value="${text}" placeholder="子任务 / 里程碑 ${this.milestoneInputCount}">
            <button type="button" class="btn-card-action action-delete" onclick="GoalsManager.removeMilestoneInputField('${uniqueId}')">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        msContainer.appendChild(row);
        lucide.createIcons();

        // Auto scroll to bottom of inputs
        msContainer.scrollTop = msContainer.scrollHeight;
    },

    removeMilestoneInputField(id) {
        const row = document.getElementById(`ms-row-${id}`);
        if (row) row.remove();
    },

    saveGoalFromForm() {
        const goals = StorageEngine.getGoals();
        const goalId = document.getElementById('goal-id').value;
        const title = document.getElementById('goal-title').value.trim();
        const category = document.getElementById('goal-category').value;
        const priority = document.getElementById('goal-priority').value;
        const month = document.getElementById('goal-month').value;
        const status = document.getElementById('goal-status').value;
        const focus = document.getElementById('goal-focus').checked;

        // Assemble milestones from inputs
        const msRows = document.querySelectorAll('.milestone-input-row');
        const milestones = [];
        msRows.forEach(row => {
            const input = row.querySelector('.milestone-text-input');
            const val = input.value.trim();
            if (val) {
                milestones.push({
                    id: input.getAttribute('data-id'),
                    text: val,
                    completed: input.getAttribute('data-completed') === 'true'
                });
            }
        });

        // Determine main status based on milestones
        let actualStatus = status;
        if (milestones.length > 0) {
            const completedCount = milestones.filter(m => m.completed).length;
            if (completedCount === milestones.length) {
                actualStatus = 'done';
            } else if (completedCount > 0) {
                actualStatus = 'doing';
            } else {
                actualStatus = 'todo';
            }
        }

        if (goalId) {
            // Update Goal
            const idx = goals.findIndex(g => g.id === goalId);
            if (idx !== -1) {
                goals[idx] = {
                    id: goalId,
                    title,
                    category,
                    priority,
                    month,
                    status: actualStatus,
                    focus,
                    milestones
                };
            }
        } else {
            // Create New Goal
            const newGoal = {
                id: `goal-${Date.now()}`,
                title,
                category,
                priority,
                month,
                status: actualStatus,
                focus,
                milestones
            };
            goals.push(newGoal);
        }

        StorageEngine.saveGoals(goals);
        this.closeGoalModal();
        this.renderGoals();

        // If goal reaches 100% completion on edit, trigger confetti
        if (actualStatus === 'done' && (!goalId || goals.find(g => g.id === goalId)?.status !== 'done')) {
            this.triggerCelebration();
        }
    },

    // ================= CANVAS CONFETTI CELEBRATION EFFECT =================

    triggerCelebration() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Match screen bounds
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        canvas.style.opacity = '1';
        canvas.style.pointerEvents = 'auto'; // allow visual block temporarily if needed, but we keep it click-through mostly
        
        const colors = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
        const particles = [];
        
        // Spawn particles
        const particleCount = 120;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 50,
                y: canvas.height + 20,
                vx: (Math.random() - 0.5) * 15,
                vy: -Math.random() * 20 - 10,
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }
        
        let frameId;
        const gravity = 0.5;
        const friction = 0.98;
        
        const updateConfetti = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let activeParticles = 0;
            
            particles.forEach(p => {
                if (p.opacity <= 0) return;
                
                // physics
                p.vx *= friction;
                p.vy += gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                
                // fade out when falling below screen
                if (p.y > canvas.height / 2) {
                    p.opacity -= 0.01;
                }
                
                if (p.opacity > 0) {
                    activeParticles++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.opacity;
                    
                    // Draw random rectangles or circles
                    if (Math.random() > 0.5) {
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            });
            
            if (activeParticles > 0) {
                frameId = requestAnimationFrame(updateConfetti);
            } else {
                canvas.style.opacity = '0';
                canvas.style.pointerEvents = 'none';
                cancelAnimationFrame(frameId);
            }
        };
        
        updateConfetti();
    }
};
