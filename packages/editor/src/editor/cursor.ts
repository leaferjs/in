import { ICursorType, IUIEvent } from '@leafer-ui/interface'
import { IDirection8, IEditor } from '@leafer-in/interface'


const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = IDirection8

export function updateCursor(editor: IEditor, e: IUIEvent): void {
    const point = editor.box.enterPoint
    if (!point || !editor.targetList.length || !editor.box.visible) return



    let { rotation } = editor.box
    let { resizeCursor, rotateCursor, resizeable } = editor.config
    const mirror = editor.tool.getMirrorData(editor)
    const { direction, pointType } = point

    editor.box.enterPoint = point
    const isResizePoint = pointType === 'resize'

    if (isResizePoint && (e.metaKey || e.ctrlKey || !resizeable)) resizeCursor = rotateCursor

    if (mirror.x || mirror.y) {
        mirrorCursors(resizeCursor = [...resizeCursor], mirror.x, mirror.y)
        mirrorCursors(rotateCursor = [...rotateCursor], mirror.y, mirror.x)
        if (mirror.x + mirror.y === 1) rotation = -rotation
    }

    let index = (direction + Math.round(rotation / 45)) % 8
    if (index < 0) index += 8

    point.cursor = isResizePoint ? resizeCursor[index] : rotateCursor[index]
}

export function updateMoveCursor(editor: IEditor): void {
    editor.box.targetRect.cursor = editor.config.moveCursor
}


export function mirrorCursors(mirror: ICursorType[], mirrorX: number, mirrorY: number): void {
    if (mirrorX) {
        const topCursor = mirror[top], topLeftCursor = mirror[topLeft], topRightCursor = mirror[topRight]
        mirror[top] = mirror[bottom]
        mirror[topLeft] = mirror[bottomLeft]
        mirror[topRight] = mirror[bottomRight]
        mirror[bottom] = topCursor
        mirror[bottomLeft] = topLeftCursor
        mirror[bottomRight] = topRightCursor
    }

    if (mirrorY) {
        const leftCursor = mirror[left], topLeftCursor = mirror[topLeft], bottomLeftCursor = mirror[bottomLeft]
        mirror[left] = mirror[right]
        mirror[topLeft] = mirror[topRight]
        mirror[bottomLeft] = mirror[bottomRight]
        mirror[right] = leftCursor
        mirror[topRight] = topLeftCursor
        mirror[bottomRight] = bottomLeftCursor
    }
}