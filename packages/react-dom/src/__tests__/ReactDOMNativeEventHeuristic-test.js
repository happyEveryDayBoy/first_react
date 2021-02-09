/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;

let ReactDOM;
let Scheduler;

describe('ReactDOMNativeEventHeuristic-test', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function dispatchAndSetCurrentEvent(el, event) {
    try {
      window.event = event;
      el.dispatchEvent(event);
    } finally {
      window.event = undefined;
    }
  }

  // @gate experimental
  // @gate enableDiscreteEventMicroTasks && enableNativeEventPriorityInference
  it('ignores discrete events on a pending removed element', async () => {
    const disableButtonRef = React.createRef();
    const submitButtonRef = React.createRef();

    function Form() {
      const [active, setActive] = React.useState(true);

      React.useLayoutEffect(() => {
        disableButtonRef.current.onclick = disableForm;
      });

      function disableForm() {
        setActive(false);
      }

      return (
        <div>
          <button ref={disableButtonRef}>Disable</button>
          {active ? <button ref={submitButtonRef}>Submit</button> : null}
        </div>
      );
    }

    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const disableButton = disableButtonRef.current;
    expect(disableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Disable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    expect(() =>
      dispatchAndSetCurrentEvent(disableButton, firstEvent),
    ).toErrorDev(['An update to Form inside a test was not wrapped in act']);

    // There should now be a pending update to disable the form.
    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // Discrete events should be flushed in a microtask.
    // Verify that the second button was removed.
    await null;
    expect(submitButtonRef.current).toBe(null);
    // We'll assume that the browser won't let the user click it.
  });

  // @gate experimental
  // @gate enableDiscreteEventMicroTasks && enableNativeEventPriorityInference
  it('ignores discrete events on a pending removed event listener', async () => {
    const disableButtonRef = React.createRef();
    const submitButtonRef = React.createRef();

    let formSubmitted = false;

    function Form() {
      const [active, setActive] = React.useState(true);

      React.useLayoutEffect(() => {
        disableButtonRef.current.onclick = disableForm;
        submitButtonRef.current.onclick = active
          ? submitForm
          : disabledSubmitForm;
      });

      function disableForm() {
        setActive(false);
      }

      function submitForm() {
        formSubmitted = true; // This should not get invoked
      }

      function disabledSubmitForm() {
        // The form is disabled.
      }

      return (
        <div>
          <button ref={disableButtonRef}>Disable</button>
          <button ref={submitButtonRef}>Submit</button>
        </div>
      );
    }

    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const disableButton = disableButtonRef.current;
    expect(disableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Disable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    expect(() => {
      dispatchAndSetCurrentEvent(disableButton, firstEvent);
    }).toErrorDev(['An update to Form inside a test was not wrapped in act']);

    // There should now be a pending update to disable the form.
    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // Discrete events should be flushed in a microtask.
    await null;

    // Now let's dispatch an event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(submitButton, secondEvent);

    // Therefore the form should never have been submitted.
    expect(formSubmitted).toBe(false);
  });

  // @gate experimental
  // @gate enableDiscreteEventMicroTasks && enableNativeEventPriorityInference
  it('uses the newest discrete events on a pending changed event listener', async () => {
    const enableButtonRef = React.createRef();
    const submitButtonRef = React.createRef();

    let formSubmitted = false;

    function Form() {
      const [active, setActive] = React.useState(false);

      React.useLayoutEffect(() => {
        enableButtonRef.current.onclick = enableForm;
        submitButtonRef.current.onclick = active ? submitForm : null;
      });

      function enableForm() {
        setActive(true);
      }

      function submitForm() {
        formSubmitted = true; // This should not get invoked
      }

      return (
        <div>
          <button ref={enableButtonRef}>Enable</button>
          <button ref={submitButtonRef}>Submit</button>
        </div>
      );
    }

    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const enableButton = enableButtonRef.current;
    expect(enableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Enable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    expect(() => {
      dispatchAndSetCurrentEvent(enableButton, firstEvent);
    }).toErrorDev(['An update to Form inside a test was not wrapped in act']);

    // There should now be a pending update to enable the form.
    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // Discrete events should be flushed in a microtask.
    await null;

    // Now let's dispatch an event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(submitButton, secondEvent);

    // Therefore the form should have been submitted.
    expect(formSubmitted).toBe(true);
  });
});
