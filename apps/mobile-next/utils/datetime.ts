export function formatDate(date: number | string | Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatSecond(secNum: number) {
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  const seconds = Math.floor(secNum - hours * 3600 - minutes * 60);

  if (secNum >= 3600) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type GapType = {
  max: number;
  suffix: string;
};

const gapType: GapType[] = [
  { max: 60, suffix: " 秒前" },
  { max: 3600, suffix: " 分钟前" },
  { max: 86400, suffix: " 小时前" },
  { max: 2592000, suffix: " 天前" },
  { max: 31536000, suffix: " 个月前" },
];

export function convertToRelativeTime(date: number) {
  const gap = (new Date().getTime() - date) / 1000;
  if (Math.abs(gap) < 10) {
    return "刚刚";
  }

  let i = 0;

  while (true) {
    let previousMax = 0;
    if (i > 0) {
      previousMax = gapType[i - 1].max;
    }

    if (gap >= previousMax && gap < gapType[i].max) {
      let divisor = 1;
      if (i > 0) {
        divisor = gapType[i - 1].max;
      }
      return Math.floor(gap / divisor) + gapType[i].suffix;
    } else if (gap > gapType[gapType.length - 1].max || gap < 0 || i >= gapType.length) {
      return new Date(date).toLocaleDateString();
    } else {
      i += 1;
    }
  }
}
