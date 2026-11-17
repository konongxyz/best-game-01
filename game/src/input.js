// Keyboard and mouse state for the game.
// main.js polls this each frame; nothing here knows about game rules.
// Keys are tracked by code so layout (WASD vs arrows) never matters.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 640, y: 360, down: false };
    this.clicked = false; // one-frame pulse on mouse press
    this.pressed = new Set(); // one-frame pulses for keys

    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
    });

    const toGame = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      };
    };
    canvas.addEventListener('mousemove', (e) => Object.assign(this.mouse, toGame(e)));
    canvas.addEventListener('mousedown', (e) => {
      Object.assign(this.mouse, toGame(e));
      this.mouse.down = true;
      this.clicked = true;
    });
    addEventListener('mouseup', () => (this.mouse.down = false));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Movement axes from either WASD or the arrow keys, normalised.
  moveAxis() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  // Called by main.js at the end of each frame to clear one-frame pulses.
  endFrame() {
    this.clicked = false;
    this.pressed.clear();
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }
}
