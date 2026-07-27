import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { Button } from "./button";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPortal,
  ModalTitle,
} from "./modal";
import type { ModalProps } from "./modal";

function ModalDemo(props: ModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <View width="100%" minHeight={320} alignItems="flex-start">
      <Button onPress={() => setOpen(true)}>Open modal</Button>
      <Modal
        {...props}
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          props.onOpenChange?.(nextOpen);
        }}
      >
        <ModalPortal>
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>播放设置</ModalTitle>
            </ModalHeader>
            <ModalBody marginTop="$3" marginBottom="$5">
              <ModalDescription>普通模态框适合承载需要用户完成或确认的内容。</ModalDescription>
            </ModalBody>
            <ModalFooter>
              <ModalClose aria-label="取消" asChild>
                <Button variant="ghost" color="neutral">
                  取消
                </Button>
              </ModalClose>
              <ModalClose aria-label="完成" asChild>
                <Button>完成</Button>
              </ModalClose>
            </ModalFooter>
          </ModalContent>
        </ModalPortal>
      </Modal>
    </View>
  );
}

const meta = {
  title: "Components/Modal",
  component: Modal,
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
  render: args => <ModalDemo {...args} />,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
