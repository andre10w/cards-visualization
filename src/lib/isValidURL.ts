import { isValidString } from "./isValidString";

/**
 * @type {RegExp}
 */
export const RGX_URL = /^(rtmp|https?:\/\/|mailto:|data:|tel:)/;

/**
 * @method isValidURL
 * @param  {*} value
 * @return {Boolean}
 */
export const isValidURL = (value: any) => {
  if (!isValidString(value)) {
    return false;
  }
  return RGX_URL.test(value);
};
