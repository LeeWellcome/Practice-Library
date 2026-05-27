/**
 * ==========================================================================
 * HABITS TRACKER ENGINE - LifeNavigator 365
 * Renders the GitHub-style 365-day contribution calendar grid,
 * handles daily check-ins, and calculates Streak statistics.
 * ==========================================================================
 */

const HabitsTracker = {
    init() {
        this.bindEvents();
        this.renderHabits();
        this.renderHeatmap();
    },

    bindEvents() {
        // Open Add Habit Modal
        const btnAddHabit = document.getElementById('btn-add-habit');
        if (btnAddHabit) {
            btnAddHabit.addEventListener('click', () => {
                this.openHabitModal();
            });
        }

        // Form Submit
        const habitForm = document.getElementById('habit-form');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addHabitFromForm();
            });
        }

        // Cancel Buttons
        const btnCancelHabitModal = document.getElementById('btn-cancel-habit-modal');
        if (btnCancelHabitModal) {
            btnCancelHabitModal.addEventListener('click', () => this.closeHabitModal());
        }
        const btnCloseHabitModal = document.getElementById('btn-close-habit-modal');
        if (btnCloseHabitModal) {
            btnCloseHabitModal.addEventListener('click', () => this.closeHabitModal());
        }
    },

    // ================= RENDER DETAILED HABIT CARDS =================

    renderHabits() {
        const habits = StorageEngine.getHabits();
        const container = document.getElementById('habits-list-container');
        if (!container) return;

        if (habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass" style="grid-column: span 2;">
                    <i data-lucide="flame"></i>
                    <p>尚未建立日常习惯。添加一个微小的日常习惯开始积累能量吧！</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const history = StorageEngine.getHabitHistory();
        const todayStr = StorageEngine.formatDate(new Date());
        const todayDoneList = history[todayStr] || [];

        container.innerHTML = habits.map(habit => {
            const isCheckedToday = todayDoneList.includes(habit.id);
            const stats = this.calculateStreaks(habit.id, history);
            const categoryText = { work: '工作事业', study: '自我提升', life: '美好生活' }[habit.category];

            return `
                <div class="habit-card glass glass-hover ${habit.category}" id="habit-card-${habit.id}">
                    <div class="habit-card-header">
                        <div class="habit-card-info">
                            <h4>${habit.name}</h4>
                            <p class="text-${habit.category}">${categoryText}</p>
                        </div>
                        <button class="btn-card-action action-delete" onclick="HabitsTracker.deleteHabit('${habit.id}')" title="放弃习惯">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>

                    <div class="habit-streaks">
                        <div class="streak-box streak-current">
                            <i data-lucide="flame"></i>
                            <div class="streak-value">
                                <span id="streak-curr-${habit.id}">${stats.current} 天</span>
                                <label>当前连击</label>
                            </div>
                        </div>
                        <div class="streak-box streak-best">
                            <i data-lucide="award"></i>
                            <div class="streak-value">
                                <span id="streak-best-${habit.id}">${stats.best} 天</span>
                                <label>历史最高</label>
                            </div>
                        </div>
                    </div>

                    <div class="habit-check-in-row">
                        ${isCheckedToday ? `
                            <span class="checked-badge"><i data-lucide="check-circle-2"></i> 今日能量已满</span>
                            <button class="btn-secondary btn-sm" onclick="HabitsTracker.toggleCheckIn('${habit.id}')" style="opacity: 0.6;">
                                取消打卡
                            </button>
                        ` : `
                            <span class="text-secondary" style="font-size: 0.8rem; font-weight: 500;">今日未打卡</span>
                            <button class="btn-check-in" onclick="HabitsTracker.toggleCheckIn('${habit.id}')">
                                <i data-lucide="zap"></i> 今日打卡
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();

        // 刷新首页面板关联
        if (typeof app !== 'undefined' && app.refreshDashboard) {
            app.refreshDashboard();
        }
    },

    // ================= HEATMAP RENDER SYSTEM =================

    renderHeatmap() {
        const heatmap = document.getElementById('habit-heatmap');
        const monthsContainer = document.getElementById('heatmap-months-labels');
        if (!heatmap) return;

        heatmap.innerHTML = '';
        if (monthsContainer) monthsContainer.innerHTML = '';

        const history = StorageEngine.getHabitHistory();
        const habitsCount = StorageEngine.getHabits().length;

        // 2026年是平年，有365天。
        // 2026年1月1日是星期四。
        // 为了绘制标准的 GitHub Grid (从周日开始的星期列)：
        // 我们需要计算首周的偏移量。
        const year = 2026;
        const startDate = new Date(year, 0, 1);
        const startDayOfWeek = startDate.getDay(); // 4 (星期四)

        // 绘制前置空白像素单元 (让1月1日落在周四)
        for (let i = 0; i < startDayOfWeek; i++) {
            const blank = document.createElement('div');
            blank.className = 'pixel';
            blank.style.visibility = 'hidden';
            heatmap.appendChild(blank);
        }

        const totalDays = 365;
        const monthOffsets = [];
        let currentMonth = -1;

        // 循环绘制 365 天
        for (let day = 0; day < totalDays; day++) {
            const targetDate = new Date(year, 0, 1 + day);
            const dateStr = StorageEngine.formatDate(targetDate);
            const doneHabits = history[dateStr] || [];
            
            // 记下每个月份的第一天在网格列中的近似比例
            const m = targetDate.getMonth();
            if (m !== currentMonth) {
                currentMonth = m;
                monthOffsets.push({
                    name: `${m + 1}月`,
                    dayIndex: day + startDayOfWeek
                });
            }

            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            
            // 计算着色等级 (按打卡完成的比例)
            let level = 0;
            if (doneHabits.length > 0 && habitsCount > 0) {
                const ratio = doneHabits.length / habitsCount;
                if (ratio <= 0.34) level = 1;
                else if (ratio <= 0.74) level = 2;
                else level = 3;
            }
            
            pixel.classList.add(`lvl-${level}`);
            
            // 填充悬浮提示词
            const dateLabel = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
            const countLabel = doneHabits.length > 0 ? `打卡数: ${doneHabits.length}/${habitsCount}` : '未打卡';
            pixel.setAttribute('data-tooltip', `${dateLabel} | ${countLabel}`);
            
            // 支持点击格子打卡历史（非常极客的高阶功能！）
            pixel.addEventListener('click', () => {
                this.toggleHistoryCheckIn(dateStr);
            });

            heatmap.appendChild(pixel);
        }

        // 渲染月份标签，使其与下方的列大致对齐
        if (monthsContainer) {
            // 每列有 7 个格子，因此可以通过列索引来定位月份的水平跨度
            const totalCols = Math.ceil((totalDays + startDayOfWeek) / 7);
            const columns = Array.from({ length: totalCols }, () => []);
            
            // 生成 12 个月份标题
            const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            monthsContainer.innerHTML = months.map(mName => `<span>${mName}</span>`).join('');
        }
    },

    // ================= STREAKS ALGORITHM (连击算法) =================

    calculateStreaks(habitId, history) {
        const today = new Date();
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        // 我们需要按时间线向前扫描
        // 为了方便，我们扫描 2026 全年（从 1月1日 到今天）
        const year = 2026;
        const start = new Date(year, 0, 1);
        const dayDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        
        // 1. 计算历史最高连击 (Best Streak)
        for (let i = 0; i <= dayDiff; i++) {
            const checkDate = new Date(year, 0, 1 + i);
            const dateStr = StorageEngine.formatDate(checkDate);
            const completed = history[dateStr] && history[dateStr].includes(habitId);
            
            if (completed) {
                tempStreak++;
                if (tempStreak > bestStreak) bestStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        }
        
        // 2. 计算当前连击 (Current Streak)
        // 从今天（或昨天，如果今天还没打卡）向后回溯
        let checkDate = new Date();
        let dateStr = StorageEngine.formatDate(checkDate);
        let completedToday = history[dateStr] && history[dateStr].includes(habitId);
        
        if (completedToday) {
            currentStreak = 1;
            // 继续向前回溯昨天、前天
            let backtrack = 1;
            while (true) {
                const prevDate = new Date();
                prevDate.setDate(today.getDate() - backtrack);
                const prevStr = StorageEngine.formatDate(prevDate);
                
                if (history[prevStr] && history[prevStr].includes(habitId)) {
                    currentStreak++;
                    backtrack++;
                } else {
                    break;
                }
            }
        } else {
            // 如果今天没打卡，看昨天是否打卡，如果打卡了，连击依然存活
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const yestStr = StorageEngine.formatDate(yesterday);
            
            if (history[yestStr] && history[yestStr].includes(habitId)) {
                currentStreak = 1;
                let backtrack = 2;
                while (true) {
                    const prevDate = new Date();
                    prevDate.setDate(today.getDate() - backtrack);
                    const prevStr = StorageEngine.formatDate(prevDate);
                    
                    if (history[prevStr] && history[prevStr].includes(habitId)) {
                        currentStreak++;
                        backtrack++;
                    } else {
                        break;
                    }
                }
            } else {
                currentStreak = 0;
            }
        }

        // 容错：历史最高不应小于当前连击
        if (currentStreak > bestStreak) bestStreak = currentStreak;

        return { current: currentStreak, best: bestStreak };
    },

    // ================= ACTIONS =================

    toggleCheckIn(habitId) {
        const history = StorageEngine.getHabitHistory();
        const todayStr = StorageEngine.formatDate(new Date());
        
        if (!history[todayStr]) {
            history[todayStr] = [];
        }

        const idx = history[todayStr].indexOf(habitId);
        if (idx !== -1) {
            // Cancel check in
            history[todayStr].splice(idx, 1);
        } else {
            // Do check in
            history[todayStr].push(habitId);
            // 每次打卡触发微型 Confetti 彩色礼花！
            if (typeof GoalsManager !== 'undefined' && GoalsManager.triggerCelebration) {
                GoalsManager.triggerCelebration();
            }
        }

        StorageEngine.saveHabitHistory(history);
        this.renderHabits();
        this.renderHeatmap();
    },

    // 极客打卡：点击 365 像素格子直接打卡该日历史习惯
    toggleHistoryCheckIn(dateStr) {
        const habits = StorageEngine.getHabits();
        if (habits.length === 0) return;
        
        const history = StorageEngine.getHabitHistory();
        if (!history[dateStr]) {
            history[dateStr] = [];
        }
        
        // 弹窗询问或自动切换全选/全不选
        if (history[dateStr].length === habits.length) {
            // 清空这一天的打卡
            history[dateStr] = [];
        } else {
            // 这一天全习惯打卡
            history[dateStr] = habits.map(h => h.id);
        }
        
        StorageEngine.saveHabitHistory(history);
        this.renderHabits();
        this.renderHeatmap();
    },

    deleteHabit(habitId) {
        if (confirm("确定要删除这个日常习惯吗？历史打卡网格数据仍将保留。")) {
            let habits = StorageEngine.getHabits();
            habits = habits.filter(h => h.id !== habitId);
            StorageEngine.saveHabits(habits);
            this.renderHabits();
            this.renderHeatmap();
        }
    },

    // ================= ADD HABIT MODAL =================

    openHabitModal() {
        const modal = document.getElementById('habit-modal');
        if (modal) modal.classList.add('active');
    },

    closeHabitModal() {
        const modal = document.getElementById('habit-modal');
        if (modal) modal.classList.remove('remove'); // safety
        if (modal) modal.classList.remove('active');
    },

    addHabitFromForm() {
        const nameInput = document.getElementById('habit-name');
        const categoryInput = document.getElementById('habit-category');
        
        if (!nameInput) return;
        const name = nameInput.value.trim();
        const category = categoryInput.value;

        if (!name) return;

        const habits = StorageEngine.getHabits();
        const newHabit = {
            id: `habit-${Date.now()}`,
            name,
            category,
            frequency: 'daily',
            createdAt: Date.now()
        };
        
        habits.push(newHabit);
        StorageEngine.saveHabits(habits);
        
        this.closeHabitModal();
        this.renderHabits();
        this.renderHeatmap();
    }
};
