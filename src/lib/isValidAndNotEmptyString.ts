import { isValidString } from "./isValidString";

/**
 * @method isValidAndNotEmptyString
 * @param  {*} value
 * @return {Boolean}
 */
export const isValidAndNotEmptyString = (value: any) => isValidString(value) && value.trim().length > 0;
