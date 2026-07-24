import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { fn } from "storybook/test";

import { Checkbox } from "./checkbox";
import type { CheckboxProps } from "./checkbox";

function InteractiveCheckbox({ checked = false, onCheckedChange, ...props }: CheckboxProps) {
  const [value, setValue] = useState(checked);

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  return (
    <Checkbox
      {...props}
      checked={value}
      onCheckedChange={nextValue => {
        setValue(nextValue);
        onCheckedChange?.(nextValue);
      }}
    />
  );
}

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "A labeled boolean control with keyboard, checked, and disabled states.",
      },
    },
  },
  args: {
    checked: false,
    label: "Receive email notifications",
    onCheckedChange: fn(),
  },
  render: args => <InteractiveCheckbox {...args} />,
} satisfies Meta<typeof Checkbox>;

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
