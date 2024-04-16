import { ArrayState } from "nasturtium/types/array";
import { BoxState } from "nasturtium/types/box";
import { ComputedState } from "nasturtium/types/computed";
import { MapState } from "nasturtium/types/map";
import { ObjectState } from "nasturtium/types/object";
import { Pipeline } from "nasturtium/types/pipeline";
import { PrimitiveState } from "nasturtium/types/primitive";
import { Resource } from "nasturtium/types/resource";
import { Semaphore } from "nasturtium/types/semaphore";
import { Timer } from "nasturtium/types/timer";
import { TupleState } from "nasturtium/types/tuple";

import React from "react";

type StateProvider = React.ProviderExoticComponent<{
    children?: React.ReactNode | undefined;
}>;

interface StateContext<T> extends React.Context<T> {
    Provider: StateProvider;
};

declare module "naturtium/types/array.extensions" {
    interface $Array<T> {
        context: StateContext<ArrayState<T>>;
    }
}

declare module "naturtium/types/box.extensions" {
    interface $Box<T> {
        context: StateContext<BoxState<T>>;
    }
}

declare module "naturtium/types/computed.extensions" {
    interface $Computed<T> {
        context: StateContext<ComputedState<T>>;
    }
}

declare module "naturtium/types/map.extensions" {
    interface $Map<T> {
        context: StateContext<MapState<T>>;
    }
}

declare module "naturtium/types/object.extensions" {
    interface $Object<T> {
        context: StateContext<ObjectState<T>>;
    }
}

declare module "naturtium/types/pipeline.extensions" {
    interface $Pipeline<T> {
        context: StateContext<Pipeline<T>>;
    }
}

declare module "naturtium/types/primitive.extensions" {
    interface $Primitive<T> {
        context: StateContext<PrimitiveState<T>>;
    }
}

declare module "naturtium/types/resource.extensions" {
    interface $Resource<T> {
        context: StateContext<Resource<T>>;
    }
}

declare module "naturtium/types/semaphore.extensions" {
    interface $Semaphire<T> {
        context: StateContext<Semaphore<T>>;
    }
}

declare module "naturtium/types/stator.extensions" {
    interface $Stator<T> {
        context: StateContext<Stator<T>>;
    }
}

declare module "naturtium/types/timer.extensions" {
    interface $Timer<T> {
        context: StateContext<Timer<T>>;
    }
}

declare module "nasturtium/types/tuple.extensions" {
    interface $Tuple<T> {
        context: StateContext<TupleState<T>>;
    }
}
