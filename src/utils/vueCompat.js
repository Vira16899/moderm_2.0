import { onMounted, onUnmounted, ref } from "vue";
let currentFrame = null;
const sameDeps = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((item, index) => Object.is(item, b[index]));
};
function useState(initial) {
  if (!currentFrame) {
    throw new Error("useState must be called during component render.");
  }
  const frame = currentFrame;
  const index = frame.cursor++;
  if (frame.states.length <= index) {
    frame.states[index] = typeof initial === "function" ? initial() : initial;
  }
  const setState = (next) => {
    const previous = frame.states[index];
    frame.states[index] = typeof next === "function" ? next(previous) : next;
    frame.tick.value += 1;
  };
  return [frame.states[index], setState];
}
function useRef(initial) {
  if (!currentFrame) {
    throw new Error("useRef must be called during component render.");
  }
  const frame = currentFrame;
  const index = frame.refCursor++;
  if (frame.refs.length <= index) {
    frame.refs[index] = { current: initial };
  }
  return frame.refs[index];
}
function useEffect(effect, deps) {
  if (!currentFrame) {
    throw new Error("useEffect must be called during component render.");
  }
  const frame = currentFrame;
  const index = frame.effectCursor++;
  const slot = frame.effects[index];
  if (!slot) {
    frame.effects[index] = { deps, effect, hasRun: false };
    return;
  }
  if (!sameDeps(slot.deps, deps)) {
    slot.deps = deps;
    slot.effect = effect;
    if (frame.mounted) {
      if (typeof slot.cleanup === "function") slot.cleanup();
      slot.cleanup = effect();
      slot.hasRun = true;
    }
  }
}
function createCompatRender(component, getProps) {
  const frame = {
    cursor: 0,
    refCursor: 0,
    effectCursor: 0,
    states: [],
    refs: [],
    effects: [],
    mounted: false,
    tick: ref(0)
  };
  onMounted(() => {
    frame.mounted = true;
    frame.effects.forEach((slot) => {
      if (!slot.hasRun && slot.effect) {
        slot.cleanup = slot.effect();
        slot.hasRun = true;
      }
    });
  });
  onUnmounted(() => {
    frame.effects.forEach((slot) => {
      if (typeof slot.cleanup === "function") slot.cleanup();
    });
  });
  return () => {
    frame.tick.value;
    frame.cursor = 0;
    frame.refCursor = 0;
    frame.effectCursor = 0;
    currentFrame = frame;
    try {
      return component(getProps());
    } finally {
      currentFrame = null;
    }
  };
}
export {
  createCompatRender,
  useEffect,
  useRef,
  useState
};
