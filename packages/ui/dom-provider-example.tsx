"use dom";

import { useState } from "react";
import type { DOMProps } from "expo/dom";
import { Text, View } from "@tamagui/core";

import { BilisoundDomProvider, Button } from "@bilisound/ui";
import type { DomTheme } from "@bilisound/ui";

export interface DomProviderExampleProps {
  dom?: DOMProps;
  theme: DomTheme;
}

export default function DomProviderExample({ theme }: DomProviderExampleProps) {
  const [pressCount, setPressCount] = useState(0);

  return (
    <BilisoundDomProvider {...theme}>
      <View
        id="dom-provider-example-card"
        width="100%"
        gap="$3"
        padding="$4"
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$border"
        borderRadius="$3"
      >
        <Text color="$text" fontFamily="$heading" fontSize="$lg" fontWeight="600">
          Expo DOM + BilisoundDomProvider
        </Text>
        <Text color="$textMuted" fontFamily="$body" fontSize="$sm" lineHeight="$sm">
          This text and button render inside the DOM component while using the same Tamagui tokens and theme.
        </Text>
        <Text color="$text" fontFamily="$body" fontSize="$sm">
          Button pressed: {pressCount}
        </Text>
        <Button onPress={() => setPressCount(count => count + 1)}>Press inside DOM</Button>
      </View>
    </BilisoundDomProvider>
  );
}
