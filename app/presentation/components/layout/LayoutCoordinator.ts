export class LayoutCoordinator {
  private isSidebarOpen = false;

  toggleSidebar(): boolean {
    this.isSidebarOpen = !this.isSidebarOpen;
    return this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  getSidebarState(): boolean {
    return this.isSidebarOpen;
  }

  // Navigation methods
  navigateTo(path: string): void {
    // In Next.js, this would use the router
    window.location.href = path;
  }

  handleLogout(): void {
    // Clear auth state
    // Redirect to login
    this.navigateTo("/login");
  }
}
