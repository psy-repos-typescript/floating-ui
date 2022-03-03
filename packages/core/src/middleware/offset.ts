import type {Placement, Rect, Coords, Middleware, ElementRects} from '../types';
import {getAlignment} from '../utils/getAlignment';
import {getSide} from '../utils/getSide';
import {getMainAxisFromPlacement} from '../utils/getMainAxisFromPlacement';

type OffsetValue =
  | number
  | {
      /**
       * The axis that runs along the side of the floating element.
       */
      mainAxis?: number;
      /**
       * The axis that runs along the alignment of the floating element.
       */
      crossAxis?: number;
      /**
       * The offset of the alignment. A positive number will move the floating
       * element in the direction of the opposite edge that is aligned, while a
       * negative number the reverse.
       */
      alignmentOffset?: number;
    };
type OffsetFunction = (args: {
  floating: Rect;
  reference: Rect;
  placement: Placement;
}) => OffsetValue;

export type Options = OffsetValue | OffsetFunction;

export function convertValueToCoords(
  placement: Placement,
  rects: ElementRects,
  value: Options,
  rtl = false
): Coords {
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getMainAxisFromPlacement(placement) === 'x';
  const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1;
  const rawValue =
    typeof value === 'function' ? value({...rects, placement}) : value;
  const isNumber = typeof rawValue === 'number';

  let crossAxisMulti = 1;
  if (rtl && isVertical) {
    crossAxisMulti *= -1;
  }

  // eslint-disable-next-line prefer-const
  let {mainAxis, crossAxis, alignmentOffset} = isNumber
    ? {mainAxis: rawValue, crossAxis: 0, alignmentOffset: 0}
    : {mainAxis: 0, crossAxis: 0, alignmentOffset: 0, ...rawValue};

  if (alignment) {
    crossAxis = alignment === 'end' ? alignmentOffset * -1 : alignmentOffset;
  }

  return isVertical
    ? {x: crossAxis * crossAxisMulti, y: mainAxis * mainAxisMulti}
    : {x: mainAxis * mainAxisMulti, y: crossAxis * crossAxisMulti};
}

/**
 * Displaces the floating element from its reference element.
 * @see https://floating-ui.com/docs/offset
 */
export const offset = (value: Options = 0): Middleware => ({
  name: 'offset',
  options: value,
  async fn(middlewareArguments) {
    const {x, y, placement, rects, platform, elements} = middlewareArguments;

    const diffCoords = convertValueToCoords(
      placement,
      rects,
      value,
      await platform.isRTL?.(elements.floating)
    );

    return {
      x: x + diffCoords.x,
      y: y + diffCoords.y,
      data: diffCoords,
    };
  },
});
