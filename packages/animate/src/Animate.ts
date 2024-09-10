import { IAnimate, IAnimateOptions, IKeyframe, IUIInputData, IComputedKeyframe, IAnimateEasing, IAnimateDirection, IAnimateEnding, IObject, IFunction, ITimer, IAnimateEvents, IUI, IPercentData, ITransition } from '@leafer-ui/interface'
import { Platform, UnitConvert } from '@leafer-ui/draw'

import { AnimateEasing } from './AnimateEasing'
import { animateAttr } from './decorator'
import { AnimateTransition } from './AnimateTransition'
import { transition } from './transition'


const frameDuration = 0.2

export class Animate implements IAnimate {

    public target: IUI

    public keyframes: IKeyframe[]
    public config?: IAnimateOptions

    public fromStyle: IUIInputData
    public toStyle: IUIInputData
    public get endingStyle() { return this.realEnding === 'from' ? this.fromStyle : this.toStyle }

    public get started(): boolean { return !!this.requestAnimateTime }
    public running: boolean
    public get completed(): boolean { return this.time >= this.duration && !this.started }
    public destroyed: boolean

    public time: number
    public looped: number


    @animateAttr('ease')
    public easing: IAnimateEasing

    @animateAttr('normal')
    public direction: IAnimateDirection


    @animateAttr(0)
    public delay: number

    @animateAttr(frameDuration)
    public duration: number

    @animateAttr('normal')
    public ending: IAnimateEnding


    @animateAttr(false)
    public loop: boolean | number

    @animateAttr(0)
    public loopDelay: number


    @animateAttr(1)
    public speed: number

    @animateAttr(true)
    public autoplay: boolean

    @animateAttr()
    public join: boolean


    @animateAttr()
    public event?: IAnimateEvents

    public isTemp: boolean


    public frames: IComputedKeyframe[]

    protected nowIndex: number
    protected get nowFrame(): IComputedKeyframe { return this.frames[this.nowIndex] }
    protected get nowTotalDuration(): number { return this.nowFrame.totalDuration || this.nowFrame.duration || 0 }

    protected easingFn: IFunction

    protected requestAnimateTime: number
    protected playedDuration: number

    protected isReverse: boolean
    protected timer: ITimer

    public get alternate(): boolean { return this.direction.includes('alternate') }

    public get realEnding(): IAnimateEnding {
        let count: number
        const { ending, direction, loop } = this
        if (ending === 'from') count = 0
        else if (ending === 'to') count = 1
        else {
            count = direction.includes('reverse') ? 0 : 1
            if (loop && typeof loop === 'number') count += loop - 1
        }
        return count % 2 ? 'to' : 'from'
    }


    constructor(target: IUI, keyframe: IUIInputData | IKeyframe[], options?: ITransition, isTemp?: boolean) {
        this.init(target, keyframe, options, isTemp)
    }


    public init(target: IUI, keyframe: IUIInputData | IKeyframe[], options?: ITransition, isTemp?: boolean): void {
        this.target = target
        this.isTemp = isTemp
        switch (typeof options) {
            case 'number': this.config = { duration: options }; break
            case 'string': this.config = { easing: options }; break
            case 'object': this.config = options
        }

        if (!keyframe) return
        this.keyframes = keyframe instanceof Array ? keyframe : [keyframe]

        this.easingFn = AnimateEasing.get(this.easing)

        this.frames = []
        this.create()

        if (this.autoplay) this.timer = setTimeout(() => {
            this.timer = 0
            this.play()
        }, 0)
    }


    public play(): void {
        if (this.destroyed) return

        this.running = true
        if (!this.started) this.clearTimer(), this.start()
        else if (!this.timer) this.requestAnimate()
        this.emit('play')
    }

    public pause(): void {
        if (this.destroyed) return

        this.running = false
        this.clearTimer()
        this.emit('pause')
    }

    public stop(): void {
        if (this.destroyed) return

        this.end()
        this.complete()
        this.emit('stop')
    }

    public seek(time: number | IPercentData): void {
        if (this.destroyed) return
        if (typeof time === 'object') time = UnitConvert.number(time, this.duration)

        time /= this.speed
        if (!this.started || time < this.time) this.start(true)
        this.time = time

        this.animate(0, true)
        this.clearTimer(() => this.requestAnimate())
    }

    public kill(): void {
        this.destroy(true)
    }


    protected create(): void {
        const { target, frames, keyframes, config } = this, { length } = keyframes, joinBefore = length > 1 ? this.join : true
        let addedDuration = 0, totalAutoDuration = 0, before: IObject, keyframe: IKeyframe, item: IComputedKeyframe, style: IObject

        if (length > 1) this.fromStyle = {}, this.toStyle = {}

        for (let i = 0; i < length; i++) {

            keyframe = keyframes[i]
            style = keyframe.style || keyframe

            if (!before) before = joinBefore ? target.__ : style

            item = { style, beforeStyle: {} }

            if (keyframe.style) { // with options

                const { duration, autoDuration, delay, autoDelay, easing } = keyframe

                if (duration) {
                    item.duration = duration, addedDuration += duration
                    if (delay) item.totalDuration = duration + delay
                } else {
                    if (autoDuration) item.autoDuration = autoDuration, totalAutoDuration += autoDuration
                }

                if (delay) item.delay = delay, addedDuration += delay
                else if (autoDelay) item.autoDelay = autoDelay, totalAutoDuration += autoDelay

                if (easing) item.easingFn = AnimateEasing.get(easing)

            }

            if (!item.autoDuration && item.duration === undefined) {
                if (length > 1) (i > 0 || joinBefore) ? totalAutoDuration++ : item.duration = 0 // fromNow不为true时，第一帧无时长
                else item.duration = this.duration
            }

            if (length > 1) {
                this.setBefore(item, style, before)
            } else {
                for (let key in style) { item.beforeStyle[key] = this.getTargetAttr(key) }
                this.fromStyle = item.beforeStyle, this.toStyle = item.style
            }

            before = style
            frames.push(item)
        }


        if (totalAutoDuration) {
            if (this.duration <= addedDuration || !(config && config.duration)) this.changeDuration(addedDuration + frameDuration * totalAutoDuration)
            this.allocateTime((this.duration - addedDuration) / totalAutoDuration)
        } else {
            if (addedDuration) this.changeDuration(addedDuration)
        }

        this.emit('create')
    }

    public changeDuration(duration: number): void {
        const { config } = this
        this.config = config ? { ...config, duration } : { duration }
    }

    public setBefore(item: IComputedKeyframe, data: IObject, before: IObject): void {
        const { fromStyle, toStyle } = this // 同时生成完整的 from / to
        for (let key in data) {
            if (fromStyle[key] === undefined) fromStyle[key] = toStyle[key] = this.getTargetAttr(key)
            item.beforeStyle[key] = before[key] === undefined ? toStyle[key] : before[key]
            toStyle[key] = data[key]
        }
    }

    public allocateTime(partTime: number): void {
        let { frames } = this, { length } = frames, frame: IComputedKeyframe
        for (let i = 0; i < length; i++) {
            frame = frames[i]
            if (frame.duration === undefined) frame.duration = frame.autoDuration ? partTime * frame.autoDuration : partTime
            if (!frame.totalDuration) {
                if (frame.autoDelay) frame.delay = frame.autoDelay * partTime
                if (frame.delay) frame.totalDuration = frame.duration, frame.totalDuration += frame.delay
            }
        }
    }


    protected requestAnimate(): void {
        this.requestAnimateTime = Date.now()
        Platform.requestRender(this.animate.bind(this))
    }

    protected animate(_runtime?: number, seek?: boolean): void {
        if (!seek) {
            if (!this.running) return
            this.time += (Date.now() - this.requestAnimateTime) / 1000
        }

        const { duration } = this, realNow = this.time * this.speed

        if (realNow < duration) {

            while (realNow - this.playedDuration > this.nowTotalDuration) {
                this.transition(1)
                this.isReverse ? this.reverseNextFrame() : this.nextFrame()
            }

            const itemDelay = this.isReverse ? 0 : (this.nowFrame.delay || 0)
            const itemPlayedTime = realNow - this.playedDuration - itemDelay
            const nowDuration = this.nowFrame.duration

            if (itemPlayedTime > nowDuration) {
                this.transition(1)
            } else if (itemPlayedTime >= 0) {
                const t = nowDuration ? itemPlayedTime / nowDuration : 1
                this.transition(this.nowFrame.easingFn ? this.nowFrame.easingFn(t) : this.easingFn(t))
            }

        } else {

            this.end()
        }


        // next 

        if (!seek) {
            if (realNow < duration) {
                this.requestAnimate()
            } else {
                const { loop, loopDelay } = this

                if (loop !== false || this.alternate) {

                    this.looped ? this.looped++ : this.looped = 1

                    if (!(typeof loop === 'number' && (!loop || this.looped >= loop))) {

                        if (this.alternate) this.isReverse = !this.isReverse

                        if (loopDelay) this.timer = setTimeout(() => { this.timer = 0, this.begin() }, loopDelay / this.speed * 1000)
                        else this.begin()

                        return
                    }
                }

                this.complete()
            }
        }

    }

    protected start(seek?: boolean): void {
        this.requestAnimateTime = 1 // started

        const isReverse = this.direction.includes('reverse')
        if (isReverse || this.isReverse) this.isReverse = isReverse
        if (this.looped) this.looped = 0

        if (seek) this.begin(true)
        else {
            const { delay } = this
            if (delay) this.timer = setTimeout(() => {
                this.timer = 0
                this.begin()
            }, delay / this.speed * 1000)
            else this.begin()
        }
    }

    protected begin(seek?: boolean): void {
        this.playedDuration = this.time = 0
        this.isReverse ? this.setTo() : this.setFrom()
        if (!seek) this.requestAnimate()
    }

    protected end(): void {
        this.isReverse ? this.setFrom() : this.setTo()
    }

    protected complete(): void {
        this.requestAnimateTime = 0
        this.running = false

        const { realEnding } = this
        if (realEnding === 'from') this.setFrom()
        else if (realEnding === 'to') this.setTo()

        this.clearTimer()
        this.emit('complete')
    }


    protected setFrom(): void {
        this.nowIndex = 0
        this.setStyle(this.fromStyle)
    }

    protected setTo(): void {
        this.nowIndex = this.frames.length - 1
        this.setStyle(this.toStyle)
    }


    protected nextFrame(): void {
        if (this.nowIndex + 1 >= this.frames.length) return
        this.playedDuration += this.nowTotalDuration
        this.nowIndex++
    }

    protected reverseNextFrame(): void {
        if (this.nowIndex - 1 < 0) return
        this.playedDuration += this.nowTotalDuration
        this.nowIndex--
    }


    protected transition(t: number): void {
        const { style, beforeStyle } = this.nowFrame
        const fromStyle = this.isReverse ? style : beforeStyle
        const toStyle = this.isReverse ? beforeStyle : style

        if (t === 0) {
            this.setStyle(fromStyle)
        } else if (t === 1) {
            this.setStyle(toStyle)
        } else {

            let from: number, to: number, attrTransition: IFunction, { betweenStyle } = this.nowFrame
            if (!betweenStyle) betweenStyle = this.nowFrame.betweenStyle = {}

            for (let key in style) {
                from = fromStyle[key], to = toStyle[key], attrTransition = AnimateTransition[key] || transition

                if (from !== to) betweenStyle[key] = attrTransition(from, to, t)
                else betweenStyle[key] = to

            }

            this.setStyle(betweenStyle)
        }

        this.emit('update')
    }

    public setStyle(style: IObject): void {
        this.target.set(style, this.isTemp)
    }

    public getTargetAttr(name: string): any {
        return (this.target.__ as IObject)[name]
    }

    protected clearTimer(fn?: IFunction): void {
        if (this.timer) {
            clearTimeout(this.timer), this.timer = 0
            if (fn) fn()
        }
    }

    protected emit(name: 'play' | 'pause' | 'stop' | 'create' | 'update' | 'complete'): void {
        const fn = this.event && this.event[name]
        if (fn) fn(this)
    }

    public destroy(complete?: boolean): void {
        if (!this.destroyed) {
            if (complete && !this.completed) this.stop()
            else this.pause()
            this.target = this.config = this.frames = null
            this.destroyed = true
        }
    }

}