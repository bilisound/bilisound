import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
} from "./alert-dialog";
import type { AlertDialogProps } from "./alert-dialog";
import { Button } from "./button";

function AlertDialogDemo(props: AlertDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <View width="100%" minHeight={320} alignItems="flex-start">
      <Button onPress={() => setOpen(true)}>Open alert dialog</Button>
      <AlertDialog
        {...props}
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          props.onOpenChange?.(nextOpen);
        }}
      >
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>清空播放队列？</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogBody>
              <AlertDialogDescription>此操作无法撤销，当前队列中的全部音视频都会被移除。</AlertDialogDescription>
            </AlertDialogBody>
            <AlertDialogFooter>
              <AlertDialogCancel aria-label="取消" asChild>
                <Button variant="ghost">取消</Button>
              </AlertDialogCancel>
              <AlertDialogAction aria-label="确认清空" asChild>
                <Button>确认清空</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </View>
  );
}

const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  args: {
    onOpenChange: fn(),
    size: "md",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "full"],
    },
  },
  render: args => <AlertDialogDemo {...args} />,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
