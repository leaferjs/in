export * from '@leafer-ui/scale'

export { Editor } from './Editor'

export { EditBox } from './display/EditBox'
export { EditPoint } from './display/EditPoint'
export { EditSelect } from './display/EditSelect'
export { SelectArea } from './display/SelectArea'
export { Stroker } from './display/Stroker'

export { EditorEvent } from './event/EditorEvent'
export { EditorMoveEvent } from './event/EditorMoveEvent'
export { EditorScaleEvent } from './event/EditorScaleEvent'
export { EditorRotateEvent } from './event/EditorRotateEvent'
export { EditorSkewEvent } from './event/EditorSkewEvent'

export { EditToolCreator, registerEditTool, registerInnerEditor } from './tool/EditToolCreator'
export { InnerEditor } from './tool/InnerEditor'
export { EditTool } from './tool/EditTool'
export { LineEditTool } from './tool/LineEditTool'

export { EditorHelper } from './helper/EditorHelper'
export { EditDataHelper } from './helper/EditDataHelper'
export { EditSelectHelper } from './helper/EditSelectHelper'

import { IEditor, IEditorConfig, IEditToolFunction, IEditorConfigFunction } from '@leafer-in/interface'
import { Creator, UI, Line, defineKey } from '@leafer-ui/draw'

import { Editor } from './Editor'

Creator.editor = function (options?: IEditorConfig): IEditor { return new Editor(options) }

UI.setEditConfig = function (config: IEditorConfig | IEditorConfigFunction): void {
    defineKey(this.prototype, 'editConfig', {
        get(): IEditorConfig { return typeof config === 'function' ? config(this) : config }
    })
}

UI.setEditOuter = function (toolName: string | IEditToolFunction): void {
    defineKey(this.prototype, 'editTool', {
        get(): string { return typeof toolName === 'string' ? toolName : toolName(this) }
    })
}

UI.setEditInner = function (editorName: string | IEditToolFunction): void {
    defineKey(this.prototype, 'editInner', {
        get(): string { return typeof editorName === 'string' ? editorName : editorName(this) }
    })
}

Line.setEditOuter(function (line: Line): string {
    return (line.points || line.pathInputed) ? 'EditTool' : 'LineEditTool'
})