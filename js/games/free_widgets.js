export class Clock {
    constructor(face_canvas, hand_canvas, x_pos, y_pos, radius, col) {
        this.face_canvas = face_canvas;
        this.hand_canvas = hand_canvas;
        this.x_pos = x_pos;
        this.y_pos = y_pos;
        this.radius = radius;
        this.angle = 0;
        this.col = col;
        this.highlighted = true;
        this.winner = false;
        this.visible = true;
    }

    draw_face() {
        if (!this.visible) return;

        this.face_canvas.beginPath();
        this.face_canvas.arc(this.x_pos, this.y_pos, this.radius, 0, 2 * Math.PI);
        this.face_canvas.fillStyle = "#ffffff";
        this.face_canvas.fill();

        if (this.winner) {
            this.face_canvas.strokeStyle = "#00ff00";
        } else if (this.highlighted) {
            this.face_canvas.strokeStyle = "#0056ff";
        } else {
            this.face_canvas.strokeStyle = "#000000";
        }
        this.face_canvas.lineWidth = this.radius / 5;
        this.face_canvas.stroke();
    }

    draw_hand(clear = true) {
        if (!this.visible) return;

        if (this.angle > Math.PI * 2) {
            this.angle = this.angle % (Math.PI * 2);
        }
        if (clear) {
            this.hand_canvas.clearRect(
                this.x_pos - this.radius, this.y_pos - this.radius,
                this.radius * 2, this.radius * 2
            );
        }

        this.hand_canvas.beginPath();
        this.hand_canvas.lineCap = "round";
        this.hand_canvas.moveTo(
            this.x_pos + Math.cos(this.angle) * this.radius * 0.7,
            this.y_pos + Math.sin(this.angle) * this.radius * 0.7
        );
        this.hand_canvas.lineTo(
            this.x_pos - Math.cos(this.angle) * this.radius * 0.1,
            this.y_pos - Math.sin(this.angle) * this.radius * 0.1
        );

        if (this.winner) {
            this.hand_canvas.strokeStyle = "#00ff00";
        } else if (this.highlighted) {
            this.hand_canvas.strokeStyle = "#0056ff";
        } else {
            this.hand_canvas.strokeStyle = "#000000";
        }
        this.hand_canvas.lineWidth = this.radius / 5;
        this.hand_canvas.stroke();

        this.hand_canvas.beginPath();
        this.hand_canvas.moveTo(this.x_pos, this.y_pos);
        this.hand_canvas.lineTo(this.x_pos, this.y_pos - this.radius * 0.925);
        this.hand_canvas.strokeStyle = "#ff0000";
        this.hand_canvas.lineWidth = this.radius / 10;
        this.hand_canvas.stroke();
    }

    hide() {
        this.visible = false;
        this.hand_canvas.clearRect(
            this.x_pos - this.radius - 5, this.y_pos - this.radius - 5,
            this.radius * 2 + 10, this.radius * 2 + 10
        );
        this.face_canvas.clearRect(
            this.x_pos - this.radius - 5, this.y_pos - this.radius - 5,
            this.radius * 2 + 10, this.radius * 2 + 10
        );
    }
}