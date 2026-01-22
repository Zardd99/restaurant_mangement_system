import { SidebarSection, SidebarItem } from "./types";

export class SidebarCoordinator {
  private sections: SidebarSection[];

  constructor(sections: SidebarSection[]) {
    this.sections = sections;
  }

  getSections(): SidebarSection[] {
    return this.sections;
  }

  filterByUserRole(role: string): SidebarSection[] {
    // Implement role-based filtering
    return this.sections.map((section) => ({
      ...section,
      content: section.items.filter((item) => {
        // Add role-based filtering logic here
        return true;
      }),
    }));
  }

  findItemByPath(path: string): SidebarItem | null {
    for (const section of this.sections) {
      1;
      for (const item of section.items || section.items || []) {
        if (item.link === path) {
          return item;
        }
        if (item.children) {
          const found = item.children.find((child) => child.link === path);
          if (found) return found;
        }
      }
    }
    return null;
  }
}
