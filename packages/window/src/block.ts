import { ILeaferBase } from '@leafer-ui/interface'


export function block(leafer: ILeaferBase): void {
    const { config } = leafer;
    (config.wheel || (config.wheel = {})).preventDefault = false;
    (config.touch || (config.touch = {})).preventDefault = 'auto'
}
