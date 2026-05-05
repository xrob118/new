
class Mech {
    constructor(x, y, color, controls, isPlayer1) {
        this.x = x;
        this.y = y;
        this.originalY = y;
        this.color = color;
        this.controls = controls;
        this.isPlayer1 = isPlayer1;
        
        this.width = 50;
        this.height = 60;
        
        this.health = 100;
        this.maxHealth = 100;
        
        this.state = 'idle';
        this.direction = isPlayer1 ? 1 : -1;
        this.speed = 3;
        
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.defenseActive = false;
        this.hitFlash = 0;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(keys, otherMech) {
        this.state = 'idle';
        let isMoving = false;
        
        if (keys[this.controls.left]) {
            this.x -= this.speed;
            this.direction = -1;
            isMoving = true;
        }
        if (keys[this.controls.right]) {
            this.x += this.speed;
            this.direction = 1;
            isMoving = true;
        }
        if (keys[this.controls.up]) {
            this.y = this.originalY - 20;
            isMoving = true;
        } else if (keys[this.controls.down]) {
            this.y = this.originalY + 20;
            isMoving = true;
        } else {
            this.y = this.originalY;
        }
        
        if (isMoving &amp;&amp; this.attackCooldown &lt;= 0) {
            this.state = 'moving';
        }
        
        this.x = Math.max(0, Math.min(600 - this.width, this.x));
        
        if (keys[this.controls.defend]) {
            this.defenseActive = true;
            this.state = 'defending';
        } else {
            this.defenseActive = false;
        }
        
        if (keys[this.controls.attack] &amp;&amp; this.attackCooldown &lt;= 0 &amp;&amp; !this.defenseActive) {
            this.state = 'attacking';
            this.attackDuration = 20;
            this.attackCooldown = 40;
            this.tryHit(otherMech);
        }
        
        if (this.attackCooldown &gt; 0) this.attackCooldown--;
        if (this.attackDuration &gt; 0) {
            this.attackDuration--;
            this.state = 'attacking';
        }
        if (this.hitFlash &gt; 0) this.hitFlash--;
        
        this.animTimer++;
        if (this.animTimer &gt; 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    tryHit(otherMech) {
        const attackRange = 70;
        const dx = (otherMech.x + otherMech.width/2) - (this.x + this.width/2);
        const dy = Math.abs((otherMech.y + otherMech.height/2) - (this.y + this.height/2));
        
        if (dy &lt; 40 &amp;&amp; Math.abs(dx) &lt; attackRange) {
            if ((this.direction &gt; 0 &amp;&amp; dx &gt; 0) || (this.direction &lt; 0 &amp;&amp; dx &lt; 0)) {
                let damage = 15;
                if (otherMech.defenseActive) {
                    damage = 5;
                }
                otherMech.takeDamage(damage);
            }
        }
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.hitFlash = 15;
        this.state = 'hit';
    }
    
    draw(ctx) {
        ctx.save();
        
        if (this.hitFlash &gt; 0 &amp;&amp; this.hitFlash % 4 &lt; 2) {
            ctx.globalAlpha = 0.5;
        }
        
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        if (this.direction === -1) {
            ctx.translate(centerX * 2, 0);
            ctx.scale(-1, 1);
        }
        
        const drawPixel = (x, y, w, h, color) =&gt; {
            ctx.fillStyle = color;
            ctx.fillRect(this.x + x, this.y + y, w, h);
        };
        
        let primaryColor = this.color;
        let secondaryColor = this.isPlayer1 ? '#00aaaa' : '#aa2240';
        let accentColor = '#ffff00';
        
        drawPixel(15, 0, 20, 15, primaryColor);
        drawPixel(18, 3, 4, 4, accentColor);
        drawPixel(28, 3, 4, 4, accentColor);
        drawPixel(20, 10, 10, 3, '#666');
        
        drawPixel(10, 15, 30, 25, primaryColor);
        drawPixel(15, 18, 20, 5, secondaryColor);
        drawPixel(22, 25, 6, 10, accentColor);
        
        if (this.defenseActive) {
            ctx.strokeStyle = this.isPlayer1 ? '#00fff5' : '#e94560';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = this.isPlayer1 ? 'rgba(0, 255, 245, 0.2)' : 'rgba(233, 69, 96, 0.2)';
            ctx.fill();
        }
        
        let armX = 5;
        if (this.state === 'attacking') {
            armX = -15;
            drawPixel(40, 20, 25, 8, primaryColor);
            drawPixel(60, 15, 8, 18, '#888');
        } else {
            const armOffset = this.state === 'moving' ? Math.sin(this.animFrame) * 3 : 0;
            drawPixel(5, 20 + armOffset, 8, 15, primaryColor);
            drawPixel(37, 20 - armOffset, 8, 15, primaryColor);
        }
        
        const legOffset = this.state === 'moving' ? Math.sin(this.animFrame * 2) * 4 : 0;
        drawPixel(12, 40 + legOffset, 10, 20, primaryColor);
        drawPixel(28, 40 - legOffset, 10, 20, primaryColor);
        
        drawPixel(10, 55 + legOffset, 14, 5, secondaryColor);
        drawPixel(26, 55 - legOffset, 14, 5, secondaryColor);
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.keys = {};
        this.gameOver = false;
        this.winner = null;
        
        this.initGame();
        this.setupEventListeners();
    }
    
    initGame() {
        this.mech1 = new Mech(100, 280, '#0f3460', {
            left: 'a',
            right: 'd',
            up: 'w',
            down: 's',
            attack: 'j',
            defend: 'k'
        }, true);
        
        this.mech2 = new Mech(450, 280, '#e94560', {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            up: 'ArrowUp',
            down: 'ArrowDown',
            attack: '1',
            defend: '2'
        }, false);
        
        this.gameOver = false;
        this.winner = null;
        
        document.getElementById('game-over-overlay').classList.add('hidden');
        this.updateUI();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) =&gt; {
            this.keys[e.key] = true;
            e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) =&gt; {
            this.keys[e.key] = false;
        });
        
        document.getElementById('start-btn').addEventListener('click', () =&gt; {
            this.showScreen('game');
            this.start();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () =&gt; {
            this.initGame();
            this.start();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () =&gt; {
            this.showScreen('start');
        });
    }
    
    showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s =&gt; s.classList.remove('active'));
        if (screen === 'start') {
            document.getElementById('start-screen').classList.add('active');
        } else if (screen === 'game') {
            document.getElementById('game-screen').classList.add('active');
        }
    }
    
    start() {
        this.initGame();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() =&gt; this.gameLoop());
        }
    }
    
    update() {
        this.mech1.update(this.keys, this.mech2);
        this.mech2.update(this.keys, this.mech1);
        
        this.checkGameOver();
        this.updateUI();
    }
    
    checkGameOver() {
        if (this.mech1.health &lt;= 0) {
            this.gameOver = true;
            this.winner = 2;
            this.showGameOver();
        } else if (this.mech2.health &lt;= 0) {
            this.gameOver = true;
            this.winner = 1;
            this.showGameOver();
        }
    }
    
    showGameOver() {
        const winnerText = document.getElementById('winner-text');
        winnerText.textContent = `玩家 ${this.winner} 获胜！`;
        winnerText.style.color = this.winner === 1 ? '#00fff5' : '#e94560';
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('health-fill1').style.width = 
            `${(this.mech1.health / this.mech1.maxHealth) * 100}%`;
        document.getElementById('health-text1').textContent = 
            `${this.mech1.health}/${this.mech1.maxHealth}`;
        
        document.getElementById('health-fill2').style.width = 
            `${(this.mech2.health / this.mech2.maxHealth) * 100}%`;
        document.getElementById('health-text2').textContent = 
            `${this.mech2.health}/${this.mech2.maxHealth}`;
        
        document.getElementById('state1').textContent = this.getStateText(this.mech1);
        document.getElementById('state2').textContent = this.getStateText(this.mech2);
    }
    
    getStateText(mech) {
        const stateMap = {
            'idle': '待机',
            'moving': '移动中',
            'attacking': '攻击！',
            'defending': '防御',
            'hit': '受击!'
        };
        return stateMap[mech.state] || '待机';
    }
    
    draw() {
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawGround();
        this.mech1.draw(this.ctx);
        this.mech2.draw(this.ctx);
    }
    
    drawBackground() {
        this.ctx.strokeStyle = 'rgba(15, 52, 96, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x &lt; this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y &lt; this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const stars = [[50, 30], [150, 80], [300, 50], [450, 100], [550, 40], [100, 150], [400, 180], [500, 140]];
        stars.forEach(([x, y]) =&gt; {
            this.ctx.fillRect(x, y, 2, 2);
        });
    }
    
    drawGround() {
        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, 360, 600, 40);
        
        this.ctx.fillStyle = '#002244';
        for (let x = 0; x &lt; 600; x += 20) {
            this.ctx.fillRect(x, 360, 10, 5);
        }
        
        this.ctx.fillStyle = '#00fff5';
        this.ctx.fillRect(0, 358, 600, 2);
    }
}

document.addEventListener('DOMContentLoaded', () =&gt; {
    const game = new Game();
});
