/**
 * Note that this only supports 1 arg for the HandlerFunc.
 * Usage:
    const [noteOnPub, noteOnSub] = pubsub.makePubSub<number>();
    noteOnSub((data: number) => { console.log('Received', data); });
    noteOnPub(42);
 *   
 *   
 */

export type HandlerFunc<Type> = (arg: Type) => void;
export type SubFunc<Type> = (handlerFunc: HandlerFunc<Type>) => void;

export function makePubSub<Type>(): [HandlerFunc<Type>, SubFunc<Type>, (onOrOff: boolean) => void] {
  const evtMgr = new EvtMgr<Type>();
  return [evtMgr.pub, evtMgr.sub, evtMgr.onOffSwitch];
}

// If any of the subs recieved an event, the new sub will also receive an event. (OR)
export function makeSub<Type>(...subs: SubFunc<Type>[]) {
  const [mergedPub, mergedSub] = makePubSub();
  subs.forEach(sub => {
    sub((arg: Type) => {
      mergedPub(arg);
    })
  });
  return mergedSub;
}

// If we call the new pub, all pubs will be called. (AND)
export function makePub<Type>(...pubs: HandlerFunc<Type>[]) {
  const [mergedPub, mergedSub] = makePubSub<Type>();
  mergedSub((arg: Type) => {
    pubs.forEach(pub => {
      pub(arg);
    });
  });
  return mergedPub;
}

class EvtMgr<Type> {
  handlers: Array<HandlerFunc<Type>>;
  isOn: boolean;
  pub: HandlerFunc<Type>;
  sub: SubFunc<Type>;
  onOffSwitch: (onOrOff: boolean) => void;

  constructor() {
    this.handlers = [];
    this.isOn = true;

    // This weird way of defining methods is needed to support
    // the usage of passing EvtMgr.pub instead of EvtMgr into
    // other callers, so that this.handlers is defined.
    this.pub = (arg: Type) => {
      this.handlers.forEach(handlerFunc => {
        if (this.isOn) {
          handlerFunc(arg);
        }        
      });
    }
    this.sub = handlerFunc => {
      this.handlers.push(handlerFunc);
    };
    this.onOffSwitch = onOrOff  => {
      this.isOn = onOrOff;
    }
  }
}
