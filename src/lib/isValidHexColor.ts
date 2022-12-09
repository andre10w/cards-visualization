import { isValidString } from "./isValidString";

/**
 * @type {RegExp}
 */
export const RGX_COLOR_HEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * @method isValidHexColor
 * @param  {*} value
 * @return {Boolean}
 */
export const isValidHexColor = (value: any) => {
  if (!isValidString(value)) {
    return false;
  }
  return RGX_COLOR_HEX.test(value);
};
