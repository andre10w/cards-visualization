import { isValidString } from './isValidString';

/**
 * Matches UUID v1 - v5 and `nil` UUID.
 * @type {RegExp}
 * @see https://stackoverflow.com/questions/136505/searching-for-uuids-in-text-with-regex
 */
export const RGX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089AB][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @method isValidUUID
 * @param  {*} value
 * @return {Boolean}
 */
export const isValidUUID = (value: any) => {
  if (!isValidString(value)) {
    return false;
  }
  return RGX_UUID.test(value);
};  
