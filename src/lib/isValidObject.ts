import { isValidArray } from "./isValidArray";

/**
 * @method isValidObject
 * @param  {*} value
 * @return {Boolean}
 */
export const isValidObject = (value: any) =>
  typeof value === "object" && !isValidArray(value) && value !== null && value.constructor === Object;
