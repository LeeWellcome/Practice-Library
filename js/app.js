/**
 * ==========================================================================
 * MASTER COORDINATOR - LifeNavigator 365
 * Connects Storage, Charts, Goals, Habits, and general Page state/animations.
 * ==========================================================================
 */

const app = {
    currentTab: 'dashboard',

    // 精美精选的禅意与平静语录库，每日更新
    quotes: [
        { text: "“致虚极，守静笃。万物并作，吾以观复。”", author: "《道德经》" },
        { text: "“流水不争先，争的是滔滔不绝。顺应自然，静待花开。”", author: "禅宗谚语" },
        { text: "“极简是灵魂的奢侈。专注于少数重要的事情，便能看清人生的本原。”", author: "庄子心学" },
        { text: "“万物作而弗始，生而弗有，为而弗恃，功成而弗居。”", author: "《道德经》" },
        { text: "“知足者富，强行者有志。日拱一卒，功不唐捐。”", author: "《老子》" },
        { text: "“慢即是快。静水流深，踏实走好脚下的这一步，当下便是圆满。”", author: " Stoic 哲学" },
        { text: "“心若无尘，风浪亦是风景。今日专注一事，便足矣。”", author: "禅宗" },
        { text: "“大道至简。真正的成长，是做生活的减法，而非加法。”", author: "《庄子》" },
        { text: "“风来疏竹，风过而竹不留声；雁渡寒潭，雁去而潭不留影。”", author: "《菜根谭》" },
        { text: "“虚室生白，吉祥止止。心宽境自幽，事繁意自闲。”", author: "《庄子》" }
    ],

    init() {
        // 1. 初始化底层本地数据
        StorageEngine.init();
        
        // 2. 初始化核心子组件
        ChartEngine.init('balance-wheel-canvas');
        GoalsManager.init();
        HabitsTracker.init();

        // 3. 初始化全局事件绑定与生命周期
        this.bindGlobalEvents();
        this.updateYearProgress();
        this.refreshDashboard();
        this.renderRoadmap();
        
        // Render current date
        const dateEl = document.getElementById('current-date-text');
        if (dateEl) {
            const today = new Date();
            dateEl.innerText = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
        }
    },

    bindGlobalEvents() {
        // Tab Navigation click handlers
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Backup Modal Control
        const btnBackup = document.getElementById('btn-backup');
        const backupModal = document.getElementById('backup-modal');
        const btnCloseBackup = document.getElementById('btn-close-backup-modal');
        
        if (btnBackup && backupModal) {
            btnBackup.addEventListener('click', () => backupModal.classList.add('active'));
        }
        if (btnCloseBackup && backupModal) {
            btnCloseBackup.addEventListener('click', () => backupModal.classList.remove('active'));
        }

        // Export data
        const btnExport = document.getElementById('btn-export-data');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                StorageEngine.exportAllData();
            });
        }

        // Import data
        const fileImport = document.getElementById('file-import-data');
        if (fileImport) {
            fileImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                StorageEngine.importAllData(file, (success, msg) => {
                    alert(msg);
                    if (success) {
                        if (backupModal) backupModal.classList.remove('active');
                        this.fullRefreshUI();
                    }
                });
            });
        }

        // Reset data
        const btnReset = document.getElementById('btn-reset-data');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm("⚠️ 警告：这将清除您录入的所有目标和习惯数据，恢复至最干净的全新状态。是否确认清空？")) {
                    StorageEngine.resetAllData();
                    if (backupModal) backupModal.classList.remove('active');
                    this.fullRefreshUI();
                }
            });
        }
    },

    // ================= TAB ROUTING & CONTROLS =================

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update navigation buttons
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Show/Hide page tab panes
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
            if (pane.id === `tab-${tabName}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Update Title and dynamic content triggers
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');

        if (tabName === 'dashboard') {
            headerTitle.innerText = "静心居";
            headerSubtitle.innerText = "致虚极，守静笃。静水流深，当下即是全部。";
            this.refreshDashboard();
        } else if (tabName === 'goals') {
            headerTitle.innerText = "素履往";
            headerSubtitle.innerText = "素履之往，独行愿也。化繁为简，笃行致远。";
            GoalsManager.renderGoals();
        } else if (tabName === 'roadmap') {
            headerTitle.innerText = "光阴轴";
            headerSubtitle.innerText = "观日月流转，察四时更替。静待花开，顺其自然。";
            this.renderRoadmap();
        } else if (tabName === 'habits') {
            headerTitle.innerText = "日常修";
            headerSubtitle.innerText = "日拱一卒，日日不断。微澜积水，终成巨浪。";
            HabitsTracker.renderHabits();
            HabitsTracker.renderHeatmap();
        }
    },

    // ================= LIVE YEAR PROGRESS & COUNTDOWN =================

    updateYearProgress() {
        const progressBar = document.getElementById('year-progress-bar');
        const percentText = document.getElementById('year-percent-text');
        const countdownText = document.getElementById('days-countdown-text');
        
        if (!progressBar) return;

        const now = new Date();
        const year = now.getFullYear();
        
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);
        
        const totalMs = endOfYear - startOfYear;
        const passedMs = now - startOfYear;
        
        // Calculate dynamic precision percentage
        const progressRatio = passedMs / totalMs;
        const progressPercent = (progressRatio * 100).toFixed(4); // 4 decimals for dynamic clock ticker feel!
        
        progressBar.style.width = `${progressRatio * 100}%`;
        percentText.innerText = `${progressPercent}%`;

        // Days remaining
        const diffMs = endOfYear - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        countdownText.innerHTML = `<i data-lucide="hourglass" style="display:inline-block;width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i> ${year}年余 <span class="text-accent" style="font-weight:700;">${diffDays}</span> 日，心平气和，徐徐图之。`;
        lucide.createIcons();

        // High frequency updates (every 5 seconds) to make the dynamic ticker feel responsive
        setTimeout(() => this.updateYearProgress(), 5000);
    },

    // ================= DASHBOARD UI REFRESH =================

    refreshDashboard() {
        const goals = StorageEngine.getGoals();
        const habits = StorageEngine.getHabits();
        const history = StorageEngine.getHabitHistory();

        // 1. Calculate ratios for Work, Study, Life categories
        const categories = { work: { total: 0, done: 0 }, study: { total: 0, done: 0 }, life: { total: 0, done: 0 } };
        
        goals.forEach(goal => {
            if (categories[goal.category] !== undefined) {
                categories[goal.category].total++;
                if (goal.status === 'done') {
                    categories[goal.category].done++;
                }
            }
        });

        // Calculate and render progress bars for stats grid
        const rates = {};
        for (const cat in categories) {
            const data = categories[cat];
            const rate = data.total > 0 ? (data.done / data.total) : 0;
            rates[cat] = rate;

            // Render stats grid HTML elements
            const statProgressText = document.getElementById(`stat-${cat}-progress`);
            const statProgressBar = document.getElementById(`progress-bar-${cat}`);
            
            if (statProgressText) {
                statProgressText.innerText = `${data.done}/${data.total} 达成`;
            }
            if (statProgressBar) {
                statProgressBar.style.width = `${rate * 100}%`;
            }
        }

        // 2. Draw radar wheel using Canvas with computed ratios
        ChartEngine.drawBalanceWheel(rates, true);

        // 3. Render Today's Star Focus List
        const focusList = document.getElementById('dashboard-focus-list');
        if (focusList) {
            const starredGoals = goals.filter(g => g.focus);
            if (starredGoals.length === 0) {
                focusList.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="check-square"></i>
                        <p style="font-size:0.8rem;color:var(--text-secondary);">今日没有设置星标核心目标。去“目标领航员”中把重点目标标星吧！</p>
                    </div>
                `;
            } else {
                focusList.innerHTML = starredGoals.map(goal => {
                    const total = goal.milestones.length;
                    const done = goal.milestones.filter(m => m.completed).length;
                    const isFullyDone = goal.status === 'done';

                    return `
                        <div class="focus-item item-${goal.category} ${isFullyDone ? 'completed' : ''}">
                            <div class="focus-item-left">
                                <div class="custom-checkbox" onclick="app.fastToggleGoalStatus('${goal.id}')">
                                    <i data-lucide="check"></i>
                                </div>
                                <div class="focus-item-text" onclick="GoalsManager.openGoalModal('${goal.id}')" style="cursor:pointer;">
                                    ${goal.title}
                                </div>
                            </div>
                            <span class="focus-item-tag tag-${goal.category}">${done}/${total} 子任务</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // 4. Render Habits Quick Overview list
        const quickHabitList = document.getElementById('dashboard-habit-quick-list');
        if (quickHabitList) {
            if (habits.length === 0) {
                quickHabitList.innerHTML = `
                    <div class="empty-state" style="padding: 1rem 0;">
                        <i data-lucide="flame"></i>
                        <p style="font-size:0.8rem;color:var(--text-secondary);">没有日常习惯。快去添加你的第一个微习惯吧！</p>
                    </div>
                `;
            } else {
                // Show first 4 habits with streak
                quickHabitList.innerHTML = habits.slice(0, 4).map(habit => {
                    const stats = HabitsTracker.calculateStreaks(habit.id, history);
                    
                    return `
                        <div class="habit-quick-item">
                            <div class="habit-quick-info">
                                <span class="habit-quick-icon bg-${habit.category}"></span>
                                <span class="habit-quick-name">${habit.name}</span>
                            </div>
                            <div class="habit-quick-streak">
                                <i data-lucide="flame"></i>
                                <span>${stats.current}天</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 5. Render Quote of the day
        const quoteTextEl = document.getElementById('quote-text');
        const quoteAuthorEl = document.getElementById('quote-author');
        if (quoteTextEl && quoteAuthorEl) {
            const dayOfMonth = new Date().getDate();
            const quoteIndex = dayOfMonth % this.quotes.length;
            const quote = this.quotes[quoteIndex];
            
            quoteTextEl.innerText = quote.text;
            quoteAuthorEl.innerText = `—— ${quote.author}`;
        }

        lucide.createIcons();
    },

    // 仪表盘快捷通道：点击左侧圈圈直接把该核心目标的全部里程碑设为已完成/未完成
    fastToggleGoalStatus(goalId) {
        const goals = StorageEngine.getGoals();
        const idx = goals.findIndex(g => g.id === goalId);
        if (idx === -1) return;

        const currentStatus = goals[idx].status;
        const targetStatus = currentStatus === 'done' ? 'todo' : 'done';
        const targetCompleted = targetStatus === 'done';

        goals[idx].status = targetStatus;
        goals[idx].milestones.forEach(m => m.completed = targetCompleted);

        StorageEngine.saveGoals(goals);
        this.refreshDashboard();
        
        // Visual feed in case of 100% completion
        if (targetCompleted && typeof GoalsManager !== 'undefined' && GoalsManager.triggerCelebration) {
            GoalsManager.triggerCelebration();
        }
    },

    // ================= ROADMAP VIEW RENDERER =================

    renderRoadmap() {
        const timeline = document.getElementById('roadmap-timeline-container');
        if (!timeline) return;

        const goals = StorageEngine.getGoals();
        
        // Quarters & months layout mapping
        const quarters = [
            { name: "Q1 第一季度", months: [1, 2, 3] },
            { name: "Q2 第二季度", months: [4, 5, 6] },
            { name: "Q3 第三季度", months: [7, 8, 9] },
            { name: "Q4 第四季度", months: [10, 11, 12] }
        ];

        let totalGoalsCount = goals.length;
        let completedGoalsCount = goals.filter(g => g.status === 'done').length;

        // Render roadmap stats
        const rTotal = document.getElementById('roadmap-total-goals');
        const rCompleted = document.getElementById('roadmap-completed-goals');
        if (rTotal) rTotal.innerText = totalGoalsCount;
        if (rCompleted) rCompleted.innerText = completedGoalsCount;

        timeline.innerHTML = quarters.map(q => {
            return `
                <div class="quarter-group">
                    <h4 class="quarter-title">${q.name}</h4>
                    ${q.months.map(m => {
                        // Filter goals due in this month
                        const monthGoals = goals.filter(g => parseInt(g.month) === m);
                        
                        return `
                            <div class="roadmap-month-card glass">
                                <div class="month-header">
                                    <span class="month-name">${m}月</span>
                                    <span class="month-count">${monthGoals.length} 目标</span>
                                </div>
                                <div class="roadmap-goals-list">
                                    ${monthGoals.length === 0 ? `
                                        <div style="font-size:0.75rem;color:var(--text-muted);font-style:italic;padding-top:0.5rem;text-align:center;">暂无规划</div>
                                    ` : monthGoals.map(g => {
                                        const isDone = g.status === 'done';
                                        return `
                                            <div class="roadmap-goal-tag t-${g.category} ${isDone ? 't-done' : ''}" 
                                                 onclick="GoalsManager.openGoalModal('${g.id}')" 
                                                 title="${g.title} (${isDone ? '已完成' : '进行中'})">
                                                ${g.title}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }).join('');

        lucide.createIcons();
    },

    // 全局重置导入刷新触发器
    fullRefreshUI() {
        this.updateYearProgress();
        this.switchTab(this.currentTab);
        if (this.currentTab === 'dashboard') {
            this.refreshDashboard();
        } else if (this.currentTab === 'goals') {
            GoalsManager.renderGoals();
        } else if (this.currentTab === 'roadmap') {
            this.renderRoadmap();
        } else if (this.currentTab === 'habits') {
            HabitsTracker.renderHabits();
            HabitsTracker.renderHeatmap();
        }
    }
};

// Start application when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
