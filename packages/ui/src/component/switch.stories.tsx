import { useEffect, useState } from "react";
import { styled, Text, View } from "@tamagui/core";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { fn } from "storybook/test";

import { Switch, SwitchVisual } from "./switch";
import type { SwitchProps } from "./switch";

const SettingsButton = styled(View, {
  name: "SwitchStorySettingsButton",
  width: 320,
  minHeight: 56,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$4",
  paddingHorizontal: "$4",
  paddingVertical: "$3",
  borderWidth: 1,
  borderColor: "$border",
  borderRadius: 10,
  backgroundColor: "$surface",
  cursor: "pointer",
  hoverStyle: {
    borderColor: "$borderHover",
    backgroundColor: "$surfaceMuted",
  },
  focusVisibleStyle: {
    outlineColor: "$focusRing",
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineOffset: 2,
  },
});

const SettingsButtonLabel = styled(Text, {
  name: "SwitchStorySettingsButtonLabel",
  flex: 1,
  color: "$text",
  fontFamily: "$body",
  fontSize: "$base",
  lineHeight: "$base",
  fontWeight: "600",
});

function InteractiveSwitch({ checked = false, onCheckedChange, ...props }: SwitchProps) {
  const [value, setValue] = useState(checked);

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  return (
    <Switch
      {...props}
      checked={value}
      onCheckedChange={nextValue => {
        setValue(nextValue);
        onCheckedChange?.(nextValue);
      }}
    />
  );
}

function SettingsButtonExample() {
  const [checked, setChecked] = useState(true);

  return (
    <SettingsButton
      accessibilityLabel="Play videos continuously"
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      render="button"
      role="switch"
      aria-checked={checked}
      aria-label="Play videos continuously"
      tabIndex={0}
      onPress={() => setChecked(value => !value)}
    >
      <SettingsButtonLabel>Play videos continuously</SettingsButtonLabel>
      <SwitchVisual checked={checked} />
    </SettingsButton>
  );
}

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A headless Tamagui boolean control. Switch owns interaction semantics; SwitchVisual is accessibility-hidden for embedding in an existing control.",
      },
    },
  },
  args: {
    accessibilityLabel: "Autoplay",
    checked: false,
    onCheckedChange: fn(),
  },
  render: args => <InteractiveSwitch {...args} />,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

export const Uncontrolled: Story = {
  args: {
    checked: undefined,
    defaultChecked: true,
  },
  render: args => <Switch {...args} />,
};

export const VisualInsideButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "SwitchVisual contributes no nested role or focus target; the shaped settings button owns the switch semantics.",
      },
    },
  },
  render: () => <SettingsButtonExample />,
};
