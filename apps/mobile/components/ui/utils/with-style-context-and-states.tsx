import React from "react";
import { cn, withStyleContext } from "@gluestack-ui/utils/nativewind-utils";

type ClassNameValue = string | string[] | undefined;

type WithStatesProps = {
  className?: ClassNameValue;
  states?: Record<string, boolean | undefined>;
};

const parseDataAttribute = (inputString: string) => {
  const regex = /^data-\\[(\\w+)=(\\w+)\\]:(.+)$/;
  const match = inputString.match(regex);
  if (match) {
    return {
      state: match[1],
      value: match[2],
      className: match[3],
    };
  }
  return {
    state: null,
    value: null,
    className: null,
  };
};

const stringToBoolean = (str: string) => str === "true";

const resolveDataAttribute = (className: string, states: Record<string, boolean | undefined>) => {
  if (className.includes("data-")) {
    const { state, value, className: stateClassName } = parseDataAttribute(className);
    if (state && value && states[state] === stringToBoolean(value)) {
      if (stateClassName?.includes("data-")) {
        return resolveDataAttribute(stateClassName, states);
      }
      return stateClassName;
    }
  }
};

const extractDataClassName = (className: ClassNameValue, states: Record<string, boolean | undefined>) => {
  const classNamesArray = typeof className === "string" ? className.split(" ") : className;
  if (!classNamesArray) return;
  let classNamesFinal = "";
  classNamesArray.forEach(classNameItem => {
    if (classNameItem.includes("data-")) {
      const resolvedClassName = resolveDataAttribute(classNameItem, states);
      classNamesFinal = cn(classNamesFinal, resolvedClassName);
    } else {
      classNamesFinal += ` ${classNameItem}`;
    }
  });
  return classNamesFinal;
};

export const withStyleContextAndStates = <T extends React.ComponentType<any>>(Component: T, scope = "Global") => {
  const ComponentWithStates = React.forwardRef<
    React.ElementRef<T>,
    React.ComponentPropsWithoutRef<T> & WithStatesProps
  >(({ className, states, ...props }, ref) => {
    const classNamesFinal = React.useMemo(() => {
      if (!className) return;
      return extractDataClassName(className, states ?? {});
    }, [className, states]);
    return <Component ref={ref} {...props} className={classNamesFinal} />;
  });

  return withStyleContext(ComponentWithStates as React.ComponentType<any>, scope);
};
