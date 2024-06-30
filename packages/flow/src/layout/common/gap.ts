import { IGapBoundsData } from '@leafer-in/interface'


export function autoGap(data: IGapBoundsData, side: 'width' | 'height', sideTotal: number, fit: boolean): void {
    const { count } = data
    if (count > 1 && (sideTotal > data[side] || fit)) {
        data.gap = (sideTotal - data[side]) / (count - 1)
        data[side] = sideTotal
    }
}