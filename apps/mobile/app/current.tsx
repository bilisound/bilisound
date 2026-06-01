import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InsidePageContext } from "~/components/main-bottom-sheet/utils";
import { PlayerControl } from "~/components/main-bottom-sheet/components/player-control";

export default function Page() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={"flex-1"}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <InsidePageContext.Provider value={true}>
        <PlayerControl />
      </InsidePageContext.Provider>
    </View>
  );
}
