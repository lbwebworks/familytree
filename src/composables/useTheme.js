import { ref } from 'vue';

const stored = localStorage.getItem('theme');
// Default to light if nothing stored
const isDark = ref(stored === 'dark');

function applyTheme(val) {
  if (val) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', val ? 'dark' : 'light');
}

applyTheme(isDark.value);

function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme(isDark.value);
}

export function useTheme() {
  return { isDark, toggleTheme };
}
