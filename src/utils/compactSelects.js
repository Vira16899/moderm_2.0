/** Enhance native selects without changing their Vue bindings, values or validation. */
export function selectPopupPosition(rect, viewportWidth, viewportHeight) {
  const below = viewportHeight - rect.bottom - 12;
  const above = rect.top - 12;
  const upwards = below < 180 && above > below;
  const height = Math.max(60, Math.min(220, upwards ? above : below));
  const width = Math.min(Math.max(rect.width, 180), viewportWidth - 16);
  return { left: Math.max(8, Math.min(rect.left, viewportWidth - width - 8)), top: upwards ? Math.max(8, rect.top - height - 6) : rect.bottom + 6, width, height };
}

export function installCompactSelects(document) {
  const window = document.defaultView;
  let current = null, sequence = 0, typeahead = '', typedAt = 0;
  function close() {
    if (!current) return;
    const { select, popup, observer, original } = current;
    observer.disconnect();
    for (const [key, value] of Object.entries(original)) {
      if (value == null) select.removeAttribute(key); else select.setAttribute(key, value);
    }
    popup.remove(); current = null; typeahead = '';
  }
  function active(index) {
    if (!current) return;
    const { select, popup, rows } = current;
    current.index = index;
    rows.forEach((row, i) => row.classList.toggle('active', i === index));
    select.setAttribute('aria-activedescendant', rows[index]?.id || '');
    rows[index]?.scrollIntoView({ block: 'nearest' });
  }
  function choose(index) {
    if (!current) return;
    const { select, options } = current;
    if (!options[index] || options[index].disabled) return;
    select.selectedIndex = index;
    close();
    select.dispatchEvent(new window.Event('input', { bubbles: true }));
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    select.focus({ preventScroll: true });
  }
  function open(select) {
    close();
    if (select.disabled || select.matches(':disabled') || select.multiple || select.size > 1 || !select.options.length) return;
    select.focus({ preventScroll: true });
    const popup = document.createElement('div');
    popup.className = 'shared-select-popup';
    popup.id = `shared-select-${++sequence}`;
    popup.setAttribute('popover', 'manual');
    popup.setAttribute('role', 'listbox');
    popup.setAttribute('aria-label', select.getAttribute('aria-label') || select.labels?.[0]?.textContent || 'ជ្រើសរើស');
    const options = [...select.options];
    const rows = options.map((option, index) => {
      const row = document.createElement('div');
      row.className = 'shared-select-option'; row.id = `${popup.id}-${index}`;
      row.textContent = option.label;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(option.selected));
      const disabled = option.disabled || option.parentElement?.disabled;
      row.setAttribute('aria-disabled', String(Boolean(disabled)));
      row.addEventListener('pointerdown', event => event.preventDefault());
      row.addEventListener('pointermove', () => { if (!disabled) active(index); });
      row.addEventListener('click', () => { if (!disabled) choose(index); });
      popup.append(row); return row;
    });
    const original = Object.fromEntries(['aria-expanded', 'aria-controls', 'aria-activedescendant'].map(key => [key, select.getAttribute(key)]));
    const observer = new window.MutationObserver(() => {
      if (!select.isConnected || select.matches(':disabled')) close();
    });
    current = { select, popup, options, rows, original, observer, index: select.selectedIndex };
    select.setAttribute('aria-expanded', 'true'); select.setAttribute('aria-controls', popup.id);
    (select.closest('dialog') || document.body).append(popup);
    const position = selectPopupPosition(select.getBoundingClientRect(), window.innerWidth, window.innerHeight);
    Object.assign(popup.style, { left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px`, maxHeight: `${position.height}px` });
    popup.showPopover?.();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    active(Math.max(0, select.selectedIndex));
  }
  function targetSelect(event) { return event.target instanceof window.HTMLSelectElement ? event.target : null; }
  document.addEventListener('pointerdown', event => {
    const select = targetSelect(event);
    if (select && !select.multiple && select.size <= 1) {
      event.preventDefault();
      if (current?.select === select) close(); else open(select);
    } else if (current && !current.popup.contains(event.target)) close();
  }, true);
  document.addEventListener('click', event => {
    const select = targetSelect(event);
    if (select && !select.multiple && select.size <= 1) event.preventDefault();
  }, true);
  document.addEventListener('keydown', event => {
    const select = targetSelect(event);
    if (!select || select.multiple || select.size > 1 || select.matches(':disabled')) return;
    if (event.key === 'Tab' || event.key === 'Escape') { close(); return; }
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '];
    if (!keys.includes(event.key) && (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey)) return;
    event.preventDefault(); event.stopPropagation();
    const wasOpen = current?.select === select;
    if (!wasOpen) open(select);
    if (!current) return;
    if (event.key === 'Enter' || event.key === ' ') { if (wasOpen) choose(current.index); return; }
    const enabled = current.options.map((option, i) => !option.disabled && !option.parentElement?.disabled ? i : -1).filter(i => i >= 0);
    if (!enabled.length) return;
    if (event.key === 'Home') active(enabled[0]);
    else if (event.key === 'End') active(enabled.at(-1));
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const next = enabled.indexOf(current.index) + (event.key === 'ArrowDown' ? 1 : -1);
      active(enabled[Math.max(0, Math.min(enabled.length - 1, next))]);
    } else {
      const now = Date.now(); typeahead = now - typedAt < 700 ? typeahead + event.key : event.key; typedAt = now;
      const match = enabled.find(i => current.options[i].label.toLocaleLowerCase().startsWith(typeahead.toLocaleLowerCase()));
      if (match != null) active(match);
    }
  }, true);
  document.addEventListener('focusin', event => { if (current && event.target !== current.select && !current.popup.contains(event.target)) close(); });
  document.addEventListener('scroll', event => { if (current && !current.popup.contains(event.target)) close(); }, true);
  window.addEventListener('resize', close);
  window.addEventListener('pagehide', close);
}
