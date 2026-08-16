import "styled-components";
import type { Theme } from "cherry-styled-components";

/**
 * styled-components ships `DefaultTheme` as an empty interface for apps to
 * fill in. Cherry does not augment it, so without this every
 * `${({ theme }) => theme.colors.dark}` in the extension would be a type error.
 */
declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
