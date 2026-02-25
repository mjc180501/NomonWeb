import { config } from './free_config.js';
import { Clock } from './free_widgets.js';
import { BroderClocks } from './free_broderclocks.js';

class WaldoCalibrationGame {
    constructor() {
        this.background_canvas = document.getElementById('background').getContext('2d');
        this.face_canvas = document.getElementById('clock_face').getContext('2d');
        this.hand_canvas = document.getElementById('clock_hand').getContext('2d');
        this.character_canvas = document.getElementById('character').getContext('2d');
        this.status = document.getElementById('status');
        this.targetIndicator = document.getElementById('target-indicator');
        this.CANVAS_WIDTH = 900;
        this.CANVAS_HEIGHT = 700;
        this.MARGIN = 60;
        this.CLOCK_RADIUS = 30;
        this.CHARACTER_SIZE = 40;
        this.phase = 'calibration';
        this.calibrationRound = 1;
        this.calibrationTotal = 3;
        this.targetClockIndex = 0;
        this.score = 0;
        this.round = 1;
        this.gameRound = 1;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.totalGameRounds = 5;
        this.time_rotate = config.period_li[config.default_rotate_ind];
        this.num_clocks = 12;
        this.clocks_on = Array.from({length: this.num_clocks}, (_, i) => i);
        this.win_diffs = Array(this.num_clocks).fill(config.win_diff_base);
        this.drawBackground();
        this.startCalibration();
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.on_press();
            }
        });
        setInterval(() => this.animate(), config.ideal_wait_s * 1000);
    }

    drawBackground() {
        const gradient = this.background_canvas.createLinearGradient(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.background_canvas.fillStyle = gradient;
        this.background_canvas.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }

    startCalibration() {
        this.phase = 'calibration';
        this.clearCanvases();
        this.createCalibrationClocks();
        this.targetClockIndex = Math.floor(Math.random() * this.num_clocks);
        this.showTargetIndicator();
        this.bc = new BroderClocks(this);
        this.bc.reset_for_new_selection();
        this.status.textContent = `Calibration ${this.calibrationRound}/${this.calibrationTotal}: Click TARGET clock when hand points UP!`;
        document.getElementById('mode-indicator').textContent = `CALIBRATION ${this.calibrationRound}/${this.calibrationTotal}`;
    }

    createCalibrationClocks() {
        this.clocks = [];
        const rows = 3;
        const cols = 4;
        const spacingX = (this.CANVAS_WIDTH - 2 * this.MARGIN) / (cols + 1);
        const spacingY = (this.CANVAS_HEIGHT - 2 * this.MARGIN) / (rows + 1);
        let clockId = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = this.MARGIN + (col + 1) * spacingX;
                const y = this.MARGIN + (row + 1) * spacingY;
                const clock = new Clock(this.face_canvas, this.hand_canvas, x, y, this.CLOCK_RADIUS, clockId);
                clock.draw_face();
                clock.draw_hand();
                this.clocks.push(clock);
                clockId++;
            }
        }
    }

    showTargetIndicator() {
        const targetClock = this.clocks[this.targetClockIndex];
        this.targetIndicator.textContent = 'TARGET';
        this.targetIndicator.style.left = (targetClock.x_pos - 50) + 'px';
        this.targetIndicator.style.top = (targetClock.y_pos - 80) + 'px';
        targetClock.highlighted = true;
        targetClock.face_canvas.shadowColor = 'yellow';
        targetClock.face_canvas.shadowBlur = 30;
        targetClock.draw_face();
        targetClock.face_canvas.shadowBlur = 0;
    }

    handleCalibrationSelection(clock_index) {
        const selectedClock = this.clocks[clock_index];
        if (clock_index === this.targetClockIndex) {
            selectedClock.winner = true;
            selectedClock.draw_face();
            this.status.textContent = 'Good! System learned your timing.';
            setTimeout(() => {
                if (this.calibrationRound >= this.calibrationTotal) {
                    this.status.textContent = 'Calibration complete! Starting game...';
                    document.getElementById('game-title').textContent = 'Where\'s Waldo - Clock Selection';
                    document.getElementById('main-instructions').textContent = 'Find Waldo and select the CLOSEST clock!';
                    setTimeout(() => { this.startGame(); }, 2000);
                } else {
                    this.calibrationRound++;
                    this.round++;
                    this.updateScoreboard();
                    this.startCalibration();
                }
            }, 1500);
        } else {
            selectedClock.winner = false;
            selectedClock.draw_face();
            const correctClock = this.clocks[this.targetClockIndex];
            correctClock.winner = true;
            correctClock.draw_face();
            this.status.textContent = 'Wrong clock! Click the TARGET clock.';
            setTimeout(() => {
                correctClock.winner = false;
                correctClock.draw_face();
                this.bc.reset_for_new_selection();
                this.status.textContent = `Calibration ${this.calibrationRound}/${this.calibrationTotal}: Try again!`;
            }, 2000);
        }
    }

    startGame() {
        this.phase = 'game';
        this.gameRound = 1;
        this.targetIndicator.textContent = '';
        this.newGameRound();
    }

    newGameRound() {
        this.clearCanvases();
        this.drawBackground();
        this.characterPos = {
            x: Math.random() * (this.CANVAS_WIDTH - 2 * this.MARGIN) + this.MARGIN,
            y: Math.random() * (this.CANVAS_HEIGHT - 2 * this.MARGIN) + this.MARGIN
        };
        this.drawCharacter();
        this.createRandomClocks();
        this.findClosestClock();
        this.bc = new BroderClocks(this);
        this.bc.reset_for_new_selection();
        this.status.textContent = `Round ${this.gameRound}/${this.totalGameRounds}: Find the closest clock to Waldo!`;
        document.getElementById('mode-indicator').textContent = 'PLAYING';
        document.getElementById('mode-indicator').style.color = '#51cf66';
    }

    drawCharacter() {
        const ctx = this.character_canvas;
        const x = this.characterPos.x;
        const y = this.characterPos.y;
        const size = this.CHARACTER_SIZE;
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - size/3, y + size/3, size*2/3, size/2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size/3, y + size/2, size*2/3, size/8);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - size/2.5, y - size/2, size/1.3, size/4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size/2.5, y - size/2.5, size/1.3, size/8);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - size/6, y, size/8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size/6, y, size/8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    createRandomClocks() {
        this.clocks = [];
        for (let i = 0; i < this.num_clocks; i++) {
            let x, y;
            let tooClose = true;
            let attempts = 0;
            while (tooClose && attempts < 100) {
                x = Math.random() * (this.CANVAS_WIDTH - 2 * this.MARGIN) + this.MARGIN;
                y = Math.random() * (this.CANVAS_HEIGHT - 2 * this.MARGIN) + this.MARGIN;
                tooClose = false;
                const distToChar = Math.sqrt((x - this.characterPos.x) ** 2 + (y - this.characterPos.y) ** 2);
                if (distToChar < this.CHARACTER_SIZE + this.CLOCK_RADIUS + 20) {
                    tooClose = true;
                    attempts++;
                    continue;
                }
                for (let clock of this.clocks) {
                    const dist = Math.sqrt((x - clock.x_pos) ** 2 + (y - clock.y_pos) ** 2);
                    if (dist < this.CLOCK_RADIUS * 3) {
                        tooClose = true;
                        break;
                    }
                }
                attempts++;
            }
            const clock = new Clock(this.face_canvas, this.hand_canvas, x, y, this.CLOCK_RADIUS, i);
            clock.draw_face();
            clock.draw_hand();
            this.clocks.push(clock);
        }
    }

    findClosestClock() {
        let minDist = Infinity;
        let closestIndex = 0;
        for (let i = 0; i < this.clocks.length; i++) {
            const clock = this.clocks[i];
            const dist = Math.sqrt((clock.x_pos - this.characterPos.x) ** 2 + (clock.y_pos - this.characterPos.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        }
        this.correctClockIndex = closestIndex;
    }

    handleGameSelection(clock_index) {
        const selectedClock = this.clocks[clock_index];
        if (clock_index === this.correctClockIndex) {
            selectedClock.winner = true;
            selectedClock.draw_face();
            this.score += 10;
            this.currentStreak++;
            this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
            this.status.textContent = `Correct! +10 points! Streak: ${this.currentStreak}`;
            this.showConnection(selectedClock, true);
            setTimeout(() => {
                if (this.gameRound >= this.totalGameRounds) {
                    this.startFeedback();
                } else {
                    this.gameRound++;
                    this.round++;
                    this.updateScoreboard();
                    this.newGameRound();
                }
            }, 2000);
        } else {
            selectedClock.winner = false;
            selectedClock.highlighted = false;
            selectedClock.draw_face();
            const correctClock = this.clocks[this.correctClockIndex];
            correctClock.winner = true;
            correctClock.draw_face();
            this.currentStreak = 0;
            this.status.textContent = `Wrong! Correct clock shown in green.`;
            this.showConnection(selectedClock, false);
            this.showConnection(correctClock, true);
            setTimeout(() => {
                if (this.gameRound >= this.totalGameRounds) {
                    this.startFeedback();
                } else {
                    this.gameRound++;
                    this.round++;
                    this.updateScoreboard();
                    this.newGameRound();
                }
            }, 3000);
        }
    }

    showConnection(clock, isCorrect) {
        const ctx = this.character_canvas;
        ctx.strokeStyle = isCorrect ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.characterPos.x, this.characterPos.y);
        ctx.lineTo(clock.x_pos, clock.y_pos);
        ctx.stroke();
        ctx.setLineDash([]);
        const dist = Math.sqrt((clock.x_pos - this.characterPos.x) ** 2 + (clock.y_pos - this.characterPos.y) ** 2);
        const midX = (this.characterPos.x + clock.x_pos) / 2;
        const midY = (this.characterPos.y + clock.y_pos) / 2;
        ctx.fillStyle = isCorrect ? '#00ff00' : '#ff0000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(dist.toFixed(0) + 'px', midX, midY);
    }

    startFeedback() {
        this.phase = 'feedback';
        this.clearCanvases();
        this.drawBackground();
        this.clocks = [];
        const spacing = this.CANVAS_WIDTH / 4;
        const y = this.CANVAS_HEIGHT / 2;
        const labels = ['YES', 'UNSURE', 'NO'];
        const colors = ['#00ff00', '#ffd700', '#ff0000'];
        for (let i = 0; i < 3; i++) {
            const x = spacing * (i + 1);
            const clock = new Clock(this.face_canvas, this.hand_canvas, x, y, 50, i);
            clock.draw_face();
            clock.draw_hand();
            this.clocks.push(clock);
            this.face_canvas.fillStyle = colors[i];
            this.face_canvas.font = 'bold 24px Arial';
            this.face_canvas.textAlign = 'center';
            this.face_canvas.fillText(labels[i], x, y + 90);
        }
        this.num_clocks = 3;
        this.clocks_on = [0,1,2];
        this.win_diffs = Array(3).fill(config.win_diff_base);
        this.bc = new BroderClocks(this);
        this.bc.reset_for_new_selection();
        this.status.textContent = 'Did the system make any mistakes selecting the wrong clock?';
        document.getElementById('mode-indicator').textContent = 'FEEDBACK';
        document.getElementById('mode-indicator').style.color = '#ffd700';
    }

    handleFeedbackSelection(clock_index) {
        const responses = ['YES','UNSURE','NO'];
        const response = responses[clock_index];
        console.log("User feedback:", response);
        if (response === 'NO') {
            this.status.textContent = 'Great! Your feedback helps improve the system.';
        } else if (response === 'YES') {
            this.status.textContent = 'Thanks for the feedback! System will adapt.';
        } else {
            this.status.textContent = 'Noted. Thanks for your input!';
        }
        setTimeout(() => { this.showFinalScore(); }, 2000);
    }

    showFinalScore() {
        this.clearCanvases();
        this.drawBackground();
        const ctx = this.face_canvas;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Complete!', this.CANVAS_WIDTH / 2, 200);
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`Final Score: ${this.score}`, this.CANVAS_WIDTH / 2, 300);
        ctx.fillText(`Best Streak: ${this.bestStreak}`, this.CANVAS_WIDTH / 2, 360);
        ctx.font = '24px Arial';
        ctx.fillText('Refresh page to play again', this.CANVAS_WIDTH / 2, 450);
        this.status.textContent = `Game Over! Score: ${this.score} | Best Streak: ${this.bestStreak}`;
    }

    clearCanvases() {
        this.face_canvas.clearRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT);
        this.hand_canvas.clearRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT);
        this.character_canvas.clearRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT);
    }

    animate() {
        if (this.bc && this.bc.clock_inf) this.bc.clock_inf.clock_util.increment(this.clocks_on);
    }

    on_press() {
        if (!this.bc) return;
        const time_in = Date.now()/1000;
        this.bc.select(time_in);
    }

    make_choice(clock_index) {
        if (this.phase === 'calibration') this.handleCalibrationSelection(clock_index);
        else if (this.phase === 'game') this.handleGameSelection(clock_index);
        else if (this.phase === 'feedback') this.handleFeedbackSelection(clock_index);
    }

    updateScoreboard() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('round').textContent = this.round;
        document.getElementById('streak').textContent = this.bestStreak;
    }
}

const game = new WaldoCalibrationGame();