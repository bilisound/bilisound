import useErrorMessageStore from "~/store/error-message";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

export function ErrorToastHost() {
  const { message, setMessage } = useErrorMessageStore(state => ({
    message: state.message,
    setMessage: state.setMessage,
  }));

  useEffect(() => {
    if (message) {
      Toast.show({
        type: "error",
        text1: "无法播放这首歌曲",
        text2: message,
      });
      setMessage(null);
    }
  }, [message, setMessage]);

  return null;
}
