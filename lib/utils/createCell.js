// @flow
import { Block, Text } from 'slate';
import type Options from '../options';

/**
 * Create a new cell
 */
function createCell(opts: Options, text?: string): Block {
    if (opts.allowBlocksInCells) {
        return Block.create({
            type: opts.typeCell,
            nodes: [
                Block.create({
                    type: opts.typeContent,
                    nodes: [Text.create(text)]
                })
            ]
        });
    }
    return Block.create({
        type: opts.typeCell,
        nodes: [Text.create(text)]
    });
}

export default createCell;
