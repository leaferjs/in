import { IAnimate, IAnimateOptions, IObject, IValue, IUI } from '@leafer-ui/interface'
import { decorateLeafAttr, attr } from '@leafer-ui/draw'


export function animationType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: any) {
            this.__setAttr(key, value)
            if (this.leafer) {
                (this as IUI).killAnimate('animation')
                if (value) (this as IUI).animate(value, undefined, 'animation')
            }
        }
    }))
}

export function animateAttr(defaultValue?: any) {
    return (target: IAnimate, key: string) => {
        Object.defineProperty(target, key, {
            get() {
                const value = this.config && (this.config as IObject)[key]
                return value === undefined ? defaultValue : value
            },
            set(value: unknown) {
                if (!this.config) this.config = {} as IAnimateOptions
                (this.config as IObject)[key] = value
            }
        } as ThisType<IAnimate>)
    }
}