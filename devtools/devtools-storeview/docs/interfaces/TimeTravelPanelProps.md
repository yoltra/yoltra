![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / TimeTravelPanelProps

# Interface: TimeTravelPanelProps

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:36](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L36)

What [TimeTravelPanel](../functions/TimeTravelPanel.md) renders from.

## Properties

### currentIndex

> **currentIndex**: `number`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:38](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L38)

***

### entries

> **entries**: `EventLogEntry`[]

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:37](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L37)

***

### frameCount?

> `optional` **frameCount**: `null` \| `number`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:45](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L45)

Timeline length to measure against — frozen at travel-start so a live
store cannot shift the scrubber. Falls back to the live entry count.

***

### isTimeTraveling

> **isTimeTraveling**: `boolean`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:39](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L39)

***

### onJumpTo()

> **onJumpTo**: (`index`) => `void`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:46](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L46)

#### Parameters

##### index

`number`

#### Returns

`void`

***

### onReplay()?

> `optional` **onReplay**: () => `void`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:50](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L50)

#### Returns

`void`

***

### onResume()

> **onResume**: () => `void`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:49](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L49)

#### Returns

`void`

***

### onStepBack()

> **onStepBack**: () => `void`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:47](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L47)

#### Returns

`void`

***

### onStepForward()

> **onStepForward**: () => `void`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:48](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L48)

#### Returns

`void`

***

### previewState?

> `optional` **previewState**: `unknown`

Defined in: [devtools-storeview/src/components/panels/TimeTravelPanel.tsx:40](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/TimeTravelPanel.tsx#L40)
