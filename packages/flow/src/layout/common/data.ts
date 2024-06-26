import { IBox } from '@leafer-ui/interface'

import { IFlowWrapDrawData, IFlowDrawData, IFlowParseData } from '@leafer-in/interface'

import { alignToInnerXMap, alignToInnerYMap } from './align'

const p = {} as IFlowParseData

export function getParseData(box: IBox, isFlowX: boolean): IFlowParseData {
    const { gap, flowAlign: align, flowWrap: wrap, __autoWidth, __autoHeight } = box.__
    const needWrap = wrap && (isFlowX ? !__autoWidth : !__autoHeight)

    if (typeof gap === 'object') {
        p.xGap = gap.x || 0
        p.yGap = gap.y || 0
    } else {
        p.xGap = p.yGap = gap
    }

    p.isAutoXGap = typeof p.xGap === 'string' && !__autoWidth
    p.isAutoYGap = typeof p.yGap === 'string' && !__autoHeight

    p.complex = needWrap || align !== 'top-left' || box.__hasGrow || p.isAutoXGap || p.isAutoYGap
    p.wrap = needWrap

    if (p.complex) {
        p.isFitXGap = p.xGap === 'fit' && !__autoWidth
        p.isFitYGap = p.yGap === 'fit' && !__autoHeight

        if (typeof align === 'object') {
            p.contentAlign = align.content || 'top-left'
            p.rowXAlign = align.x || 'from'
            p.rowYAlign = align.y || 'from'
        } else {
            p.contentAlign = align
            p.rowXAlign = alignToInnerXMap[align]
            p.rowYAlign = alignToInnerYMap[align]
        }

    }

    return p
}

export function getDrawData(start: number, gap: number): IFlowDrawData {
    return { x: 0, y: 0, width: 0, height: 0, gap, start, count: 0, grow: 0 }
}

export function getWrapDrawData(): IFlowWrapDrawData {
    return { x: 0, y: 0, width: 0, height: 0, gap: 0, count: 0, list: [] }
}