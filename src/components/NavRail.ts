import { appConfig } from "@/config/app.config";

const ICONS: Record<string, string> = {
  globe:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>',
  list: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  "bar-chart":
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/></svg>',
};

export interface NavRailOptions {
  activeId: string;
  onSelect: (id: string) => void;
}

export function renderNavRail(options: NavRailOptions): HTMLElement {
  const rail = document.createElement("nav");
  rail.className = "jba-nav-rail";

  const brand = document.createElement("div");
  brand.className = "jba-nav-rail__brand";
  brand.innerHTML = `<span class="jba-nav-rail__brand-name">${appConfig.brand.name}</span>`;
  rail.appendChild(brand);

  const list = document.createElement("div");
  list.className = "jba-nav-rail__items";

  for (const item of appConfig.nav.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "jba-nav-rail__item";
    button.dataset.id = item.id;
    button.disabled = Boolean(item.disabled);
    button.setAttribute("aria-label", item.label);
    button.setAttribute("aria-current", item.id === options.activeId ? "page" : "false");
    if (item.id === options.activeId) {
      button.classList.add("is-active");
    }
    button.innerHTML = `${ICONS[item.icon] ?? ""}<span class="jba-nav-rail__item-label">${item.label}</span>`;
    if (!item.disabled) {
      button.addEventListener("click", () => options.onSelect(item.id));
    }
    list.appendChild(button);
  }
  rail.appendChild(list);

  const footer = document.createElement("div");
  footer.className = "jba-nav-rail__footer";
  footer.textContent = appConfig.brand.tagline;
  rail.appendChild(footer);

  return rail;
}
