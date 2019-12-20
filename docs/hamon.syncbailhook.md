<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [hamon](./hamon.md) &gt; [SyncBailHook](./hamon.syncbailhook.md)

## SyncBailHook class

Synchronous Bail Hook

<b>Signature:</b>

```typescript
export declare class SyncBailHook<T, R> extends SyncTapHook<T, R> 
```

## Remarks

Invoke listener Synchronously. Calling will bail with non-undefined value returned with listener. If no listener return non-undefined value, calling will bail with first element of arguments

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [call(args)](./hamon.syncbailhook.call.md) |  | call listener with <code>...args</code> |
