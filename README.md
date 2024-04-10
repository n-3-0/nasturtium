# Nasturtium

[![npm version](https://badge.fury.io/js/nasturtium.svg)](https://badge.fury.io/js/nasturtium)

🚧 **Note that all this documentation is still under construction** 🚧

Nasturtium is a love/hate letter to my career, where every project went down the rabbit hole on state management, and always ended up rewriting/refactoring it every couple years. I wanted to build a state library that could handle all the common use cases with the least amount of boilerplate, and make it such that you could use the same basic building blocks to implement anything else you'd need. As a result, this project is opinionated, but flexible enough to where it should serve your needs all the same.

In an ideal world, application reactivity should feel intuitive and unintrusive, and require the least amount of code to stitch together as possible. In order to use nasturtium, you simply import an ["implementation"](#supported-runtimes) for your tech stack once per project, and it will handle the rest. It provides a common API surface that works across different stacks, with four implemented currently, with more in progress:
 - Node.js
 - React
 - Preact (WIP)
 - Plain DOM

This allows you to learn it once, and use it in any project going forward.

## Table of Contents

- [Nasturtium](#nasturtium)
  - [Table of Contents](#table-of-contents)
  - [Setup](#setup)
  - [Supported Runtimes](#supported-runtimes)
    - [Node.js](#nodejs)
    - [React](#react)
    - [Preact (WIP)](#preact-wip)
    - [Plain DOM](#plain-dom)
      - [DOMv2 (Recommended)](#domv2-recommended)
      - [DOMv1 (Not Recommended)](#domv1-not-recommended)
  - [Types of State](#types-of-state)
    - [Primitive](#primitive)
    - [Computed](#computed)
      - [Computeds and Promises](#computeds-and-promises)
      - [Deferred Computed Values](#deferred-computed-values)
    - [Object](#object)
    - [Array](#array)
    - [Tuple](#tuple)
      - [The `inert` property](#the-inert-property)
      - [`.concat(...other)`](#concatother)
      - [`.size()`](#size)
      - [`.copyWithin()`](#copywithin)
      - [`.swap(i, j)`](#swapi-j)
      - [`.makeComputed(i, func, eager?)` and `.makeAllComputed(func, eager?)`](#makecomputedi-func-eager-and-makeallcomputedfunc-eager)
    - [Map](#map)
    - [Box](#box)
    - [Signal](#signal)
    - [Semaphore](#semaphore)
    - [Pipeline](#pipeline)
    - [Stator](#stator)
    - [Timer](#timer)
      - [Lifecycle](#lifecycle)
    - [Resource](#resource)
  - [Utility Methods](#utility-methods)
    - [`reactive()` and `inert()`](#reactive-and-inert)
      - [`reactive()`](#reactive)
      - [`inert()`](#inert)
      - [`makeInert()` and `makeAsyncInert()`](#makeinert-and-makeasyncinert)
    - [Priority Management and Manipulation](#priority-management-and-manipulation)
      - [Using the Queue](#using-the-queue)
      - [Appending the Queue](#appending-the-queue)
    - [Other Utilities](#other-utilities)
      - [`isPromise()`](#ispromise)
      - [`wrap()`](#wrap)
      - [`beginBatch()`, `rejectBatch()`](#beginbatch-rejectbatch)
      - [`trigger()` vs `propagate()`](#trigger-vs-propagate)
    - [Comparators and Update Optimization](#comparators-and-update-optimization)
    - [CYOA (Create Your Own Agent)](#cyoa-create-your-own-agent)
    - [Build Your Own Implementation](#build-your-own-implementation)
  - [Using DOMv2](#using-domv2)
    - [`text()`](#text)
    - [`attr()`](#attr)
    - [`elem()`](#elem)
    - [`wrap()`](#wrap-1)
  - [Using DOMv1](#using-domv1)
  - [Built-In Extensions](#built-in-extensions)
    - [React - Utility Hooks](#react---utility-hooks)
      - [`usePrimitive()`](#useprimitive)
      - [`useObject()`](#useobject)
      - [`useSignal()`](#usesignal)
      - [`useTimer()`](#usetimer)
      - [`useComputed()`](#usecomputed)
      - [`useToggle()`](#usetoggle)
      - [`useEffective()`](#useeffective)
    - [React - DOMv2 Integration](#react---domv2-integration)
    - [React - Hook State Type](#react---hook-state-type)
    - [React - `rctv`](#react---rctv)
    - [React - Deferred Component](#react---deferred-component)
    - [DOM - Breakpoint](#dom---breakpoint)

## Setup

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Somewhere at the root of your app, import the implementation you intend to use. If you do not need a specific implementation, the default is the `basic`, which provides no application-specific reactivity outside the `.observe()` and other standard API features.

I publish CommonJS, ES Module, and TypeScript type files to separate folders, and provide an `exports` definition to the `package.json` with valid references. In case your runtime doesn't support it, I also provide a root `index.js` that re-exports the CommonJS `index.js`.

## Supported Runtimes

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

In order to bring about a brighter future for application state, a wide range of acceptable build targets must be possible. Right now the library is built in TypeScript, and compiles to EcmaScript 2022 code. Eventually I might add an ES6 build target.

### Node.js

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

_Note that this implementation does not support child processes or workers. I'm working on it, eventually._

In order to use Nasturtium for Node.js projects, no special imports or setup should be necessary. You simply create your state as you would, and use the built-in utilities such as `.observe()`, `createComputed<T>()`, `reactive()` etc.

### React

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

_Note that this implementation does not really support StrictMode or Suspense very well. I'm working on it._

To use this library in a React app, in your main file, you must import the React implementation to add reactivity to your components. This import should be added before any import trees that utilize state:

```ts
import "nasturtium/implementations/react";
```

### Preact (WIP)

_Note that this implementation is currently unfinished. I'm working on it._

This implementation is very similar to [React](#react)'s, so it was a quick and dirty implementation. Works the same, just add this to your main file:

```ts
import "nasturtium/implementations/preact";
```

**NOTE**: Add this _after_ all your other imports. Preact works a little different than React, and to accomodate it easily it needs to be imported _last_, not _first_ like React.

### Plain DOM

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

There are two ways to use Nasturtium in a non-frameworked browser context, dubbed DOMv1 and DOMv2. DOMv1 is not recommended for general use, as it overwrites several `HTMLElement` prototype methods:
- `HTMLElement.prototype.appendChild()`
- `HTMLElement.prototype.setAttribute()`

#### DOMv2 (Recommended)

DOMv2 is a cleaner implementation for non-framework browser applications. The implementation itself is essentially utility functions and do not pollute the `HTMLElement` prototype.

```ts
import {
    text,
    attr,
    elem,
    wrap
} from "nasturtium/implementations/domv2"
```

See [Using DOMv2](#using-domv2) for a guide on how it works.

#### DOMv1 (Not Recommended)

DOMv1 is the first, experimental version of a pure browser JS implementation. To enable it, import it early in your page, and reactivity will be enabled:

```ts
import "nasturtium/implementations/domv1";
```

If you want your editor to stop having errors when using DOMv1, you can also add this global `.d.ts` file to your project's types:

`nasturtium/implementations/domv1.globals.d.ts`

See [Using DOMv1](#using-domv1) for a guide on how it works.

## Types of State

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

There are a handful of state types that are possible in Nasturtium, each one acting as a sort of mock for existing data types. There are also a few utility types implemented to make certain industry standards more straightforward.

All of the following examples will be for React projects, but the same state types and utility functions will work. React is just the easiest way for me to show how it works, and why it's useful.

In all of these examples, we cover just the high level of what each state type can do. There are built-in functions and utilities for each, so check the TS types in the package and source code for a more detailed overview. Eventually I'll document everything.

### Primitive

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

A primitive is a boxed value of any kind, with a simple getter and setter. Getting the value is how you subscribe to changes, setting the value will propagate changes to reactive code.

```tsx
 // or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const clicks = createPrimitive(0);

function Button(props) {
    return (
        <button type="button" onClick={() => clicks.value++}>
            Clicks: {clicks.value}
        </button>
    );
}
```

Not all components need getters and setters. Sometimes you just want something simple, like a timer.

```tsx
 // or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const seconds = createPrimitive(0);

function Timer() {
    return (
        <span>Seconds: {seconds.value}</span>
    );
}

setInterval(() => seconds.value++, 1000);
```

Primitives can have any kind of value stored within, but it's better to use [primitive type values](https://developer.mozilla.org/en-US/docs/Glossary/Primitive), because it feels more inline with vanilla JS.

```tsx
 // or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const search = createPrimitive("");

function ControlledInput() {
    return (
        <input type="text" placeholder="Search..."
            value={search.value}
            onChange={e => search.value = e.target.value} />
    );
}
```

### Computed

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Computed values are similar to primitives, but are composed via synchronous logic. They can utilize other pieces of state, and will recalculate its value (and update dependents) when any of its state dependencies change.

```tsx
// or "nasturtium/types/computed", "nasturtium/types/primitive"
import { createComputed, createPrimitive } from "nasturtium";

const search = createPrimitive("");
const tags = createComputed(() => search.value.split(" "));

function TagDisplay() {
    const tagList = tags.value.map(tag => (
        <span className="tag" key={`tag-${tag}`}>{tag}</span>
    ));

    return (
        <div className="tag-list">{tagList}</div>
    );
}

function Search() {
    return (
        <input type="text" placeholder="Tag Search..."
            value={search.value}
            onChange={e => search.value = e.target.value} />
    );
}
```

The fun part of computed values is that you can not only manually recompute it, but also get access to the last computed value. Whenever a computed value's output does not change between executions, it will not refresh dependents.

```tsx
import { createComputed } from "nasturtium";

const double = createComputed((last = 1) => last * 2);
console.log("Initial:", double.value);

for(let i = 0; i < 10; i++) {
    double.refresh();
    console.log("Next", double.value);
}
```

Computed values can do just about anything, assuming its memoization function is synchronous.

_Note that I'm really lazy and basically copy-pasted for this example_

```tsx
// or "nasturtium/types/computed", "nasturtium/types/primitive"
import { createComputed, createPrimitive } from "nasturtium";

const x = createPrimitive(1);

// https://www.geeksforgeeks.org/program-for-nth-fibonacci-number/
function fib(n) {
    let a = 0, b = 1, c, i;
    if(!n) return a;

    for(i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }

    return b;
}

const fibonacci = createComputed(() => fib(x.value));

// Modified for readability from https://stackoverflow.com/a/57012040
const nthPrime = createComputed(() => {
    const primes = [];
    let i = 1;

    while(i++ && prime.length < x.value) {
        if(prime.reduce((a, c) => (i % c) * a, 2)) {
            prime.push(i);
        }
    }

    if(!prime.length) {
        return -1;
    }

    return prime.at(-1);
});

// ... and so on
```

Furthermore, almost all other kinds of state have a utility function to create computed functions. See the types for each state type for more details.

```tsx
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const count = createPrimitive(0);
// Primitive.makeComputed will give you the value
const doubled = count.makeComputed(x => x * 2);
const original = doubled.makeComputed(x => x / 2);
```

Computed values are **lazy-evaluated by default**, which means that its memoizer will only be ran if the computed value is used. You can instruct a computed value to eager evaluate by passing in a second parameter.

```tsx
// or "nasturtium/types/computed"
import { createComputed } from "nasturtium";

// These will be immediately evaluated
const expensive = createComputed(() => someExpensiveFunction(), true);
const eagerSideEffect = expensive.makeComputed(value => {...}, true);

// This will only be evaluated when/as used
const lazySideEffect = expensive.makeComputed(value => ...);
```

Not only are comptued values able to be lazy/eager evaluated, but they can also handle deferred and promise results.

#### Computeds and Promises

**⚠️ Warning ⚠️**: Because of how Nasturtium works under the hood, promise and deferred computed states can introduce off-target subscriptions.
I don't recommend using these, but they have been built out in case you really need it.

A computed value can return a promise, which will only update dependents when the promise resolves.

**Note**: Computed states make no attempt to handle errors.

```tsx
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const userId = createPrimitive(-1);
const userRecord = userId.makeComputed(async(userId) => {
    if(userId === -1) return null;

    try {
        const user = await API.getUserById(userId);
        return user;
    } catch(ex) {
        return null;
    }
}, false, true); // Lazy evaluated, await promises

// This component only re-renders when the promise resolves
function UserIndicator() {
    const user = userRecord.value;

    if(user === null) return null;

    return (
        <span>{user.displayName}</span>
    )
}
```

If you want to explicitly use a promise as the calculated value, there is an `awaitPromise` parameter to `createComputed()` and every `makeComputed` to deny the await feature.

In the below code, the value of the computed is `Promise<...>`.

```tsx
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const userId = createPrimitive(-1);
const userRecord = userId.makeComputed(async(userId) => {
    if(userId === -1) return null;

    try {
        const user = await API.getUserById(userId);
        return user;
    } catch(ex) {
        return null;
    }
}, false, false); // lazy evaluate AND do not resolve promises (default)
```

#### Deferred Computed Values

**⚠️ Warning ⚠️**: Because of how Nasturtium works under the hood, promise and deferred computed states can introduce off-target subscriptions.
I don't recommend using these, but they have been built out in case you really need it.

If you provide a second parameter to the memoizer, it will turn into a deferred computed value.

**Note**: This checks the `.length` of the provided function, so ensure you are only providing one argument for standard computed states, otherwise it will be assumed deferred.

```tsx
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const userId = createPrimitive(-1);
const userRecord = userId.makeComputed((userId, callback) => {
    API.getUserById(userId)
        .then(user => callback(user))
        .catch(error => callback(null));
});

// This component only re-renders when the callback is called
function UserIndicator() {
    const user = userRecord.value;

    if(user === null) return null;

    return (
        <span>{user.displayName}</span>
    )
}
```

### Object

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Primitives and computed values get us pretty far along in terms of state capabilities, but sometimes you need a little more structure. Object state is essentially a proxy, allowing your code to react to specific parts of an object, or any part therein. It will not allow deep reactivity, and recursive state is untested, so try not to do anything too crazy.

```tsx
// or "nasturtium/types/object"
import { createObject } from "nasturtium";

// Initial values are not required, but recommended
// You can simply call createObject() and move on if you want
const state = createObject({
    clicks: 0,
    search: ""
});

// This component will only refresh when the clicks part changes
function Button(props) {
    return (
        <button type="button" onClick={() => state.clicks++}>
            Clicks: {state.clicks}
        </button>
    );
}

// This component will only refresh when the search part changes
function Search() {
    return (
        <input type="text" placeholder="Search..."
            value={state.search}
            onChange={e => state.search = e.target.value} />
    );
}
```

You can even use Object states to compose other pieces of state, which is how you do nested reactivity.

**NOTE**: This feature is not working correctly, but I am working on it.

```tsx
import {
    createPrimitive, // or "nasturtium/types/primitive"
    createComputed, // or "nasturtium/types/computed"
    createObject // or "nasturtium/types/object"
} from "nasturtium";

const token = createPrimitive<string | null>(null);
const authenticated = createComputed(() => !!token.value);
const authState = createObject({
    token, authenticated,
    username: ""
});

// In terms of reactivity:
// Calling authState.token is the same as calling token.value
// Calling authState.authenticated is the same as calling authenticated.value
```

### Array

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Arrays are incredibly common, and incredibly useful. Making an array stateful even moreso. The Array state type handles not only index-based reactivity:

```tsx
// or "nasturtium/types/array"
import { createArray } from "nasturtium";

const clicks = createArray<Date>();

// .push() will trigger a general change, but [0] will only subscribe to changes in the first element in the array
function Button() {
    return (
        <button type="button" onClick={() => clicks.push(new Date())}>
            Click me!
            First Click: {clicks[0] || "Never"}
        </button>
    );
}

// This component will only re-render when the second item in the array changes
function SecondClick() {
    return (
        <span>Second Click: {clicks[1] || "Never"}</span>
    );
}

// This component will re-render when the array changes
function AllClicks() {
    return (
        <span>Total Clicks: {clicks.length}</span>
    );
}
```

... but also all prototype methods that are reads and writes:

```tsx
// or "nasturtium/types/array", "nasturtium/types/computed"
import { createArray, createComputed } from "nasturtium";

const lines = createArray<string>();
// .join() counts as a getter, so this will recompute on array change
const document = createComputed(() => lines.join("\n"));
// .map() counts as a getter, so this will recompute on array change
const wordCount = createComputed(() => {
    // This part is reactive, because .map() is called on the array state
    const wordsPerLine = lines.map(x => x.split(" ").length);
    // This part is not reactive, because the above .map() returns a new, non-reactive array
    return wordsPerLine.reduce((a,b) => a + b);
});
// .filter() counts as a getter, so this will recompute on array change
const linesWithKeyword = createComputed(() => lines.filter(x => x.includes("keyword")));

// ... and so on
```

... AND iteration!

```tsx
// or "nasturtium/types/array", "nasturtium/reactive"
import { createArray, reactive } from "nasturtium";

const array = createArray<number>();

// Documentation on reactive() is later in the README
reactive(() => {
    // Iterating over an array state counts as a getter
    for(const item of array) {
        if(item % 2 === 1) {
            console.log("Found an odd number in the mix!", item);
        }
    }
});

setInterval(() => {
    const random = Math.floor(Math.random() * 10);
    array.push(random);
}, 1000);
```

For a full list of prototype methods that act as getters and setters, check out `listenableProps` and `mutativeProps` in the code - `src/types/array.ts`.

### Tuple

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

An array state is only "observable" at the top level - any interaction done to an array will refresh subscribers that use _any aspect of the array state_. Tuples are a more fine-grain (and frankly, more useful) version of Array states.

```tsx
// or "nasturtium/types/tuple", "nasturtium/reactive"
import { createTuple } from "nasturtium";

// Fill in 10 "Object A", "Object B", etc. with ids
const data = createTuple(Array(10).fill().map((_, i) => ({
    id: i + 1,
    label: `Object ${String.fromCharCode(65 + i)}`
})));

// This creates a "virtual list" that will only refresh children that change
function OrderedList() {
    // data.length is reactive
    const rows = Array(data.length).fill().map((_, i) => (
        <OrderedItem key={`ordered-item=${i}`} index={i} />
    ));

    return (
        <ol>{rows}</ol>
    );
}

function OrderedItem({ index }) {
    const record = data[index]; // or data.at(index)

    const onMoveUp = () => {
        if(index === 0) return;
        data.swap(index, index - 1); // Swap the elements at these two indices in the tuple
    };

    const onMoveDown = () => {
        if(index === data.size()) return; // Non-reactive
        data.swap(index, index + 1);
    };

    return (
        <li>
            <span>{record.label}</span>

            <button type={button} onClick={onMoveUp}>
                Move Up
            </button>
            <button type={button} onClick={onMoveDown}>
                Move Down
            </button>
        </li>
    );
}
```

Every array method has stateful implications, and there are some useful differences and additional methods/properties:

#### The `inert` property

The `inert` property in a tuple state gives you access to the internal array, so that you can do non-reactive interactions. Note that no changes will propagate automatically if you use `inert`.

#### `.concat(...other)`

The `concat()` method is non-reactive, and a reactive-equivalent `join()` has been created.

#### `.size()`

An inert equivalent to the `length` property.

#### `.copyWithin()`

The `copyWithin()` method will throw an error, because it isn't implemented yet.

#### `.swap(i, j)`

The `swap()` method has been added to swap two items in the array, and propagate those changes.

#### `.makeComputed(i, func, eager?)` and `.makeAllComputed(func, eager?)`

The `makeComputed()` method will allow you to create a computed value based on a specific indexed value, whereas `makeAllComputed()` will create a computed value based on the entire tuple.

### Map

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

This was more an afterthought than a recommended data type. Eventually I will add an equivalent `Set`.

### Box

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Sometimes, you need a really weird type of state, and due to how this library is written, an edge case pops up where you can't do exactly what you want. To cover this, I've added a Box state. It has simple getter/setter functions with no restrictions on the value type. The `get()` function is always inert with boxed values, to subscribe to changes you muse call `use()` instead.

```tsx
// or "nasturtium/types/box"
import { createBox } from "nasturtium";

const boxed = createBox();

// This will not react to changes
const currentValue = boxed.get();

// This will react to changes
const value = boxed.use();

// This will trigger changes for dependents
boxed.setValue(someNewValue);
```

### Signal

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

A signal is a basic trigger, but can be used for more. It creates a callable function that will update any dependents. By default it is a `Signal<void>`, and the signal takes no arguments, but you can optionally provide a value to pass along to dependents.

```tsx
// or "nasturtium/types/signal"
import { createSignal } from "nasturtium";

const setModalOpen = createSignal(false);

function ConfirmButton() {
    return (
        <button type="button" onClick={() => setModalOpen(true)}>
            Do the thing
        </button>
    );
}

function Modal() {
    const open = setModalOpen.use();

    if(!open) return null;

    return (
        <dialog className="modal">
            <p>Are you sure you want to continue?</p>
            <button type="button" onClick={() => setModalOpen(false)}>
                Cancel
            </button>
        </dialog>
    );
}
```

You can also check the last signaled value at any given point by accessing the `lastValue` property of the signal function.

### Semaphore

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Similar to a signal, but explicitly for asynchronous, repeated actions. You can return an initial value, and subsequent updates can be given a new value. Dependents can access to the current value.

```tsx
// or "nasturtium/types/semaphore"
import { createSemaphore } from "nasturtium";

// A simple trigger, similar to to a Signal<void>
const fullScreen = createSemaphore(signal => {
    document.addEventListener("fullscreenchange", () => signal());
});

function Indicator() {
    fullScreen.use(); // Subscribes to the event

    return (
        {!!document.fullscreenElement && (
            <p>Is full screen</p>
        )}
    );
}

// A proper semaphore with a return value
const lastClickedPosition = createSemaphore(signal => {
    document.addEventListener("click", e => signal({
        x: e.clientX,
        y: e.clientY
    }));

    return { x: -1, y: -1 };
});

function ClickIndicator() {
    const { x, y } = lastClickedPosition.use();

    if(x === -1 || y === -1) return "Haven't clicked yet";

    return `Clicked at (${x}, ${y})`;
}
```

Semaphores can optionally work with contextual data, which can be useful for data contained within a semaphore that isn't the specific value being propagated. The context object is added as a second parameter to the provided function, and will be persisted throughout the lifecycle of the semaphore.

```tsx
// or "nasturtium/types/semaphore"
import { createSemaphore } from "nasturtium";

const notifications = createSemaphore((signal, context) => {
    const source = new EventSource("https://some.backend/api/notifications");
    const cache = [];

    source.addEventListener("message", event => {
        cache.push(event.data);
        signal(cache);
    });

    context.source = source;
});

// later on a cleanup func somewhere
const { source } = notifications.context;
source.close();
```

### Pipeline

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Similar to a Semaphore, but with multiple "event" types. Comparable to a Node.js `EventEmitter`. The key difference is that a semaphore bootstraps using a function, and in a pipeline the bootstrap process is optional. Events can be emitted via bootstrap _or_ a dedicated `.emit()` function on the state.

```tsx
// or "nasturtium/types/pipeline"
import { createPipeline } from "nasturtium";

type Events = {
    "start": void;
    "stop": void;
    "step": number;
}

const events = createPipeline<Events>();

events.observe("start", () => console.log("Started!"));
events.observe("stop",  () => console.log("Stopped!"));
events.observe("step",  i  => console.log(`Step ${i}!`));

events.emit("start");

for(let i = 0; i < 3; i++) {
    events.emit("step", i + 1);
}

events.emit("stop");
```

Or with a setup function:

```tsx
// or "nasturtium/types/pipeline"
import { createPipeline } from "nasturtium";

const events = createPipeline((emit, context) => {
    // emit() is identical to events.emit(), but with the advantage of context access
});
```

### Stator

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

A Stator is a more complex variant of computed state. It returns a function that, for a given input, creates a reactive version of the output. It can be considered a reactive adapter to functional programming, in the sense that each input-output pair is independently reactive, and changes will only propagate if the output changes.

```tsx
import {
    createTuple, // or "nasturtium/types/tuple"
    createStator, // or "nasturtium/types/primitive"
} from "nasturtium";

type UserRole = "admin" | "user" | "developer";

const userRoles = createTuple<UserRole[]>([ "user" ]);

const userHasRole = createStator<Record<UserRole, boolean>>(role => userRoles.includes(role));

function AdminRoute(props) {
    // This component will only re-render when userRoles.includes("admin") changes
    const isAdmin = userHasRole("admin");

    if(!isAdmin) return (
        <Redirect to="/home" />
    );

    return <Route {...props} />
}
```

### Timer

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Sometimes you just need a simple interval. Timers are a strongly-typed, reactive interval, so that you know exactly what you're looking at.

```tsx
// or "nasturtium/types/timer"
import { createTimer } from "nasturtium";

const timer = createTimer(1000); // Typed as Timer<1000>
const ticks = timer.makeComputed<number>((ticks = 0) => ticks + 1);

timer.observe(() => console.log("One second has elapsed!"));

function Timer() {
    const seconds = ticks.use();

    return (
        <span>Seconds: {seconds}</span>
    );
}
```

#### Lifecycle

Timers by default do not autostart, and do not immediately update dependents. There are functions and parameters to control this behavior.

```tsx
// or "nasturtium/types/timer"
import { createTimer } from "nasturtium";

// {interval} [autostart] [immediate]
const timer = createTimer(1000, true, false);
timer.start(); // Only works if not already running
timer.stop(); // Only works if currently running
timer.toggle(); // Will flip the state

console.log(`Timer runs every ${timer.interval}ms`); // 1000ms

function Timer() {
    // "running" is reactive
    // isRunning() is an inert equivalent
    if(timer.running) return null;

    return <PauseIcon />;
}
```

### Resource

Documentation coming soon. See source for details.

## Utility Methods

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

In order to make working with state easier, I've added a bunch of helpful functions. They help shore up shortcomings in the base state functions.

### `reactive()` and `inert()`

These two functions are two sides of the same coin, but each are most useful in different applications. `reactive()` is most useful in a non-framework context (Node.js and plain DOM), whereas `inert()` is most useful in a framework context.

#### `reactive()`

To run a function, and re-run it when dependencies change, you can use this function. Due to the current implementation, it will invoke immediately, and will return a `Promise<T>`. This is so that cleanup can occur after the function finishes, whether or not it is an asynchronous function. Note that it will return the value of the first invocation, but unlike Computed states, you do not have access to the previous return value as a parameter.

```ts
// or "nasturtium/types/primitive", "nasturtium/reactive"
import { createPrimitive, reactive } from "nasturtium";

const state = createPrimitive(0);

// This function will re-run whenever dependencies change
reactive(() => {
    console.log("Current value:", state.value);
});

setInterval(() => state.value++, 1000);
```

#### `inert()`

Sometimes you want to do something with normally-reactive code, but you just don't want it to subscribe to any changes. For this edge case, you can call `inert()`, to do the exact opposite of `reactive()`.

```tsx
// or "nasturtium/types/primitive", "nasturtium/reactive"
import { createPrimitive, inert } from "nasturtium";

const clicks = createPrimitive(0);

function InertButton() {
    inert(() => {
        console.log("I can freely do things in here and not do anything reactive!");

        console.log("Current clicks value:", clicks.value)
    });

    return (
        <button type="button" onClick={() => clicks.value++}>
            Click me!
        </button>
    );
}
```

#### `makeInert()` and `makeAsyncInert()`

These are just like the `inert()` function, but act as a curry function, allowing you to turn any random function into a guaranteed-inert function. This might be useful for React components that you want to _never_ be reactive.

```tsx
// or "nasturtium/types/primitive", "nasturtium/reactive"
import { createPrimitive, makeInert } from "nasturtium";

const state = createPrimitive(0);

// Because it's wrapped in makeInert(), it will not react to any state, ever
const InertComponent = makeInert((props) => {
    console.log("Inert value", state.value);

    return (
        <span>Primitive access without reactivity</span>
    );
});

// Because it's NOT wrapped in makeInert(), it WILL react to state
function ReactiveComponent(props) {
    console.log("Reactive value", state.value);

    return (
        <span>Primitive access with reactivity</span>
    );
}

setInterval(() => state.value++, 1000);
```

### Priority Management and Manipulation

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Nasturtium 1.2.x introduced the priority lane system to improve performance for computed state, and introduced a couple utilities to manage it.

#### Using the Queue

`peekNext()`, `popNext()`, and `runNext()` all respect the priority order.

```ts
// import * as queue from "nasturtium/queue"
import { queue } from "nasturtium";

// This function tells you if anything is in the state queue
queue.hasNext();
// This will fetch the next item to process without popping it from the queue
const next = queue.peekNext();
// This will pop the next item from the queue, or null if there isn't one
const next = queue.popNext();
// This will run the next item in the queue, if one exists
queue.runNext();

// Will return an object with `size` being the total pending count, and one property for each priority index with that lane's pending count
console.log(queue.peekDetails())
```

#### Appending the Queue

If you wish to manually add something to the queue, you can! There are two separate lifecycles you can observe, the trigger function and the queue item's internal `Promise`.

```ts
// import * as queue from "nasturtium/queue"
import { queue } from "nasturtium";

const onEntryRan = (value, id) => {
    console.log(`Ran! ID = ${id}, Value = ${value}`);
};

// {id} {value} {trigger} {priority}
const entry = queue.queueNext(-1, "Hello!", onEntryRan, queue.PriorityLane.NORMAL);

entry.promise.then(({ id, value }) => {
    console.log(`Completed! ID = ${id}, Value = ${value}`);
});
```

### Other Utilities

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

#### `isPromise()`

This function returns a boolean telling you whether or not it's a promise. A+ spec compatible, allegedly.

#### `wrap()`

This is used internally, but may have some utility elsewhere. It creates an object similar to React's `Ref`, but with a read-only `current` getter. It is a frozen object to prevent basic modifications.

```ts
// Or "nasturtium/utilities"
import { wrap } from "nasturtium";

// Every call to example.current will return the latest Date()
const example = wrap(() => new Date());

const withOtherValues = wrap(() => "Hello world!", { name: "other" });
console.log(withOtherValues.current) // "Hello world!"
console.log(withOtherValues.name) // "other"
```

#### `beginBatch()`, `rejectBatch()`

Under very specific circumstances, it may be desired to intercept state changes. You can use these utility methods to bundle all state changes, and either commit or reject them. Rejection currently will cause desync issues, but that's a problem for another day. You can bypass batch restrictions when authoring your own state types by calling `propagate()`

```ts
import {
    createPrimitive, // or "nasturtium/types/primitive"
    beginBatch, // or "nasturtium/manifold"
    rejectBatch // or "nasturtium/manifold"
} from "nasturtium";

const example = createPrimitive("test");
example.observe(value => console.log("Primitive changed to", value));

example.value = "first"; // This triggers the observer above
const commitBatch = beginBatch();
example.value = "second"; // No reactions, but internal value has changed
example.value = "third"; // No reactions, but internal value has changed
commitBatch(); // Observer logs "Primitive changed to third"

beginBatch();
example.value = "fourth";
rejectBatch(); // Observer never triggers with "fourth" value change
```

#### `trigger()` vs `propagate()`

When authoring your own state types, you should be calling `trigger()` to propagate changes. However, `trigger()` can fall victim to batch rejection. If you wish to bypass that behavior, you can call `propagate()` instead, which will ignore batching.

```ts
import {
    getNextId, // or "nasturtium/constants"
    processDependents, // or "nasturtium/manifold"
    trigger, // or "nasturtium/manifold"
    propagate, // or "nasturtium/manifold"
    beginBatch // or "nasturtium/manifold"
} from "nasturtium";

// These intervals will not propagate changes when a batch is in progress
function createBasicInterval() {
    const id = getNextId();
    let interval = setInterval(() => trigger(id));
    const state = () => processDependents(id);

    return state;
}

// These intervals will not propagate changes when a batch is in progress
function createForcedInterval() {
    const id = getNextId();
    let interval = setInterval(() => propagate(id));
    const state = () => processDependents(id);

    return state;
}

const useBasicInterval = createBasicInterval();
const useForcedInterval = createForcedInterval();

function SometimesUpdate() {
    useBasicInterval();
    return "This component sometimes updates, assuming no batches are being used";
}

function AlwaysUpdate() {
    useForcedInterval();
    return "This component updates no matter what!";
}
```

### Comparators and Update Optimization

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

For many types of state, there is an internal check if a new value is different than the current value, and only if they differ is when propagation will occur. By default this is with a simple strict equality check, `a === b`, but you can optimize your state by replacing its internal comparator.

```tsx
import {
    comparators, // Or import * as comparators from "nasturtium/comparator"
    createPrimitive, // in "nasturtium/types/primitive"
    setComparator, // in "nasturtium/constants"
} from "nasturtium";

const state = createPrimitive(3);
setComparator(state, (before, after) => before == after);

state.observe(value => `New value is`, value);
state.value = "3"; // This will not trigger an update because 3 == "3"
```

### CYOA (Create Your Own Agent)

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

In the off chance you need to do something particularly magical, I've built out an Agent system. It allows you to create reactive constructs that do not fit the normal state types. The current use case for Agents is in the `reactive()` / `inert()` type functions - `reactive()` has an agent that re-runs the given function, and `inert()` has a dummy agent that ignores requests to re-run.

The `makeAgent()` function requires a function as a parameter, which will be called whenever that agent needs to trigger updates. It will return a cleanup function that **must be called** when you are done with reactive code. Agents will override the default reactive behavior, and any state references that occur between `useAgent()` and `cleanup()` will be assigned to that agent.

The DOMv2 implementation uses Agents instead of prototype pollution to enable reactivity. Over time the Agent system will be expanded to include more contextual data and lifecycle events, enabling all sorts of reactivity.

```ts
import {
    makeAgent, // or "nasturtium/agent"
    useAgent, // or "nasturtium/manifold"
    createPrimitive // or "nasturtium/types/primitive"
} from "nasturtium";

function setTextContent(element: HTMLElement, value: () => string) {
    // The function you provide will be called when your agent needs to refresh something
    const agent = makeAgent(() => callValueGetter());

    function callValueGetter() {
        // Start targeting all reactive behavior at our agent
        const cleanup = useAgent(agent);
        // Call the potentially-reactive code
        element.textContent = value();
        // Restore reactive behavior back to normal
        cleanup();
    }

    // Run it manually to hook everything together
    callValueGetter();
}

const seconds = createState(0);

// This element will now always show the new value, as the custom agent will refresh its `textContent` with the getter result
const element = document.createElement("span");
setTextContent(element, () => `Seconds: ${seconds.value}`);
document.body.appendChild(element);

setInterval(() => {
    seconds.value++;
}, 1000);
```

Agents can optionally hook into their own lifecycle events with an optional second parameter. These can be useful for any operations that need to be staged before/after an agent is used, without manually doing so everywhere you need to use said agent.

```ts
interface AgentOptions {
    priority?: PriorityLane;
    before?: () => void;
    after?: () => void;
    cleanup?: () => void;
};

const agent = makeAgent(() => { ... }, {
    before: () => console.log("Agent activated"),
    after: () => console.log("Agent deactivated"),
});
```

Agents can function on different priority lanes, allowing for all sorts of potential optimizations. Currently there are two main lanes used internally, with more available for edge use cases. Below is a table of the current priority lanes in order of execution:

| Priority | Lane Name  | Description                                      | Current Use          |
|----------|------------|--------------------------------------------------|----------------------|
| 400      | `PRIORITY` | Updates happen immediately, before anything else | None                 |
| 300      | `COMPUTED` | Updates happen before standard flow              | Computed, Stator     |
| 200      | `NORMAL`   | Updates happen after computation tasks complete  | Basically everything |
| 100      | `MONITOR`  | Updates happen after all other tasks complete    | None                 |

When creating an agent, you can assign it a priority lane, and it will default to `NORMAL` if not specified.

```tsx
import {
    makeAgent, // or "nasturtium/agent"
    queue, // or "nasturtium/queue"
} from "nasturtium";

const agent = makeAgent(() => { ... }, {
    priority: queue.PriorityLane.COMPUTED
});
```

### Build Your Own Implementation

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

I've provided a lot of sane defaults, and a couple implementations that suited my needs. However, if you want to enable reactivity in your projects, you can build a `StateBridge` - an implementation. I don't feel like documenting it, so go look through the source code in the `implementations` folder to see how they are built.

By default, `basic` is imported and used. You can override an implementation by calling `setBridge()` and passing in your custom implementation. This is why you have to import an implementation if you are using a non-Node.js environment, because the `basic` implementation covers enough of Nasturtium's internals to get reactivity working out of the box.

## Using DOMv2

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

DOMv2 doesn't currently work like any other implementation, in that it has no built-in `StateBridge`. What this means in practice is that it is an _extension for_ Nasturtium, rather than an _implementation of_ Nasturtium internals. What this also means is that DOMv2 can be used alongside other implementations!

Element reactivity is controlled via helper functions, which implement Agents to perform changes. Note that for all of these (except `attr()` under certain circumstances), it will coalesce the value to a string, due to limitations of the browser.

### `text()`

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

One key way you'd want to add reactivity is in an element's text content. To do this, we can use the `text()` function, which creates a DOM `TextNode` with reactivity encapsulated within a function.

```ts
import { text } from "nasturtium/implementations/domv2";
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const clicks = createPrimitive(0);
const button = document.createElement("button");
button.type = "button";

button.appendChild(text(() => `Clicks: ${clicks.value}`));
button.addEventListener("click", () => clicks.value++);

document.body.appendChild(button);
```

### `attr()`

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Another common pattern that could use reactivity is element attributes. To enable that, the `attr()` function was added. It is similar to `text()` under the hood, but more specific:

```ts
import { attr } from "nasturtium/implementations/domv2";
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const clicks = createPrimitive(0);
const button = document.createElement("button");
button.type = "button";

attr(button, "data-clicks", () => clicks.value);
button.addEventListener("click", () => clicks.value++);

document.body.appendChild(button);
```

### `elem()`

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

The final current feature of DOMv2 is creating broadly-reactive elements. It takes in a `modifier` function that will re-run for any dependency change. Depending on your preferred style, this may be a cleaner way to do reactivity. It is essentially a mashed-together version of `reactive()` and `document.createElement()`:

```ts
import { elem } from "nasturtium/implementations/domv2";
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const clicks = createPrimitive(0);
const button = elem("button", (button) => {
    button.textContent = `Clicks: ${clicks.value}`;
});
button.type = "button";

button.addEventListener("click", () => clicks.value++);
document.body.appendChild(button);
```

### `wrap()`

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Take an existing element, and reactively perform changes to it.

```ts
import { wrap } from "nasturtium/implementations/domv2";
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const route = createPrimitive("/home");
const body = wrap(document.body, body => {
    // Any state changes will re-run this function
    body.setAttribute("data-route", route.value);
});

route.value = window.location.pathname;
```

## Using DOMv1

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

While imperfect, this _can_ feel more like a native feature, so some developers may opt to use DOMv1 over v2. It essentially hijacks some prototype methods in `HTMLElement` to create a fake quasi-lifecycle for an element. It's extremely overengineered, but it's neat so I kept it.

In order to create reactive data, you can pass functions to several functions/properties that previously only accepted primitive values:

- `document.createTextNode()`
- `HTMLElement`
    - `contentEditable`, `draggable`, `hidden`, `style`, `title`,
- `HTMLButtonElement`
    - `disabled`, `type`
- `HTMLInputElement`
    - `disabled`, `checked`, `type`, `value`, `step`, `required`, `readOnly`
- `HTMLImageElement`
    - `src`, `alt`, `width`, `height`
- `HTMLTextAreaElement`
    - `cols`, `disabled`, `readonly`, `required`, `value`
- `HTMLSelectElement`
    - `disabled`, `multiple`, `required`, `value`
- HTMLMeterElement
    - `min`, `max`, `low`, `high`, `optimum`, `value`
- HTMLDialogElement
    - `open`

```ts
import "nasturtium/implementations/domv1";
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";

const clicks = createPrimitive(0);
const button = document.createElement("button");
button.type = "button";

// setAttribute() will make that attribute reactive if it is given a function
button.setAttribute("data-clicks", () => clicks.value);

// Reactive text nodes can be explicitly created
const reactiveTextNode = document.createTextNode(() => `Clicks: ${clicks.value}`);

// Several attribute properties for several element types are now reactive when given a function
button.textContent = () => `Clicks: ${clicks.value}`;
button.onclick = () => clicks.value++;

document.body.appendChild(button);
```

## Built-In Extensions

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

While building out this library, I spent a while thinking about various things I would use it for. If I thought it would be useful for other people, I added it to the `extensions` folder. A couple ended up in `implementations` as subfolders.

The documentation for most of this is coming soon.

### React - Utility Hooks

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

Some utility hooks have been created to make using Nasturtium in a React setting a little easier.

#### `usePrimitive()`

You can pass in an initial value (similar to `useState`) and it will create a primitive you can pass around. This is useful for a parent-level component to pass a primitive state to children _without reacting to value changes_.

Alternatively, if you pass a primitive state to `usePrimitive()`, it will subscribe to changes.

```tsx
// or "nasturtium/types/primitive"
import { createPrimitive } from "nasturtium";
import { usePrimitive } from "nasturtium/implementations/react/hooks";

const globalState = createPrimitive(0);

function ParentComponent() {
    const state = usePrimitive(0); // Creates a new primitive

    useEffect(() => state.observe(value => {
        console.log("Value changed without updating the parent!");
    }), [ state ]);

    return (
        <Child primitive={state} />
    );
}

function OtherComponent() {
    const value = usePrimitive(globalState); // Subscribe to globalState primitive
    return `Global value: ${value}`;
}
```

#### `useObject()`

This is identical in functionality to `usePrimitive()`, but for object states.

#### `useSignal()`

This allows you to subscribe to a signal by passing it in as a parameter.

#### `useTimer()`

This allows you to subscribe to a timer by passing it in as a parameter.

#### `useComputed()`

This allows you to create a computed state with optional dependencies. It will return a computed state without subscribing to it.

**Note that the implementation is currently unstable and subject to change.**

```tsx
const base = createPrimitive(0);

// The computed value will change if state or hook dependencies change
function Multiply({ by = 2 }) {
    const computed = useComputed(() => base.value * by, [ by ]);

    return (
        <Calculator result={computed}>
    );
}
```

#### `useToggle()`

Every app has some sort of toggle, and this is a utility hook to create a toggleable boolean primitive.

TBD (to be documented)

#### `useEffective()`

This is React's `useEffect()`, with added reactivity.

```tsx
const state = createPrimitive(2);

function Multiplier({ factor }) {
    const [ cache, setCache ] = useState(() => state.get() & factor)

    useEffective(() => {
        // Anything ran in here will run when hook deps OR state deps change
        const double = state.value * cache;
        setCache(double); // Please don't actually write code like this. There are more efficient patterns
    }, [ factor ]);

    return `Result: ${cache}`;
}
```

### React - DOMv2 Integration

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

TBD (to be documented)

### React - Hook State Type

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

TBD (to be documented), but tl;dr run hooks _outside_ a component lifecycle and turn it into computed state.

### React - `rctv`

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

TBD (to be documented)

### React - Deferred Component

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

TBD (to be documented)

### DOM - Breakpoint

<a href="#nasturtium">
    <sup>Return to Top</sup>
</a>

By specifying a Bootstrap-style dictionary of breakpoints and their page widths, you can react to changes, by using a window resize listener under the hood. Later it will be converted to use a generated CSS sheet with media queries and a listener.

```ts
import { createBreakpoints } from "nasturtium/extensions/dom/breakpoint";

const pageBreakpoint = createBreakpoints({
    "xs": "576px", // Anything below the first entry will be the smallest, so this is width <= 575
    "sm": "576px", // Actually applies at 576+
    "md": "768px",
    "lg": "992px",
    "xl": "1200px",
    "xxl": "1400px", // Anything at or above this will get this value
});

// breakpoint value will be one of the keys (e.g. "md")
pageBreakpoint.observe(breakpoint => console.log(`Page breakpoint is ${breakpoint}`));
```
