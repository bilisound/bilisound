import useDownloadStore from "~/store/download";
import { getCacheAudioPath } from "~/utils/file";
import * as FileSystem from "expo-file-system";
import { filesize } from "filesize";
import { getBilisoundResourceUrl } from "~/api/bilisound";
import log from "~/utils/logger";
import useSettingsStore from "~/store/settings";
import { getVideoUrl } from "~/business/constant-helper";
import { USER_AGENT_BILIBILI } from "~/constants/network";
import { cacheStatusStorage } from "~/storage/cache-status";
import { extractAudioFile } from "~/business/mp4";
import { File } from "expo-file-system/next";

export function addDownloadTask(bvid: string, episode: number, title: string) {
  const prefix = `[${bvid} / ${episode}] `;
  const { addDownloadItem, downloadList } = useDownloadStore.getState();

  const playingRequest = {
    id: bvid,
    episode,
  };
  const id = `${playingRequest.id}_${playingRequest.episode}`;

  // 避免重复操作
  if (downloadList.has(id)) {
    log.debug(prefix + "已经有相同任务在处理");
    return false;
  }
  // 待检查的本地音频路径（包括从视频提取的音频）
  const checkUrl = getCacheAudioPath(playingRequest.id, playingRequest.episode, false);

  if (cacheStatusStorage.getBoolean(playingRequest.id + "_" + playingRequest.episode)) {
    log.debug(prefix + "本地缓存有对应内容记录，不需要下载");
    return false;
  }

  log.debug(prefix + "本地缓存无对应内容，开始请求网络资源");
  // 在状态管理器创建下载任务
  const startTime = new Date().getTime();
  addDownloadItem(id, {
    title,
    id: playingRequest.id,
    episode: playingRequest.episode,
    path: checkUrl,
    startTime,
    progress: {
      totalBytesExpectedToWrite: 0,
      totalBytesWritten: 0,
    },
    progressOld: {
      totalBytesExpectedToWrite: 0,
      totalBytesWritten: 0,
    },
    updateTime: startTime,
    updateTimeOld: startTime,
    status: 0,
  });
  return true;
}

export async function downloadResource(bvid: string, episode: number) {
  const prefix = `[${bvid} / ${episode}] `;
  const { updateDownloadItemPartial, removeDownloadItem } = useDownloadStore.getState();

  const playingRequest = {
    id: bvid,
    episode,
  };
  const id = `${playingRequest.id}_${playingRequest.episode}`;

  updateDownloadItemPartial(id, {
    status: 1,
    claimed: true,
  });

  // 待检查的本地音频路径（包括从视频提取的音频）
  const checkUrl = getCacheAudioPath(playingRequest.id, playingRequest.episode, false);

  // 获取源地址
  const { url, isAudio } = await getBilisoundResourceUrl(
    playingRequest.id,
    playingRequest.episode,
    useSettingsStore.getState().filterResourceURL,
  );

  if (!useDownloadStore.getState().downloadList.has(id)) {
    log.info(prefix + "操作取消");
    return;
  }

  // 待下载资源地址（可能是音频或视频）
  const downloadTargetFileUrl = getCacheAudioPath(playingRequest.id, playingRequest.episode, true);

  // 下载处理
  const beginTime = global.performance.now();
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    downloadTargetFileUrl,
    {
      headers: {
        referer: getVideoUrl(playingRequest.id, playingRequest.episode),
        "user-agent": USER_AGENT_BILIBILI,
      },
      cache: true,
    },
    cb => {
      // 更新状态管理器中的内容
      const old = useDownloadStore.getState().downloadList.get(id);
      if (!old) {
        log.info(prefix + "在下载过程中操作取消");
        downloadResumable.cancelAsync();
        return;
      }
      updateDownloadItemPartial(id, {
        progress: cb,
        progressOld: old.progress,
        updateTime: new Date().getTime(),
        updateTimeOld: old.updateTime,
      });
    },
  );
  await downloadResumable.downloadAsync();
  if (!useDownloadStore.getState().downloadList.has(id)) {
    log.info(prefix + "操作取消");
    return;
  }

  const endTime = global.performance.now();
  const info = await FileSystem.getInfoAsync(downloadTargetFileUrl);
  const fileSize = info?.exists ? info.size : 0;
  const runTime = (endTime - beginTime) / 1000;
  log.debug(prefix + `下载任务结束，用时: ${runTime.toFixed(3)}s, 平均下载速度: ${filesize(fileSize / runTime)}/s`);
  updateDownloadItemPartial(id, {
    status: 2,
  });

  if (isAudio) {
    await FileSystem.moveAsync({
      from: getCacheAudioPath(playingRequest.id, playingRequest.episode, true),
      to: checkUrl,
    });
    cacheStatusStorage.set(playingRequest.id + "_" + playingRequest.episode, true);
    removeDownloadItem(id);
    return;
  }

  // 如果不是音频流，进行音视频分离操作
  log.info(prefix + "非音频流，进行音视频分离操作");

  // 提取 m4a
  try {
    extractAudioFile(new File(downloadTargetFileUrl), new File(checkUrl));
  } catch (e) {
    log.error(prefix + "视频转码失败！");
    log.error(`result：${e}`);
    throw new Error("视频处理失败");
  }

  // 收尾
  log.debug(prefix + "删除不再需要的视频文件");
  await FileSystem.deleteAsync(downloadTargetFileUrl);
  cacheStatusStorage.set(playingRequest.id + "_" + playingRequest.episode, true);
  removeDownloadItem(id);
}

export async function downloadResourceNow(bvid: string, episode: number, title: string) {
  const ok = addDownloadTask(bvid, episode, title);
  if (!ok) {
    return;
  }
  return downloadResource(bvid, episode);
}
