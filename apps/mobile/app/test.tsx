import { useColorScheme } from "nativewind";
import { Box } from "~/components/ui/box";
import { Text } from "~/components/ui/text";
import { useState } from "react";
import { SystemBars, SystemBarStyle } from "react-native-edge-to-edge";
import {
  Button,
  Platform,
  Pressable,
  ScrollView,
  TouchableNativeFeedback,
  useColorScheme as useColorSchemeRN,
  View,
  StyleSheet,
} from "react-native";
import { shadow } from "~/constants/styles";
import { Layout } from "~/components/layout";
import init from "~/utils/init";

async function opfsTest() {
  if (Platform.OS !== "web") {
    return;
  }
  const opfsRoot = await navigator.storage.getDirectory();
  // A FileSystemDirectoryHandle whose type is "directory"
  // and whose name is "".
  console.log(opfsRoot);
  const fileHandle = await opfsRoot.getFileHandle("test.txt", { create: true });
  const contents = "Some text 123456";
  // Get a writable stream.
  const writable = await fileHandle.createWritable();
  // Write the contents of the file to the stream.
  await writable.write(contents);
  // Close the stream, which persists the contents.
  await writable.close();

  console.log(await navigator.storage.estimate());
}

export default function Test() {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<SystemBarStyle>("auto");
  const [nativeWindShadow, setNativeWindShadow] = useState(0);

  return (
    <Layout title={"组件测试"} leftAccessories={"BACK_BUTTON"}>
      <View className={"flex-1 bg-green-500 py-32"}>
        <ScrollView
          className={"flex-1 bg-blue-500"}
          contentContainerClassName={"py-8"}
          scrollIndicatorInsets={{
            top: 32,
            bottom: 32,
          }}
        >
          <Box
            className={`flex-1 justify-center items-center gap-2 ${theme === "auto" ? "bg-yellow-500" : ""} ${theme === "dark" ? "bg-blue-300" : ""} ${theme === "light" ? "bg-red-950" : ""}`}
          >
            <SystemBars style={theme} />
            <Text>{`color scheme: ${colorScheme.colorScheme} / ${useColorSchemeRN()}`}</Text>
            <Text>{`theme: ${theme}`}</Text>
            <Box className={"flex-row gap-4"}>
              <Button title={"auto"} onPress={() => setTheme("auto")} />
              <Button title={"light"} onPress={() => setTheme("light")} />
              <Button title={"dark"} onPress={() => setTheme("dark")} />
              <Button title={"force init"} onPress={init} />
              <Button title={"opfs test"} onPress={opfsTest} />
            </Box>
            <Box className={"flex-row gap-4"}>
              <Button title={"RN Shadow"} onPress={() => setNativeWindShadow(0)} />
              <Button title={"NW Shadow"} onPress={() => setNativeWindShadow(1)} />
              <Button title={"Off"} onPress={() => setNativeWindShadow(2)} />
            </Box>
            <Box className={"flex gap-4 py-4"}>
              <Pressable
                android_ripple={{
                  color: "#ffffff",
                }}
                className="bg-blue-200 w-48 h-16 rounded-lg justify-center items-center"
              >
                <Text>Pressable</Text>
              </Pressable>
              <TouchableNativeFeedback
                style={{
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: "green",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                background={TouchableNativeFeedback.Ripple("#ffffff", false)}
              >
                <Text>TouchableNativeFeedback</Text>
              </TouchableNativeFeedback>
            </Box>
            <View style={styles.container}>
              <View style={styles.textContainer}>
                <Text>Broken behavior without foreground:</Text>
              </View>
              <Pressable
                android_ripple={{ color: "blue", foreground: false }}
                onPress={() => console.log("Pressed ripple bg!")}
              >
                <View style={styles.pressableContent}>
                  <Text>Broken ripple without foreground</Text>
                </View>
              </Pressable>

              <View style={styles.textContainer}>
                <Text>Normal behavior when using foreground true</Text>
              </View>
              <Pressable
                android_ripple={{ color: "blue", foreground: true }}
                onPress={() => console.log("Pressed ripple fg!")}
              >
                <View style={styles.pressableContent}>
                  <Text>Working on foreground</Text>
                </View>
              </Pressable>
            </View>
            {nativeWindShadow === 0 && (
              <Box className={"gap-12 mt-8 pb-8"} key={"test-0"}>
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} style={{ boxShadow: shadow.sm }} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} style={{ boxShadow: shadow.DEFAULT }} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} style={{ boxShadow: shadow.md }} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} style={{ boxShadow: shadow.lg }} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} style={{ boxShadow: shadow.xl }} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} style={{ boxShadow: shadow["2xl"] }} />
              </Box>
            )}
            {nativeWindShadow === 1 && (
              <Box className={"gap-12 mt-8"} key={"test-1"}>
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-sm"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-md"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-lg"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-xl"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-2xl"} />
              </Box>
            )}
            {nativeWindShadow === 2 && (
              <Box className={"gap-12 mt-8"} key={"test-2"}>
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-test"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg shadow-test2"} />
                <Box
                  className={"bg-blue-500 w-48 h-16 rounded-lg"}
                  style={{ boxShadow: "0px 0px 40px rgba(157, 66, 200, 1)" }}
                />
                <Box
                  className={"bg-blue-500 w-48 h-16 rounded-lg"}
                  style={{
                    boxShadow: "0px 0px 40px rgba(157, 200, 8, 1), 10px -10px 20px rgba(221, 32, 21, 1)",
                  }}
                />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} />
                <Box className={"bg-blue-500 w-48 h-16 rounded-lg"} />
              </Box>
            )}
          </Box>
        </ScrollView>
      </View>
    </Layout>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF9F5",
    margin: 16,
  },
  textContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  pressableContent: {
    width: "100%",
    height: 250,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
});
