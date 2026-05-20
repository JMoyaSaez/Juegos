window.SKY = window.SKY || {};

window.SKY.Input = (() => {
  const keys = {
    left: false,
    right: false,
    up: false,       // aim up, not jump. This prevents diagonal fire from triggering a jump.
    down: false,
    run: false,
    fire: false,
    jump: false,
  };

  const pressed = new Set();
  let bound = false;

  function preventGameplayScroll(e) {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyZ','KeyX','KeyJ','ControlLeft','ControlRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  function isJumpCode(code) {
    return code === 'KeyZ' || code === 'KeyJ' || code === 'ControlLeft' || code === 'ControlRight';
  }

  function bind() {
    if (bound) return;
    bound = true;

    window.addEventListener('keydown', e => {
      preventGameplayScroll(e);

      if (e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
      if (e.code === 'ArrowDown') keys.down = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = true;
      if (e.code === 'Space' || e.code === 'KeyX') keys.fire = true;
      if (isJumpCode(e.code)) keys.jump = true;

      if (!e.repeat) pressed.add(e.code);
    }, { passive:false });

    window.addEventListener('keyup', e => {
      if (e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
      if (e.code === 'ArrowDown') keys.down = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false;
      if (e.code === 'Space' || e.code === 'KeyX') keys.fire = false;
      if (isJumpCode(e.code)) keys.jump = false;
    }, { passive:false });
  }

  function wasPressed(code) {
    return pressed.has(code);
  }

  function wasJumpPressed() {
    return pressed.has('KeyZ') || pressed.has('KeyJ') || pressed.has('ControlLeft') || pressed.has('ControlRight');
  }

  function wasFirePressed() {
    return pressed.has('Space') || pressed.has('KeyX');
  }

  function endFrame() {
    pressed.clear();
  }

  return { keys, bind, wasPressed, wasJumpPressed, wasFirePressed, endFrame };
})();
