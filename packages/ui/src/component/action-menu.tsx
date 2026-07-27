import { useContext } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import type { SheetProps } from "@tamagui/sheet";
import { Sheet } from "@tamagui/sheet";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  ActionMenuBottomSurface,
  ActionMenuCell,
  ActionMenuFrame,
  ActionMenuHandle,
  ActionMenuIconSlot,
  ActionMenuItemFrame,
  ActionMenuItemText,
  ActionMenuList,
  ActionMenuOverlay,
} from "../recipe";
import { Icon } from "./icon";
import type { IconName } from "./icon";

export interface ActionMenuItem {
  action: () => void;
  disabled?: boolean;
  icon: IconName;
  iconSize?: number;
  id?: string;
  show?: boolean;
  text: string;
}

export interface ActionMenuProps extends Omit<SheetProps, "children"> {
  header?: ReactNode;
  menuItems: readonly ActionMenuItem[];
}

export function ActionMenu({
  dismissOnSnapToBottom = true,
  header,
  menuItems,
  modal = true,
  snapPointsMode = "fit",
  transition = "quick",
  unmountChildrenWhenHidden = true,
  ...props
}: ActionMenuProps) {
  const insets = useContext(SafeAreaInsetsContext);
  const visibleItems = menuItems.filter(item => item.show !== false);

  return (
    <Sheet
      modal={modal}
      snapPointsMode={snapPointsMode}
      dismissOnSnapToBottom={dismissOnSnapToBottom}
      transition={transition}
      unmountChildrenWhenHidden={unmountChildrenWhenHidden}
      {...props}
    >
      <ActionMenuOverlay
        unstyled
        animateOnly={["opacity"]}
        transition={{ opacity: "fade" }}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      >
        {Platform.OS === "android" ? <ActionMenuBottomSurface /> : null}
      </ActionMenuOverlay>
      <ActionMenuFrame
        unstyled
        paddingBottom={Math.max(insets?.bottom ?? 0, 8)}
        paddingLeft={Math.max(insets?.left ?? 0, 8)}
        paddingRight={Math.max(insets?.right ?? 0, 8)}
      >
        <ActionMenuHandle unstyled />
        {header}
        <ActionMenuList>
          {visibleItems.map((item, index) => (
            <ActionMenuCell key={item.id ?? `${item.text}-${index}`}>
              <ActionMenuItemFrame
                unstyled
                disabled={item.disabled}
                visuallyDisabled={item.disabled}
                onPress={item.action}
              >
                <ActionMenuIconSlot>
                  <Icon name={item.icon} size={item.iconSize ?? 18} aria-hidden />
                </ActionMenuIconSlot>
                <ActionMenuItemText>{item.text}</ActionMenuItemText>
              </ActionMenuItemFrame>
            </ActionMenuCell>
          ))}
        </ActionMenuList>
      </ActionMenuFrame>
    </Sheet>
  );
}
