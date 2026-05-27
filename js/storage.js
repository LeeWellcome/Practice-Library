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

    // 默认高颜值初始化数据，让用户首次打开有惊艳的感觉
    getMockData() {
        return {
            goals: [
                {
                    id: 'goal-1',
                    title: '完成公司核心业务系统的微服务化重构与性能调优',
                    category: 'work',
                    priority: 'high',
                    month: '6',
                    status: 'doing',
                    focus: true,
                    milestones: [
                        { id: 'ms-1-1', text: '完成高可用微服务架构方案设计与评审', completed: true },
                        { id: 'ms-1-2', text: '核心业务模块拆分与数据库冷热分离改造', completed: false },
                        { id: 'ms-1-3', text: '全链路压测与灰度发布上线，降低接口延时30%', completed: false }
                    ]
                },
                {
                    id: 'goal-2',
                    title: '发布上线 Life Plan（午先生尊享版） 明星计划应用并获取首批活跃用户',
                    category: 'work',
                    priority: 'medium',
                    month: '9',
                    status: 'doing',
                    focus: false,
                    milestones: [
                        { id: 'ms-2-1', text: '完成核心玻璃拟态交互及 Canvas 算法开发', completed: true },
                        { id: 'ms-2-2', text: '设计并实现 LocalStorage 自动数据引擎', completed: true },
                        { id: 'ms-2-3', text: '部署上线并吸引 100+ 首批种子用户体验反馈', completed: false }
                    ]
                },
                {
                    id: 'goal-3',
                    title: '精读并输出 6 本技术与商业架构经典著作的深度读书笔记',
                    category: 'study',
                    priority: 'medium',
                    month: '12',
                    status: 'doing',
                    focus: true,
                    milestones: [
                        { id: 'ms-3-1', text: '精读并实践《架构整洁之道》', completed: true },
                        { id: 'ms-3-2', text: '精读并梳理《高性能 MySQL（第四版）》核心考点', completed: false },
                        { id: 'ms-3-3', text: '输出《系统架构师生存指南》精编博文', completed: false }
                    ]
                },
                {
                    id: 'goal-4',
                    title: '掌握高级前端工程化技能，完成 3 个高难度动效系统实战',
                    category: 'study',
                    priority: 'high',
                    month: '10',
                    status: 'todo',
                    focus: false,
                    milestones: [
                        { id: 'ms-4-1', text: '精通 WebGL / Canvas 高阶粒子交互动效', completed: false },
                        { id: 'ms-4-2', text: '手写一个轻量级 Web Components UI 库', completed: false },
                        { id: 'ms-4-3', text: '在生产环境落地一套极速 Webpack/Vite 性能优化指标', completed: false }
                    ]
                },
                {
                    id: 'goal-5',
                    title: '通过科学的体能训练，成功完成一次半程马拉松挑战（21.0975公里）',
                    category: 'life',
                    priority: 'high',
                    month: '11',
                    status: 'doing',
                    focus: false,
                    milestones: [
                        { id: 'ms-5-1', text: '每月跑步训练量稳定积累达到 60km 以上', completed: true },
                        { id: 'ms-5-2', text: '周末单次拉练完成 16km 耐力挑战', completed: false },
                        { id: 'ms-5-3', text: '成功报名秋季半马并顺利完赛，用时控制在2小时以内', completed: false }
                    ]
                },
                {
                    id: 'goal-6',
                    title: '极简心流建立：连续 30 天完成清晨冥想与无干扰手账阅读',
                    category: 'life',
                    priority: 'low',
                    month: '5',
                    status: 'done',
                    focus: false,
                    milestones: [
                        { id: 'ms-6-1', text: '早起 10 分钟，完成 30 天呼吸正念冥想打卡', completed: true },
                        { id: 'ms-6-2', text: '关机阅读 20 小时非核心技术类社科名著', completed: true }
                    ]
                }
            ],
            habits: [
                { id: 'habit-1', name: '清晨正念冥想（心流建立）', category: 'life', frequency: 'daily', createdAt: Date.now() },
                { id: 'habit-2', name: '高能英语原声音频精听 15分钟', category: 'study', frequency: 'daily', createdAt: Date.now() },
                { id: 'habit-3', name: '每天撰写 200 字技术或生活手账复盘', category: 'study', frequency: 'daily', createdAt: Date.now() },
                { id: 'habit-4', name: '保证摄入 2000ml 水，避免久坐', category: 'life', frequency: 'daily', createdAt: Date.now() }
            ],
            habitHistory: this.generateMockHabitHistory() // 渲染极其逼真的打卡网格历史
        };
    },

    // 生成逼真的历史打卡数据（为GitHub打卡图效果）
    generateMockHabitHistory() {
        const history = {};
        const now = new Date();
        const startOfYear = new Date(2026, 0, 1);
        const diffMs = now - startOfYear;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // 习惯ID数组
        const habitIds = ['habit-1', 'habit-2', 'habit-3', 'habit-4'];
        
        // 随机在2026年已过的每一天打卡，使热力图看起来生动有趣
        for (let i = 0; i <= diffDays; i++) {
            const targetDate = new Date(2026, 0, 1 + i);
            const dateStr = this.formatDate(targetDate);
            
            // 每一天有 60% 概率有打卡
            if (Math.random() > 0.4) {
                history[dateStr] = [];
                habitIds.forEach(id => {
                    // 每个习惯 70% 概率完成
                    if (Math.random() > 0.3) {
                        history[dateStr].push(id);
                    }
                });
            }
        }
        return history;
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
            version: '1.0.0'
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
