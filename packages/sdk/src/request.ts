import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

export interface BiliRequestConfig extends AxiosRequestConfig {
  disableWbi?: boolean;
}

export interface InternalBiliRequestConfig extends InternalAxiosRequestConfig {
  disableWbi?: boolean;
}
