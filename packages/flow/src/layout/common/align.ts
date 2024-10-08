import { IBoundsData, IBox, IFlowAlign, IPointData } from '@leafer-ui/interface'
import { AlignHelper } from '@leafer-ui/draw'

import { IFlowAlignToAxisAlignMap } from '@leafer-in/interface'


const point = {} as IPointData

export const alignToInnerXMap: IFlowAlignToAxisAlignMap = {
    'top-left': 'from',
    'top': 'center',
    'top-right': 'to',
    'right': 'to',
    'bottom-right': 'to',
    'bottom': 'center',
    'bottom-left': 'from',
    'left': 'from',
    'center': 'center',
    'baseline-left': 'from',
    'baseline-center': 'center',
    'baseline-right': 'to',
}

export const alignToInnerYMap: IFlowAlignToAxisAlignMap = {
    'top-left': 'from',
    'top': 'from',
    'top-right': 'from',
    'right': 'center',
    'bottom-right': 'to',
    'bottom': 'to',
    'bottom-left': 'to',
    'left': 'center',
    'center': 'center',
    'baseline-left': 'to',
    'baseline-center': 'to',
    'baseline-right': 'to',
}

export function alignContent(box: IBox, content: IBoundsData, align: IFlowAlign): void {
    const data = box.__
    const { contentBounds } = box.__layout
    AlignHelper.toPoint(align as any, content, contentBounds, point)
    content.x = data.__autoWidth ? contentBounds.x : point.x
    content.y = data.__autoHeight ? contentBounds.y : point.y
}