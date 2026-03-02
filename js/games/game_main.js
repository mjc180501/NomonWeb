import { config } from './free_config.js';
import { Clock } from './free_widgets.js';
import { BroderClocks } from './free_broderclocks.js';

export class TicTacToeGame {
    constructor() {
        this.grid_canvas = document.getElementById('grid_canvas').getContext('2d');
        this.face_canvas = document.getElementById('clock_face').getContext('2d');
        this.hand_canvas = document.getElementById('clock_hand').getContext('2d');
        this.status = document.getElementById('status');
        this.board = [["","",""],["","",""],["","",""]];
        this.gameOver = false;
        this.playerTurn = true;
        this.time_rotate = config.period_li[config.default_rotate_ind];
        this.num_clocks = 9;
        this.clocks_on = [0,1,2,3,4,5,6,7,8];
        this.win_diffs = Array(9).fill(config.win_diff_base);
        this.createClocks();
        this.drawGrid();
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

    // Calista - look here :)
    createClocks() {
        this.clocks = [];
        const padding = 100;
        const gridSize = 400;
        const cellSize = gridSize / 3;
        const clockLayout = [
            { row: 0, col: 0 },{ row: 0, col: 1 },{ row: 0, col: 2 },
            { row: 1, col: 0 },{ row: 1, col: 1 },{ row: 1, col: 2 },
            { row: 2, col: 0 },{ row: 2, col: 1 },{ row: 2, col: 2 }
        ];
        for (let i = 0; i < clockLayout.length; i++) {
            const layout = clockLayout[i];
            const x = padding + layout.col * cellSize + cellSize / 2;
            const y = padding + layout.row * cellSize + cellSize / 2;
            const clock = new Clock(this.face_canvas, this.hand_canvas, x, y, 30, layout.row, layout.col);
            clock.draw_face();
            clock.draw_hand();
            this.clocks.push(clock);
        }
    }

    drawGrid() {
        const padding = 100;
        const gridSize = 400;
        const cellSize = gridSize / 3;
        this.grid_canvas.strokeStyle = "#000";
        this.grid_canvas.lineWidth = 3;
        for (let i = 1; i < 3; i++) {
            this.grid_canvas.beginPath();
            this.grid_canvas.moveTo(padding + i * cellSize, padding);
            this.grid_canvas.lineTo(padding + i * cellSize, padding + gridSize);
            this.grid_canvas.stroke();
            this.grid_canvas.beginPath();
            this.grid_canvas.moveTo(padding, padding + i * cellSize);
            this.grid_canvas.lineTo(padding + gridSize, padding + i * cellSize);
            this.grid_canvas.stroke();
        }
        this.drawBoard();
    }

    drawBoard() {
        const padding = 100;
        const gridSize = 400;
        const cellSize = gridSize / 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (this.board[r][c] !== "") {
                    const cellX = padding + c * cellSize + cellSize / 2;
                    const cellY = padding + r * cellSize + cellSize / 2;
                    this.grid_canvas.fillStyle = this.board[r][c] === "X" ? "#e74c3c" : "#2ecc71";
                    this.grid_canvas.font = `bold ${cellSize * 0.8}px sans-serif`;
                    this.grid_canvas.textAlign = "center";
                    this.grid_canvas.textBaseline = "middle";
                    this.grid_canvas.fillText(this.board[r][c], cellX, cellY);
                }
            }
        }
    }

    checkWinner() {
        const lines = [
            [[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]],
            [[0,0],[1,0],[2,0]],[[0,1],[1,1],[2,1]],[[0,2],[1,2],[2,2]],
            [[0,0],[1,1],[2,2]],[[0,2],[1,1],[2,0]]
        ];
        for (let line of lines) {
            const [a,b,c] = line;
            if (this.board[a[0]][a[1]] !== "" &&
                this.board[a[0]][a[1]] === this.board[b[0]][b[1]] &&
                this.board[a[0]][a[1]] === this.board[c[0]][c[1]]) {
                return this.board[a[0]][a[1]];
            }
        }
        if (this.board.flat().every(cell => cell !== "")) return "tie";
        return null;
    }

    aiMove() {
        if (this.gameOver) return;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (this.board[r][c] === "") {
                    this.board[r][c] = "O";
                    const clockIndex = this.clocks.findIndex(clock => clock.row === r && clock.col === c);
                    if (clockIndex !== -1) {
                        this.clocks[clockIndex].hide();
                        this.clocks_on = this.clocks_on.filter(i => i !== clockIndex);
                    }
                    this.drawBoard();
                    return;
                }
            }
        }
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
        const row = clock.row;
        const col = clock.col;
        if (this.board[row][col] !== "") return;
        this.board[row][col] = "X";
        clock.hide();
        this.clocks_on = this.clocks_on.filter(i => i !== clock_index);
        this.drawBoard();
        const result = this.checkWinner();
        if (result) {
            this.gameOver = true;
            this.status.textContent = result === "tie" ? "It's a tie!" : result + " wins!";
            return;
        }
        this.playerTurn = false;
        this.status.textContent = "Computer is thinking...";
        setTimeout(() => {
            this.aiMove();
            const aiResult = this.checkWinner();
            if (aiResult) {
                this.gameOver = true;
                this.status.textContent = aiResult === "tie" ? "It's a tie!" : aiResult + " wins!";
            } else {
                setTimeout(() => {
                    this.playerTurn = true;
                    this.status.textContent = "Your turn! Press SPACE when hand points up";
                    this.bc = new BroderClocks(this);
                    this.bc.reset_for_new_selection();
                }, 1000);
            }
        }, 2000);
    }
}

const game = new TicTacToeGame();
