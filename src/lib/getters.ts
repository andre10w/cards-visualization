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
  SOURCE_TYPE_WEB,
} from "./constants";
import { isValidAndNotEmptyString } from "./isValidAndNotEmptyString";

export const getCardById = (scene: any, id: number) => {
  let selectedCard: any;

  scene.traverse((object: any) => {
    // if (object instanceof THREE.Group) {
    if (object.userData.cardId === id) {
      // if (!isValidArray(object.children)) return null;
      selectedCard = object;
      return;
    }
    // }
    return;
  });
  return selectedCard;
};

export const getCardPayload = (card) => {
  if (!isValidObject(card)) {
    return null;
  }

  const { payload } = card;
  if (isValidObject(payload)) {
    return payload;
  }
  return null;
};

export const getImageSourceFromPoster = (poster: any) => {
  if (!isValidObject(poster)) {
    return null;
  }
  const { cdnUrl } = poster;
  if (isValidURL(cdnUrl)) {
    return poster;
  }
  return null;
};

export const getImageSourceFromImageSource = (imageSource: any) => {
  if (!isValidObject(imageSource)) {
    return null;
  }
  const { cdnUrl } = imageSource;
  if (isValidURL(cdnUrl)) {
    return imageSource;
  }
  return null;
};

export const getImageSourceFromPosters = (posters: any) => {
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

export const getImageSourceFromSourceWithPosters = (source: any) => {
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

export const getThingBackgroundImageSource = (thing: any) => {
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

export const getCardBackgroundImageSource = (card: any) => {
  const { imageBackground, videoBackground } = card;

  let imageSource = null;

  if (isValidObject(imageBackground)) {
    imageSource = getImageSourceFromImageSource(imageBackground);
  } else if (isValidObject(videoBackground)) {
    imageSource = getImageSourceFromSourceWithPosters(videoBackground);
  }
  return imageSource;
};

export const getCardSources = (card) => {
  const payload = getCardPayload(card);
  if (!payload) {
    return null;
  }

  const { sources } = payload;
  if (!isValidArray(sources)) {
    return null;
  }

  return sources;
};

export const getImageSourceFromSourcesWithPosters = (sources) => {
  if (!isValidArray(sources)) {
    return null;
  }
  for (const source of sources) {
    const imageSource = getImageSourceFromSourceWithPosters(source);
    if (imageSource !== null) {
      return imageSource;
    }
  }
  return null;
};

export const getFirstSource = (card) => {
  const sources = getCardSources(card);
  if (!isValidArray(sources) || sources.length === 0) {
    return null;
  }
  return sources[0];
};

export const getCardImageSource = (card: any) => {
  if (!isValidObject(card)) {
    return null;
  }
  const { cardType, payload } = card;

  if (!isValidAndNotEmptyString(cardType) || !isValidObject(payload)) {
    return null;
  }

  let imageSource = null;

  if (cardType === CARD_TYPE_IMAGE) {
    const sources = getCardSources(card); // [ImageProperty]
    imageSource = getImageSourceFromImageSources(sources);
  } else if (cardType === CARD_TYPE_VOLUMETRIC_VIDEO) {
    const { poster } = payload; // ImageProperty
    imageSource = getImageSourceFromPoster(poster);
  } else if (
    cardType === CARD_TYPE_VIDEO ||
    cardType === CARD_TYPE_MODEL ||
    cardType === CARD_TYPE_HAND_TRACKING ||
    cardType === CARD_TYPE_CHROMA_KEY_VIDEO
  ) {
    const sources = getCardSources(card); // [ImageProperty]
    // CARD_TYPE_HAND_TRACKING: [ModelSourceProperty]
    // CARD_TYPE_MODEL: [ModelSourceProperty]
    // CARD_TYPE_VIDEO: [VideoProperty]
    // CARD_TYPE_CHROMA_KEY_VIDEO [VideoProperty]
    imageSource = getImageSourceFromSourcesWithPosters(sources);
  }

  if (imageSource !== null) {
    return imageSource;
  }

  // Use the background of the card as fallback

  return getCardBackgroundImageSource(card);
};

export const getSourceByType = (card, sourceType = SOURCE_TYPE_WEB) => {
  const sources = getCardSources(card);
  if (!isValidArray(sources) || sources.length === 0) {
    return null;
  }
  const source = sources.find(({ type }) => type === sourceType);
  if (isValidObject(source)) {
    return source;
  }
  return null;
};
