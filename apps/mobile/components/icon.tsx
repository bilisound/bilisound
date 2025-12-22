import React from "react";
import { SvgProps } from "react-native-svg";
import { cssInterop } from "nativewind";

// Import all SVG icons
import PauseIcon from "~/assets/icons/pause.svg";
import PlayIcon from "~/assets/icons/play.svg";
import CheckIcon from "~/assets/icons/check.svg";
import CloudIcon from "~/assets/icons/cloud.svg";
import FilterIcon from "~/assets/icons/filter.svg";
import XmarkIcon from "~/assets/icons/xmark.svg";
import PlusIcon from "~/assets/icons/plus.svg";
import ArrowLeftIcon from "~/assets/icons/arrow-left.svg";
import FileLinesIcon from "~/assets/icons/file-lines.svg";
import PaintbrushIcon from "~/assets/icons/paintbrush.svg";
import ImageIcon from "~/assets/icons/image.svg";
import ClockRotateLeftIcon from "~/assets/icons/clock-rotate-left.svg";
import EllipsisVerticalIcon from "~/assets/icons/ellipsis-vertical.svg";
import ListIcon from "~/assets/icons/list.svg";
import FileImportIcon from "~/assets/icons/file-import.svg";
import HouseIcon from "~/assets/icons/house.svg";
import GearIcon from "~/assets/icons/gear.svg";
import MusicIcon from "~/assets/icons/music.svg";
import DownloadIcon from "~/assets/icons/download.svg";
import TrashIcon from "~/assets/icons/trash.svg";
import PenIcon from "~/assets/icons/pen.svg";
import CircleInfoIcon from "~/assets/icons/circle-info.svg";
import ArrowUpFromBracketIcon from "~/assets/icons/arrow-up-from-bracket.svg";
import MagnifyingGlassIcon from "~/assets/icons/magnifying-glass.svg";
import ImagesIcon from "~/assets/icons/images.svg";
import FileExportIcon from "~/assets/icons/file-export.svg";
import CheckDoubleIcon from "~/assets/icons/check-double.svg";
import CircleHalfStrokeIcon from "~/assets/icons/circle-half-stroke.svg";
import CopyIcon from "~/assets/icons/copy.svg";
import TrashCanIcon from "~/assets/icons/trash-can.svg";
import ArrowRotateLeftIcon from "~/assets/icons/arrow-rotate-left.svg";
import LinkIcon from "~/assets/icons/link.svg";
import CloudArrowDownIcon from "~/assets/icons/cloud-arrow-down.svg";
import DatabaseIcon from "~/assets/icons/database.svg";
import CodeIcon from "~/assets/icons/code.svg";
import BugIcon from "~/assets/icons/bug.svg";
import ShareIcon from "~/assets/icons/share.svg";
import ListCheckIcon from "~/assets/icons/list-check.svg";
import AngleDownIcon from "~/assets/icons/angle-down.svg";
import EyeIcon from "~/assets/icons/eye.svg";
import FloppyDiskIcon from "~/assets/icons/floppy-disk.svg";
import CircleUpIcon from "~/assets/icons/circle-up.svg";
import AwardIcon from "~/assets/icons/award.svg";
import CircleStopIcon from "~/assets/icons/circle-stop.svg";
import CheckmarkCircleIcon from "~/assets/icons/checkmark-circle.svg";
import InformationCircleIcon from "~/assets/icons/information-circle.svg";
import AlertCircleIcon from "~/assets/icons/alert-circle.svg";
import CloseCircleIcon from "~/assets/icons/close-circle.svg";
import AlertSquareRoundedIcon from "~/assets/icons/alert-square-rounded.svg";
import RepeatOffIcon from "~/assets/icons/repeat-off.svg";
import RepeatIcon from "~/assets/icons/repeat.svg";
import RepeatOnceIcon from "~/assets/icons/repeat-once.svg";
import ArrowsRightIcon from "~/assets/icons/arrows-right.svg";
import ArrowsShuffleIcon from "~/assets/icons/arrows-shuffle.svg";
import SkipBackMiniFillIcon from "~/assets/icons/skip-back-mini-fill.svg";
import QrcodeScanIcon from "~/assets/icons/qrcode-scan.svg";
import GridFillIcon from "~/assets/icons/grid-fill.svg";
import SpeedRoundedIcon from "~/assets/icons/speed-rounded.svg";

// Icon name to component mapping
const iconMap: Record<string, React.FC<SvgProps>> = {
  // fa6-solid icons
  "fa6-solid:pause": PauseIcon,
  "fa6-solid:play": PlayIcon,
  "fa6-solid:check": CheckIcon,
  "fa6-solid:cloud": CloudIcon,
  "fa6-solid:filter": FilterIcon,
  "fa6-solid:xmark": XmarkIcon,
  "fa6-solid:plus": PlusIcon,
  "fa6-solid:arrow-left": ArrowLeftIcon,
  "fa6-solid:file-lines": FileLinesIcon,
  "fa6-solid:paintbrush": PaintbrushIcon,
  "fa6-solid:image": ImageIcon,
  "fa6-solid:clock-rotate-left": ClockRotateLeftIcon,
  "fa6-solid:ellipsis-vertical": EllipsisVerticalIcon,
  "fa6-solid:list": ListIcon,
  "fa6-solid:file-import": FileImportIcon,
  "fa6-solid:house": HouseIcon,
  "fa6-solid:gear": GearIcon,
  "fa6-solid:music": MusicIcon,
  "fa6-solid:download": DownloadIcon,
  "fa6-solid:trash": TrashIcon,
  "fa6-solid:pen": PenIcon,
  "fa6-solid:circle-info": CircleInfoIcon,
  "fa6-solid:arrow-up-from-bracket": ArrowUpFromBracketIcon,
  "fa6-solid:magnifying-glass": MagnifyingGlassIcon,
  "fa6-solid:images": ImagesIcon,
  "fa6-solid:file-export": FileExportIcon,
  "fa6-solid:check-double": CheckDoubleIcon,
  "fa6-solid:circle-half-stroke": CircleHalfStrokeIcon,
  "fa6-solid:copy": CopyIcon,
  "fa6-solid:trash-can": TrashCanIcon,
  "fa6-solid:arrow-rotate-left": ArrowRotateLeftIcon,
  "fa6-solid:link": LinkIcon,
  "fa6-solid:cloud-arrow-down": CloudArrowDownIcon,
  "fa6-solid:database": DatabaseIcon,
  "fa6-solid:code": CodeIcon,
  "fa6-solid:bug": BugIcon,
  "fa6-solid:share": ShareIcon,
  "fa6-solid:list-check": ListCheckIcon,
  "fa6-solid:angle-down": AngleDownIcon,
  "fa6-solid:eye": EyeIcon,
  "fa6-solid:floppy-disk": FloppyDiskIcon,
  "fa6-solid:circle-up": CircleUpIcon,
  "fa6-solid:award": AwardIcon,
  "fa6-solid:circle-stop": CircleStopIcon,

  // ion icons
  "ion:checkmark-circle": CheckmarkCircleIcon,
  "ion:information-circle": InformationCircleIcon,
  "ion:alert-circle": AlertCircleIcon,
  "ion:close-circle": CloseCircleIcon,

  // tabler icons
  "tabler:alert-square-rounded": AlertSquareRoundedIcon,
  "tabler:repeat-off": RepeatOffIcon,
  "tabler:repeat": RepeatIcon,
  "tabler:repeat-once": RepeatOnceIcon,
  "tabler:arrows-right": ArrowsRightIcon,
  "tabler:arrows-shuffle": ArrowsShuffleIcon,

  // ri icons
  "ri:skip-back-mini-fill": SkipBackMiniFillIcon,

  // uil icons
  "uil:qrcode-scan": QrcodeScanIcon,

  // mingcute icons
  "mingcute:grid-fill": GridFillIcon,

  // material-symbols icons
  "material-symbols:speed-rounded": SpeedRoundedIcon,
};

export interface IconProps extends Omit<SvgProps, "width" | "height"> {
  name: string;
  size?: number;
  className?: string;
}

function IconComponent({ name, size = 24, color, ...props }: IconProps) {
  const SvgIcon = iconMap[name];

  if (!SvgIcon) {
    console.warn(`Icon not found: ${name}`);
    return null;
  }

  return <SvgIcon width={size} height={size} color={color} {...props} />;
}

// Apply cssInterop for NativeWind support
cssInterop(IconComponent, {
  className: {
    target: "style",
    nativeStyleToProp: {
      color: true,
    },
  },
});

export const Icon = IconComponent;
