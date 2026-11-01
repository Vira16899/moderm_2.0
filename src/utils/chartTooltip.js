let sequence = 0;
const states = new WeakMap();
export function tooltipPosition(rect, width, height, viewportWidth, viewportHeight) {
  return {
    left: Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, viewportWidth - width - 8)),
    top: Math.max(8, Math.min(rect.top >= height + 16 ? rect.top - height - 10 : rect.bottom + 10, viewportHeight - height - 8)),
  };
}
export const chartTooltip = {
  mounted(element, binding) {
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-data-tooltip';
    tooltip.id = `chart-data-tooltip-${++sequence}`;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('popover', 'manual');
    tooltip.hidden = true;
    document.body.append(tooltip);
    const original = element.getAttribute('aria-describedby');
    const addedTab = !element.hasAttribute('tabindex') && !element.matches('button,a,input');
    if (addedTab) element.setAttribute('tabindex', '0');
    const state = { value: binding.value, visible: false };
    const paint = () => {
      tooltip.replaceChildren();
      const label = document.createElement('span'), value = document.createElement('strong');
      label.textContent = state.value?.label || '';
      value.textContent = state.value?.value ?? '';
      tooltip.append(label, value);
      const position = tooltipPosition(element.getBoundingClientRect(), tooltip.offsetWidth, tooltip.offsetHeight, window.innerWidth, window.innerHeight);
      tooltip.style.left = `${position.left}px`;
      tooltip.style.top = `${position.top}px`;
    };
    const show = () => {
      state.visible = true;
      tooltip.hidden = false;
      tooltip.showPopover?.();
      element.setAttribute('aria-describedby', [original, tooltip.id].filter(Boolean).join(' '));
      paint();
    };
    const hide = () => {
      state.visible = false;
      tooltip.hidePopover?.();
      tooltip.hidden = true;
      if (original) element.setAttribute('aria-describedby', original);
      else element.removeAttribute('aria-describedby');
    };
    const escape = event => { if (event.key === 'Escape') hide(); };
    const listeners = [['mouseenter', show], ['mouseleave', hide], ['focus', show], ['blur', hide], ['keydown', escape]];
    listeners.forEach(([event, handler]) => element.addEventListener(event, handler));
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    state.update = value => { state.value = value; if (state.visible) paint(); };
    state.destroy = () => {
      hide(); tooltip.remove();
      listeners.forEach(([event, handler]) => element.removeEventListener(event, handler));
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      if (addedTab) element.removeAttribute('tabindex');
    };
    states.set(element, state);
  },
  updated(element, binding) { states.get(element)?.update(binding.value); },
  beforeUnmount(element) { states.get(element)?.destroy(); states.delete(element); },
};
