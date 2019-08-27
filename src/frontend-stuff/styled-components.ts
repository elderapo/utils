import * as React from "react";
import * as styledComponents from "styled-components";

export const initializeStyledComponents = <ITheme extends {} = {}>() => {
  const mod = {
    default: styledComponents.default,
    css: styledComponents.css,
    createGlobalStyle: styledComponents.createGlobalStyle,
    keyframes: styledComponents.keyframes,
    ThemeProvider: styledComponents.ThemeProvider
  } as styledComponents.ThemedStyledComponentsModule<ITheme>;

  const ThemeConsumer = styledComponents.ThemeConsumer as React.ExoticComponent<
    React.ConsumerProps<ITheme>
  >;

  const useTheme = () => {
    const theme = React.useContext(styledComponents.ThemeContext);

    return theme as ITheme;
  };

  return {
    styled: mod.default,
    css: mod.css,
    createGlobalStyle: mod.createGlobalStyle,
    keyframes: mod.keyframes,
    ThemeProvider: mod.ThemeProvider,
    ThemeConsumer,
    useTheme
  };
};

export interface IStyledComponentProps {
  style?: React.CSSProperties;
  className?: string;
}
