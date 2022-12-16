import { isValidObject } from "./isValidObject";
import { isValidArray } from "./isValidArray";
import { isValidURL } from "./isValidURL";
import {
  CARD_TYPE_IMAGE,
  CARD_TYPE_VOLUMETRIC_VIDEO,
  CARD_TYPE_CHROMA_KEY_VIDEO,
  CARD_TYPE_VIDEO,
  CARD_TYPE_MODEL,
  CARD_TYPE_HAND_TRACKING,
} from "./constants";

export const getImageSourceFromPoster = (poster) => {
  if (!isValidObject(poster)) {
    return null;
  }
  const { cdnUrl } = poster;
  if (isValidURL(cdnUrl)) {
    return poster;
  }
  return null;
};

export const getImageSourceFromImageSource = (imageSource) => {
  if (!isValidObject(imageSource)) {
    return null;
  }
  const { cdnUrl } = imageSource;
  if (isValidURL(cdnUrl)) {
    return imageSource;
  }
  return null;
};

export const getImageSourceFromPosters = (posters) => {
  if (!isValidArray(posters)) {
    return null;
  }
  for (const poster of posters) {
    const imageSource = getImageSourceFromPoster(poster);
    if (isValidObject(imageSource)) {
      return poster;
    }
  }
  return null;
};

export const getImageSourceFromSourceWithPosters = (source) => {
  if (!isValidObject(source)) {
    return null;
  }
  const { posters } = source;
  if (!isValidArray(posters)) {
    return null;
  }
  const imageSource = getImageSourceFromPosters(posters);
  if (isValidObject(imageSource)) {
    return imageSource;
  }
  return null;
};

export const getImageSourceFromImageSources = (imageSources: any) => {
  if (!isValidArray(imageSources)) {
    return null;
  }
  for (const imageSource of imageSources) {
    const source = getImageSourceFromImageSource(imageSource);
    if (isValidURL(source.cdnUrl)) {
      return source;
    }
  }
  return null;
};

export const getImageSourceFromSources = (sources: any) => {
  if (!isValidArray(sources)) {
    return null;
  }
  for (const source of sources) {
    const imageSource = getImageSourceFromSourceWithPosters(source);
    if (isValidObject(imageSource)) {
      return imageSource;
    }
  }
  return null;
};

export const getThingBackgroundImageSource = (thing) => {
  const { imageBackground, videoBackground } = thing;

  let imageSource = null;

  if (isValidObject(imageBackground)) {
    imageSource = getImageSourceFromImageSource(imageBackground);
  } else if (isValidObject(videoBackground)) {
    // imageSource = getImageFromSourceWithPosters(videoBackground);
    imageSource = getImageSourceFromSourceWithPosters(videoBackground);
  }
  return imageSource;
};

export const getCardBackgroundImageSource = (card) => {
  const { imageBackground, videoBackground } = card;

  let imageSource = null;

  if (isValidObject(imageBackground)) {
    imageSource = getImageSourceFromImageSource(imageBackground);
  } else if (isValidObject(videoBackground)) {
    imageSource = getImageSourceFromSourceWithPosters(videoBackground);
  }
  return imageSource;
};

export const getCardImageSource = (card: any) => {
  const { cardType, payload } = card;

  let imageSource = null;

  if (cardType === CARD_TYPE_IMAGE) {
    const { sources } = payload;
    imageSource = getImageSourceFromImageSources(sources);
  } else if (cardType === CARD_TYPE_VOLUMETRIC_VIDEO) {
    const { poster } = payload;
    imageSource = getImageSourceFromPoster(poster);
  } else if (
    cardType === CARD_TYPE_VIDEO ||
    cardType === CARD_TYPE_MODEL ||
    cardType === CARD_TYPE_HAND_TRACKING ||
    cardType === CARD_TYPE_CHROMA_KEY_VIDEO
  ) {
    const { sources } = payload;

    // imageSource = getImageSourceFromSources(sources);
    imageSource = getImageSourceFromImageSources(sources);
  }

  return imageSource;
};
