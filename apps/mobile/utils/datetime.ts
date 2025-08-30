export function formatDate(date: number | string | Date, fmt = "yyyy-MM-dd hh:mm:ss") {
  date = new Date(date);
  const o = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };

  const testResultYear = /(y+)/.exec(fmt);
  if (testResultYear) fmt = fmt.replace(testResultYear[1], `${date.getFullYear()}`.slice(4 - testResultYear[1].length));
  (Object.keys(o) as (keyof typeof o)[]).forEach(k => {
    const testResult = new RegExp(`(${k})`).exec(fmt);
    if (testResult) {
      fmt = fmt.replace(testResult[1], testResult[1].length === 1 ? `${o[k]}` : `00${o[k]}`.slice(`${o[k]}`.length));
    }
  });
  return fmt;
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
