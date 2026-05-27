/**
 * ==========================================================================
 * DATA STORAGE ENGINE - Life Plan（午先生尊享版）
 * Handles localStorage operations, mock data initialization, and backups.
 * ==========================================================================
 */

const StorageEngine = {
    KEYS: {
        GOALS: 'lifenav_365_goals',
        HABITS: 'lifenav_365_habits',
        HABIT_HISTORY: 'lifenav_365_habit_history'
    },

    // 默认数据初始化为干净的空白状态，等待用户自行设定
    getMockData() {
        return {
            goals: [],
            habits: [],
            habitHistory: {}
        };
    },

    // 工具函数：日期转 YYYY-MM-DD
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    // 初始化数据加载
    init() {
        // 一次性自动迁移：强制清空之前预设的旧默认数据，使其初始化为完美的空白状态
        if (!localStorage.getItem('lifenav_365_is_cleared_v2')) {
            localStorage.removeItem(this.KEYS.GOALS);
            localStorage.removeItem(this.KEYS.HABITS);
            localStorage.removeItem(this.KEYS.HABIT_HISTORY);
            localStorage.setItem('lifenav_365_is_cleared_v2', 'true');
        }

        if (!localStorage.getItem(this.KEYS.GOALS)) {
            const mock = this.getMockData();
            this.saveGoals(mock.goals);
            this.saveHabits(mock.habits);
            this.saveHabitHistory(mock.habitHistory);
        }
    },

    // ================= GOAL METHODS =================
    getGoals() {
        this.init();
        return JSON.parse(localStorage.getItem(this.KEYS.GOALS)) || [];
    },

    saveGoals(goals) {
        localStorage.setItem(this.KEYS.GOALS, JSON.stringify(goals));
    },

    // ================= HABIT METHODS =================
    getHabits() {
        this.init();
        return JSON.parse(localStorage.getItem(this.KEYS.HABITS)) || [];
    },

    saveHabits(habits) {
        localStorage.setItem(this.KEYS.HABITS, JSON.stringify(habits));
    },

    getHabitHistory() {
        this.init();
        return JSON.parse(localStorage.getItem(this.KEYS.HABIT_HISTORY)) || {};
    },

    saveHabitHistory(history) {
        localStorage.setItem(this.KEYS.HABIT_HISTORY, JSON.stringify(history));
    },

    // ================= BACKUP & IMPORT =================
    exportAllData() {
        const data = {
            goals: this.getGoals(),
            habits: this.getHabits(),
            habitHistory: this.getHabitHistory(),
            exportedAt: new Date().toISOString(),
            version: '1.0.1'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-plan-wuxiansheng-backup-${this.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importAllData(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.goals && parsed.habits && parsed.habitHistory) {
                    this.saveGoals(parsed.goals);
                    this.saveHabits(parsed.habits);
                    this.saveHabitHistory(parsed.habitHistory);
                    callback(true, "导入成功！数据已更新。");
                } else {
                    callback(false, "无效的备份文件结构。");
                }
            } catch (err) {
                callback(false, "解析 JSON 备份文件失败。");
            }
        };
        reader.readAsText(file);
    },

    resetAllData() {
        localStorage.removeItem(this.KEYS.GOALS);
        localStorage.removeItem(this.KEYS.HABITS);
        localStorage.removeItem(this.KEYS.HABIT_HISTORY);
        this.init();
    }
};
