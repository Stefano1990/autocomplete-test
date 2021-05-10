import { modifier } from 'ember-modifier';

export default modifier(function keyUp(
  element,
  [handler],
  { key: desiredKey }
) {
  let keydownListener = (evt) => {
    if (!desiredKey || desiredKey === evt.key) {
      evt.preventDefault();
      handler(evt);
    }
  };

  element.addEventListener('keydown', keydownListener);

  return () => {
    element.removeEventListener('keydown', keydownListener);
  };
});
