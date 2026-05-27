/**
 * ==========================================================================
 * CANVAS CHART ENGINE - LifeNavigator 365
 * Draws the high-fidelity 3D-effect Life Balance Radar Chart.
 * ==========================================================================
 */

const ChartEngine = {
    canvas: null,
    ctx: null,
    animationFrameId: null,
    
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Handle high-DPI displays (retina screens)
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    },

    // 绘制“人生平衡轮”雷达图 (支持渐变动画)
    drawBalanceWheel(data, animate = true) {
        if (!this.ctx) return;
        
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = width / 2;
        const centerY = height / 2 + 10; // offset down slightly for top labels
        const maxRadius = Math.min(width, height) * 0.35;
        
        // 三个维度的夹角坐标轴
        // 0: 工作事业 (12点方向, -90度)
        // 1: 自我提升 (4点方向, 30度)
        // 2: 美好生活 (8点方向, 150度)
        const angles = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6];
        const labels = ['工作事业', '自我提升', '美好生活'];
        const colors = ['#3b82f6', '#10b981', '#f43f5e']; // Work (blue), Study (green), Life (pink)
        
        let progress = animate ? 0 : 1;
        const speed = 0.05; // 动效生长速度

        const render = () => {
            this.ctx.clearRect(0, 0, width, height);
            
            // 读取 CSS 变量动态匹配明暗主题！
            const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#2d3033';
            const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5c6066';
            const colorBorder = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || 'rgba(0, 0, 0, 0.06)';
            
            // 1. 绘制虚化背景同心环/同心三角形 (4层网格)
            this.ctx.strokeStyle = colorBorder;
            this.ctx.lineWidth = 1;
            const gridLevels = 4;
            for (let level = 1; level <= gridLevels; level++) {
                const r = maxRadius * (level / gridLevels);
                this.ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const x = centerX + r * Math.cos(angles[i]);
                    const y = centerY + r * Math.sin(angles[i]);
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.stroke();
            }
            
            // 2. 绘制圆心到各顶点的骨架轴线
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX + maxRadius * Math.cos(angles[i]), centerY + maxRadius * Math.sin(angles[i]));
                this.ctx.strokeStyle = colorBorder;
                this.ctx.stroke();
            }

            // 3. 绘制文字标签与外围点
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            for (let i = 0; i < 3; i++) {
                const labelR = maxRadius + 22;
                const x = centerX + labelR * Math.cos(angles[i]);
                const y = centerY + labelR * Math.sin(angles[i]);
                
                // 绘制顶点类别装饰圈
                this.ctx.beginPath();
                this.ctx.arc(centerX + maxRadius * Math.cos(angles[i]), centerY + maxRadius * Math.sin(angles[i]), 3, 0, Math.PI * 2);
                this.ctx.fillStyle = colors[i];
                this.ctx.fill();

                // 绘制类别标签名称
                this.ctx.fillStyle = textSecondary;
                this.ctx.font = '500 11px Outfit, Inter, sans-serif';
                this.ctx.fillText(labels[i], x, y);
            }
            
            // 4. 绘制实际数据阴影与多边形
            // 每一个维度的进度值 (0.0 到 1.0)
            const targetValWork = data.work || 0;
            const targetValStudy = data.study || 0;
            const targetValLife = data.life || 0;
            
            // 动效递增
            const valWork = targetValWork * progress;
            const valStudy = targetValStudy * progress;
            const valLife = targetValLife * progress;
            const vals = [valWork, valStudy, valLife];
            
            const vertices = [];
            for (let i = 0; i < 3; i++) {
                const valRatio = Math.max(0.05, vals[i]);
                const r = maxRadius * valRatio;
                const x = centerX + r * Math.cos(angles[i]);
                const y = centerY + r * Math.sin(angles[i]);
                vertices.push({ x, y });
            }
            
            // 绘制连线与半透明渐变填充
            this.ctx.beginPath();
            this.ctx.moveTo(vertices[0].x, vertices[0].y);
            this.ctx.lineTo(vertices[1].x, vertices[1].y);
            this.ctx.lineTo(vertices[2].x, vertices[2].y);
            this.ctx.closePath();
            
            // 使用温和的、与当前主题融合的渐变作为填充色
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
            gradient.addColorStop(0, 'rgba(140, 115, 85, 0.05)'); 
            gradient.addColorStop(0.5, 'rgba(74, 99, 86, 0.12)'); 
            gradient.addColorStop(1, 'rgba(64, 80, 96, 0.22)'); 
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 绘制描边
            this.ctx.strokeStyle = textSecondary;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // 5. 绘制打卡值的高亮数据节点
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.arc(vertices[i].x, vertices[i].y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.strokeStyle = colors[i];
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = colors[i];
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.shadowBlur = 0; // 重置
            }
            
            // 动效递增状态更新
            if (progress < 1) {
                progress += speed;
                if (progress > 1) progress = 1;
                this.animationFrameId = requestAnimationFrame(render);
            }
        };

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        render();
    }
};
