import { Fragment } from "react";

/** The "Tubestack" wordmark with "stack" in red. */
export function Brand() {
  return (
    <>
      Tube<span className="text-red-600">stack</span>
    </>
  );
}

/**
 * Renders prose with every "Tubestack" mention styled so "stack" is red.
 * Leaves all surrounding text untouched.
 */
export function withBrand(text: string) {
  const parts = text.split("Tubestack");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <Brand />}
    </Fragment>
  ));
}
