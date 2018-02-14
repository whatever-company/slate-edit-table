// @flow
import { type Change } from 'slate';

import { TablePosition } from '../utils';
import type Options from '../options';

/**
 * Move selection to {x,y}
 */
function moveSelection(
    opts: Options,
    change: Change,
    x: number,
    y: number
): Change {
    const { value } = change;
    let { startOffset } = value;
    const startBlock =
        value.startBlock.type === opts.typeCell
            ? value.startBlock
            : value.document.getClosest(
                  value.startBlock.key,
                  p => p.type === opts.typeCell
              );

    if (!startBlock) {
        throw new Error('moveSelection can only be applied from within a cell');
    }

    const pos = TablePosition.create(value, startBlock);
    const { table } = pos;

    const row = table.nodes.get(y);
    const cell = row.nodes.get(x);

    // Calculate new offset
    if (startOffset > cell.text.length) {
        startOffset = cell.text.length;
    }

    return change.collapseToEndOf(cell).moveOffsetsTo(startOffset);
}

export default moveSelection;
