import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_MESH_COLOR,
  CARD_TYPE_IMAGE,
  CARD_TYPE_VIDEO,
  SHAPE_SIZE,
  SHAPE_PRESET_CUSTOM_MODEL,
  SHAPE_PRESET_SPHERE,
  SHAPE_PRESET_CUBE,
  SHAPE_PRESET_CYLINDER,
  SHAPE_PRESET_CONE,
  SHAPE_PRESET_TORUS,
  CARD_WIDTH,
  CARD_HEIGHT,
} from "../lib/constants";

export const fixTexture = (
  texture: any,
  width: number = texture.image.width,
  height: number = texture.image.height
) => {
  const planeAspect = CARD_WIDTH / CARD_HEIGHT;
  const imageAspect = width / height;
  const aspect = imageAspect / planeAspect;

  aspect > 1
    ? ((texture.repeat.y = aspect), (texture.offset.y = (1 - aspect) / 2))
    : ((texture.repeat.x = 1 / aspect), (texture.offset.x = (1 - 1 / aspect) / 2));
};
