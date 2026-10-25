<script lang="jsx">
import { defineComponent } from "vue";
import BrandLogo from "../common/BrandLogo.vue";
import UserAvatar from "../common/UserAvatar.vue";
import { createCompatRender, useEffect } from "../../utils/vueCompat";
import { LogOut, X } from "lucide-vue-next";
import { getNavigationItems } from "../../data/navigation";
const Sidebar = ({
  currentRole,
  activeSection,
  onSelectSection,
  isOpen,
  onToggle,
  currentUser,
  onOpenProfile,
  onLogoutClick,

}) => {
  const navItems = getNavigationItems(currentRole);
  useEffect(() => {
    if (!isOpen || window.innerWidth > 640) return;
    const previousFocus = document.activeElement;
    const timer = setTimeout(() => document.querySelector('.sidebar-close')?.focus(), 0);
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onToggle(); }
      if (event.key === 'Tab') {
        const buttons = [...document.querySelectorAll('#workspace-sidebar button')].filter(button => button.getClientRects().length && !button.disabled);
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', handleKey); previousFocus?.focus?.(); };
  }, [isOpen]);
    return <>
    <button class="sidebar-backdrop" aria-label="បិទម៉ឺនុយ" aria-hidden={!isOpen} tabIndex={-1} onClick={onToggle}/>
    <aside id="workspace-sidebar" class="app-sidebar" aria-label="ម៉ឺនុយចម្បង">
      <div class="sidebar-brand"><BrandLogo/><button class="icon-button sidebar-close" aria-label="បិទម៉ឺនុយ" onClick={onToggle}><X size={20}/></button></div>
      <nav class="sidebar-nav" aria-label="ម៉ឺនុយចម្បង">{navItems.map(item => {
        const Icon = item.icon;
        const label = item.labelKh;
        return <div key={item.id}>{(item === navItems[0] || item.id.includes('profile')) && <p class="sidebar-group-title" aria-hidden={!isOpen}>{item.id.includes('profile') ? 'គណនី' : 'កន្លែងការងារ'}</p>}<button id={`sidebar-nav-${item.id}`} class={activeSection === item.id ? 'active' : ''} aria-current={activeSection === item.id ? 'page' : undefined} aria-label={label} title={label} onClick={() => { onSelectSection(item.id); if (window.innerWidth <= 640 && isOpen) onToggle(); }}><Icon size={18}/><span aria-hidden={!isOpen}>{label}</span></button></div>;
      })}</nav>
      <div class="sidebar-user"><button id="sidebar-bottom-profile-btn" onClick={() => { if (window.innerWidth <= 640 && isOpen) onToggle(); onOpenProfile(); }} title="ព័ត៌មានគណនី"><UserAvatar src={currentUser?.avatar} name={currentUser?.nameKh || currentUser?.nameEn} size={38}/><span aria-hidden={!isOpen}><strong>{currentUser.nameKh}</strong><small>{currentRole === 'ADMIN' ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ' : currentRole === 'MANAGER' ? 'ប្រធានផ្នែក' : 'បុគ្គលិក'}</small></span></button><button id="sidebar-bottom-logout-btn" class="icon-button danger-link" onClick={() => { if (window.innerWidth <= 640 && isOpen) onToggle(); onLogoutClick(); }} aria-label="ចាកចេញពីប្រព័ន្ធ"><LogOut size={16}/></button></div>
    </aside>
  </>;
};
export default defineComponent({
  name: "Sidebar",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return createCompatRender(Sidebar, () => attrs);
  }
});
</script>

