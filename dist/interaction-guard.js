/*
 * Browser-default gesture protection requested for Math Atlas.
 * Do not stop event propagation: forms and the blackboard own their input.
 * Browser chrome, OS gestures and accessibility overrides remain outside the
 * authority of a web page.
 */
(() => {
  'use strict';
  const options = { capture: true, passive: false };
  const elementOf = target => target?.nodeType === 1 ? target : target?.parentElement;
  const isEditable = target => Boolean(elementOf(target)?.closest(
    'input, textarea, [contenteditable]:not([contenteditable="false"])'
  ));
  const isInk = target => Boolean(elementOf(target)?.closest('#blackboard'));
  const cancel = event => { if (event.cancelable) event.preventDefault(); };

  for (const type of ['contextmenu', 'dragstart', 'dblclick', 'gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, cancel, options);
  }

  document.addEventListener('selectstart', event => {
    if (!isEditable(event.target)) cancel(event);
  }, options);

  // Selection starts on the second/third mouse down, before dblclick fires.
  // Canvas pointer input is left completely intact.
  document.addEventListener('mousedown', event => {
    if (event.button === 0 && event.detail > 1 && !isInk(event.target)) cancel(event);
  }, options);

  document.addEventListener('selectionchange', () => {
    if (isEditable(document.activeElement)) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed &&
        !isEditable(selection.anchorNode) && !isEditable(selection.focusNode)) {
      selection.removeAllRanges();
    }
  });

  document.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) cancel(event);
  }, options);

  document.addEventListener('keydown', event => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      cancel(event);
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    if (['+', '=', '-', '_', '0', 'Add', 'Subtract'].includes(event.key) ||
        ['Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0'].includes(event.code)) {
      cancel(event);
    } else if (event.key.toLowerCase() === 'a' && !isEditable(event.target)) {
      cancel(event);
    }
  }, options);

  // Fallback for engines that do not fully honor touch-action. One-finger
  // scrolling, tapping to focus and the canvas's pointer events pass through.
  let touch = null;
  let lastTap = null;
  let multipleTouches = false;

  document.addEventListener('touchstart', event => {
    if (event.touches.length > 1) {
      multipleTouches = true;
      touch = lastTap = null;
      cancel(event);
      return;
    }
    if (multipleTouches || event.touches.length !== 1) return;
    const point = event.touches[0];
    touch = {
      id: point.identifier, x: point.clientX, y: point.clientY,
      time: event.timeStamp, target: event.target, moved: false
    };
  }, options);

  document.addEventListener('touchmove', event => {
    if (multipleTouches || event.touches.length > 1) {
      multipleTouches = true;
      touch = lastTap = null;
      cancel(event);
      return;
    }
    if (!touch || event.touches.length !== 1) return;
    const point = event.touches[0];
    if (Math.hypot(point.clientX - touch.x, point.clientY - touch.y) > 12) touch.moved = true;
  }, options);

  document.addEventListener('touchend', event => {
    if (multipleTouches) {
      cancel(event);
      if (!event.touches.length) multipleTouches = false;
      touch = lastTap = null;
      return;
    }
    if (!touch || event.touches.length) return;
    const point = Array.from(event.changedTouches).find(value => value.identifier === touch.id);
    const current = touch;
    touch = null;
    if (!point || current.moved || isInk(current.target) || event.timeStamp - current.time > 350) {
      lastTap = null;
      return;
    }
    const closeToLast = lastTap && current.target === lastTap.target &&
      event.timeStamp - lastTap.time <= 320 &&
      Math.hypot(point.clientX - lastTap.x, point.clientY - lastTap.y) <= 24;
    if (closeToLast) {
      cancel(event);
      lastTap = null;
    } else {
      lastTap = { x: point.clientX, y: point.clientY, time: event.timeStamp, target: current.target };
    }
  }, options);

  document.addEventListener('touchcancel', () => {
    touch = lastTap = null;
    multipleTouches = false;
  }, options);
})();
