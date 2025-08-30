import { View } from "react-native";
import { InsidePageContext } from "~/components/main-bottom-sheet/utils";
import { PlayerControl } from "~/components/main-bottom-sheet/components/player-control";

export default function Page() {
  return (
    <View className={"p-safe flex-1"}>
      <InsidePageContext.Provider value={true}>
        <PlayerControl />
      </InsidePageContext.Provider>
    </View>
  );
}
