import { config } from './free_config.js';
import { Clock } from './free_widgets.js';
import { BroderClocks } from './free_broderclocks.js';

export class Connect4Game {
    constructor() {
        this.grid_canvas = document.getElementById('grid_canvas').getContext('2d');
        this.face_canvas = document.getElementById('clock_face').getContext('2d');
        this.hand_canvas = document.getElementById('clock_hand').getContext('2d');
        this.status = document.getElementById('status');

        this.ROWS = 6;
        this.COLS = 7;
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(""));
        this.columnHeights = Array(this.COLS).fill(0);

        this.gameOver = false;
        this.playerTurn = true;

        this.time_rotate = config.period_li[config.default_rotate_ind];
        this.num_clocks = this.COLS;
        this.clocks_on = Array.from({ length: this.COLS }, (_, i) => i);
        this.win_diffs = Array(this.COLS).fill(config.win_diff_base);

        this.createClocks();
        this.drawBoard();

        this.bc = new BroderClocks(this);
        this.bc.reset_for_new_selection();

        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.on_press();
            }
        });

        setInterval(() => this.animate(), config.ideal_wait_s * 1000);
    }

    createClocks() {
        this.clocks = [];
        const padding = 50;
        const boardWidth = 700;
        const colWidth = boardWidth / this.COLS;

        for (let col = 0; col < this.COLS; col++) {
            const x = padding + col * colWidth + colWidth / 2;
            const y = 40;

            const clock = new Clock(
                this.face_canvas,
                this.hand_canvas,
                x,
                y,
                25,
                col
            );
            clock.draw_face();
            clock.draw_hand();
            this.clocks.push(clock);
        }
    }

    drawBoard() {
        const padding = 50;
        const boardWidth = 700;
        const boardHeight = 600;
        const colWidth = boardWidth / this.COLS;
        const rowHeight = boardHeight / this.ROWS;
        const startY = 80;

        this.grid_canvas.clearRect(0, 0, 800, 700);

        this.grid_canvas.fillStyle = "#0066cc";
        this.grid_canvas.fillRect(padding, startY, boardWidth, boardHeight);

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const x = padding + col * colWidth + colWidth / 2;
                const y = startY + row * rowHeight + rowHeight / 2;
                const radius = Math.min(colWidth, rowHeight) * 0.4;

                this.grid_canvas.beginPath();
                this.grid_canvas.arc(x, y, radius, 0, 2 * Math.PI);

                if (this.board[row][col] === "R") {
                    this.grid_canvas.fillStyle = "#e74c3c";
                } else if (this.board[row][col] === "Y") {
                    this.grid_canvas.fillStyle = "#f1c40f";
                } else {
                    this.grid_canvas.fillStyle = "#ffffff";
                }
                this.grid_canvas.fill();

                this.grid_canvas.strokeStyle = "#333";
                this.grid_canvas.lineWidth = 2;
                this.grid_canvas.stroke();
            }
        }
    }

    dropPiece(col, player) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] === "") {
                this.board[row][col] = player;
                this.columnHeights[col]++;
                return row;
            }
        }
        return -1;
    }

    checkWinner() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] !== "" &&
                    this.board[row][col] === this.board[row][col + 1] &&
                    this.board[row][col] === this.board[row][col + 2] &&
                    this.board[row][col] === this.board[row][col + 3]) {
                    return this.board[row][col];
                }
            }
        }

        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] !== "" &&
                    this.board[row][col] === this.board[row + 1][col] &&
                    this.board[row][col] === this.board[row + 2][col] &&
                    this.board[row][col] === this.board[row + 3][col]) {
                    return this.board[row][col];
                }
            }
        }

        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] !== "" &&
                    this.board[row][col] === this.board[row + 1][col + 1] &&
                    this.board[row][col] === this.board[row + 2][col + 2] &&
                    this.board[row][col] === this.board[row + 3][col + 3]) {
                    return this.board[row][col];
                }
            }
        }

        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 3; col < this.COLS; col++) {
                if (this.board[row][col] !== "" &&
                    this.board[row][col] === this.board[row + 1][col - 1] &&
                    this.board[row][col] === this.board[row + 2][col - 2] &&
                    this.board[row][col] === this.board[row + 3][col - 3]) {
                    return this.board[row][col];
                }
            }
        }

        if (this.board.every(row => row.every(cell => cell !== ""))) {
            return "tie";
        }

        return null;
    }

    aiMove() {
        if (this.gameOver) return -1;

        const aiPlayer = "Y";
        const humanPlayer = "R";

        for (let col = 0; col < this.COLS; col++) {
            if (this.columnHeights[col] < this.ROWS) {
                const row = this.dropPiece(col, aiPlayer);
                if (this.checkWinner() === aiPlayer) {
                    return col;
                }
                this.board[row][col] = "";
                this.columnHeights[col]--;
            }
        }

        for (let col = 0; col < this.COLS; col++) {
            if (this.columnHeights[col] < this.ROWS) {
                const row = this.dropPiece(col, humanPlayer);
                if (this.checkWinner() === humanPlayer) {
                    this.board[row][col] = aiPlayer;
                    return col;
                }
                this.board[row][col] = "";
                this.columnHeights[col]--;
            }
        }

        for (let col = 0; col < this.COLS; col++) {
            if (this.columnHeights[col] < this.ROWS) {
                this.dropPiece(col, aiPlayer);
                return col;
            }
        }

        return -1;
    }

    animate() {
        if (!this.gameOver && this.playerTurn) {
            this.bc.clock_inf.clock_util.increment(this.clocks_on);
        }
    }

    on_press() {
        if (this.gameOver || !this.playerTurn) return;
        const time_in = Date.now() / 1000;
        this.bc.select(time_in);
    }

    make_choice(clock_index) {
        const clock = this.clocks[clock_index];
        const col = clock.col;

        if (this.columnHeights[col] >= this.ROWS) {
            this.status.textContent = "Column is full! Try another column.";
            setTimeout(() => {
                this.status.textContent = "Your turn! Press SPACE to select column";
                this.bc.reset_for_new_selection();
            }, 1500);
            return;
        }

        const row = this.dropPiece(col, "R");

        if (this.columnHeights[col] >= this.ROWS) {
            clock.hide();
            this.clocks_on = this.clocks_on.filter(i => i !== clock_index);
        }

        this.drawBoard();

        const result = this.checkWinner();
        if (result) {
            this.gameOver = true;
            if (result === "tie") {
                this.status.textContent = "It's a tie!";
            } else if (result === "R") {
                this.status.textContent = "You win!";
            } else {
                this.status.textContent = "Computer wins!";
            }
            return;
        }

        this.playerTurn = false;
        this.status.textContent = "Computer is thinking...";

        setTimeout(() => {
            const aiCol = this.aiMove();

            if (aiCol !== -1 && this.columnHeights[aiCol] >= this.ROWS) {
                const aiClockIndex = this.clocks.findIndex(c => c.col === aiCol);
                if (aiClockIndex !== -1) {
                    this.clocks[aiClockIndex].hide();
                    this.clocks_on = this.clocks_on.filter(i => i !== aiClockIndex);
                }
            }

            this.drawBoard();

            const aiResult = this.checkWinner();
            if (aiResult) {
                this.gameOver = true;
                if (aiResult === "tie") {
                    this.status.textContent = "It's a tie!";
                } else if (aiResult === "R") {
                    this.status.textContent = "You win!";
                } else {
                    this.status.textContent = "Computer wins!";
                }
            } else {
                setTimeout(() => {
                    this.playerTurn = true;
                    this.status.textContent = "Your turn! Press SPACE to select column";

                    if (this.clocks_on.length > 0) {
                        this.bc = new BroderClocks(this);
                        this.bc.reset_for_new_selection();
                    }
                }, 1000);
            }
        }, 1500);
    }
}

const game = new Connect4Game();