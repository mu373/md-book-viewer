/**
 * Global Settings Configuration
 *
 * Configure global display options for the book viewer.
 * Changes require a rebuild to take effect.
 */

export const SETTINGS_CONFIG = {
  /**
   * Search highlight settings
   * Controls the visual appearance of search term highlighting
   */
  searchHighlight: {
    /** Enable/disable search term highlighting */
    enabled: true,
    /** Duration in seconds before highlight fades out */
    fadeDuration: 30,
    /** Highlight colors for light and dark themes */
    color: {
      light: '#fef08a',
      dark: '#854d0e',
    },
  },

  /**
   * Breadcrumb navigation settings
   * Controls the breadcrumb shown below page navigation
   */
  breadcrumb: {
    /** Show/hide breadcrumb navigation */
    enabled: true,
  },
}
