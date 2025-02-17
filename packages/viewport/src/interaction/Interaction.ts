import { IMoveEvent, IZoomEvent, IRotateEvent, IWheelEvent, IUIEvent, IKeepTouchData, IPointData, IEvent } from '@leafer-ui/interface'

import { InteractionBase } from '@leafer-ui/core'

import { WheelEventHelper } from './WheelEventHelper'
import { Transformer } from './Transformer'
import { MultiTouchHelper } from './MultiTouchHelper'


function getMoveEventData(move: IPointData, event: IEvent): IMoveEvent {
    return { ...event, moveX: move.x, moveY: move.y } as IMoveEvent
}

function getRotateEventData(rotation: number, event: IEvent): IRotateEvent {
    return { ...event, rotation } as IRotateEvent
}

function getZoomEventData(scale: number, event: IEvent): IZoomEvent {
    return { ...event, scale, } as IZoomEvent
}


const interaction = InteractionBase.prototype

interaction.createTransformer = function (): void {
    this.transformer = new Transformer(this)
}

interaction.move = function (data: IMoveEvent): void {
    this.transformer.move(data)
}

interaction.zoom = function (data: IZoomEvent): void {
    this.transformer.zoom(data)
}

interaction.rotate = function (data: IRotateEvent): void {
    this.transformer.rotate(data)
}

interaction.transformEnd = function (): void {
    this.transformer.transformEnd()
}


interaction.wheel = function (data: IWheelEvent): void {
    const { wheel } = this.config
    if (wheel.disabled) return

    const scale = wheel.getScale ? wheel.getScale(data, wheel) : WheelEventHelper.getScale(data, wheel)
    scale !== 1 ? this.zoom(getZoomEventData(scale, data)) : this.move(getMoveEventData(wheel.getMove ? wheel.getMove(data, wheel) : WheelEventHelper.getMove(data, wheel), data))
}


interaction.multiTouch = function (data: IUIEvent, list: IKeepTouchData[]): void {
    if (this.config.multiTouch.disabled) return
    const { move, rotation, scale, center } = MultiTouchHelper.getData(list)
    Object.assign(data, center)

    this.rotate(getRotateEventData(rotation, data))
    this.zoom(getZoomEventData(scale, data))
    this.move(getMoveEventData(move, data))
}