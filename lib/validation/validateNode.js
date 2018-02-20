// @flow
import { Block, Text, type Change, type Node } from 'slate';
import { Range, List } from 'immutable';

import type Options from '../options';

// Old format for Slate rules
type Rule = {
    match: Node => boolean,
    validate: Node => any,
    normalize: (Change, Node, any) => ?Change
};

/**
 * Returns a validateNode function, handling validation specific to tables that
 * cannot be expressed using the schema.
 */
function validateNode(opts: Options): Validator {
    const rules = [
        blockWithinCells(opts),
        cellsWithinTable(opts),
        rowsWithinTable(opts),
        tablesContainOnlyRows(opts),
        rowsContainRequiredColumns(opts)
    ];
    const validators = rules.map(toValidateNode);

    return function validateTableNode(node) {
        let changer;
        validators.find(validator => {
            changer = validator(node);
            return Boolean(changer);
        });

        return changer;
    };
}

// Convert an old rule definition to an individual plugin with on "validateNode"
function toValidateNode(rule: Rule): Validator {
    return function validateRule(node: Node) {
        if (!rule.match(node)) {
            return undefined;
        }
        const validationResult = rule.validate(node);
        if (validationResult == null) {
            return undefined;
        }

        return change => rule.normalize(change, node, validationResult);
    };
}

/**
 * Rule to enforce cells contain blocks
 */
function blockWithinCells(opts: Options): Rule {
    return {
        match(node) {
            return node.object == 'block' && node.type == opts.typeCell;
        },

        // Find direct inline children
        validate(node) {
            const inlines = node.nodes.filter(
                child => child.object === 'inline' || child.object === 'text'
            );

            return inlines.size > 0 ? inlines : null;
        },

        // If any, wrap them in default block
        normalize(change, node, inlines: List<Node>) {
            const block = makeContentBlock(opts);
            change.insertNodeByKey(node.key, 0, block, { normalize: false });

            inlines.forEach((inline, inlineIndex) => {
                const isLast = inlineIndex === inlines.size - 1;
                return change.moveNodeByKey(
                    inline.key,
                    block.key,
                    inlineIndex,
                    {
                        normalize: isLast
                    }
                );
            });

            return change;
        }
    };
}

/**
 * Rule to enforce cells are always surrounded by a row.
 */
function cellsWithinTable(opts: Options): Rule {
    return {
        match(node) {
            return (
                (node.object === 'document' || node.object === 'block') &&
                node.type !== opts.typeRow
            );
        },

        // Find child cells nodes not in a row
        validate(node) {
            const cells = node.nodes.filter(n => n.type === opts.typeCell);

            if (cells.isEmpty()) {
                return undefined;
            }

            return {
                cells
            };
        },

        // If any, wrap all cells in a row block
        normalize(change, node, { cells }: { cells: Node[] }) {
            cells.forEach(cell =>
                change.wrapBlockByKey(cell.key, opts.typeRow, {
                    normalize: false
                })
            );

            return change;
        }
    };
}

/**
 * Rule to enforce rows are always surrounded by a table.
 */
function rowsWithinTable(opts: Options): Rule {
    return {
        match(node) {
            return (
                (node.object === 'document' || node.object === 'block') &&
                node.type !== opts.typeTable
            );
        },

        // Find child cells nodes not in a row
        validate(node) {
            const rows = node.nodes.filter(n => n.type === opts.typeRow);

            if (rows.isEmpty()) {
                return undefined;
            }

            return {
                rows
            };
        },

        // If any, wrap all cells in a row block
        normalize(change, node, { rows }: { rows: Node[] }) {
            rows.forEach(row =>
                change.wrapBlockByKey(
                    row.key,
                    {
                        type: opts.typeTable
                    },
                    { normalize: false }
                )
            );

            return change;
        }
    };
}

/**
 * Rule that ensures tables only contain rows and at least one.
 */
function tablesContainOnlyRows(opts: Options): Rule {
    const isRow = node => node.type === opts.typeRow;

    return {
        match(node) {
            return node.type === opts.typeTable;
        },

        validate(table) {
            // Figure out invalid rows
            const invalids = table.nodes.filterNot(isRow);

            // Figure out valid rows
            const add =
                invalids.size === table.nodes.size ? [makeEmptyRow(opts)] : [];

            if (invalids.isEmpty() && add.length === 0) {
                return null;
            }

            return {
                invalids,
                add
            };
        },

        /**
         * Replaces the node's children
         */
        normalize(
            change,
            node,
            { invalids = [], add = [] }: { invalids: Node[], add: Node[] }
        ) {
            // Remove invalids
            invalids.forEach(child =>
                change.removeNodeByKey(child.key, { normalize: false })
            );

            // Add valids
            add.forEach(child => change.insertNodeByKey(node.key, 0, child));

            return change;
        }
    };
}

/**
 * A rule that ensures rows contains only cells, and
 * as much cells as there is columns in the table.
 */
function rowsContainRequiredColumns(opts: Options): Rule {
    const isRow = node => node.type === opts.typeRow;
    const isCell = node => node.type === opts.typeCell;
    const countCells = row => row.nodes.count(isCell);

    return {
        match(node) {
            return node.type === opts.typeTable;
        },

        validate(table) {
            const rows = table.nodes.filter(isRow);

            // The number of column this table has
            const columns = rows.reduce(
                (count, row) => Math.max(count, countCells(row)),
                1
            ); // Min 1 column

            // else normalize, by padding with empty cells
            const invalidRows = rows
                .map(row => {
                    const cells = countCells(row);
                    const invalids = row.nodes.filterNot(isCell);

                    // Row is valid: right count of cells and no extra node
                    if (invalids.isEmpty() && cells === columns) {
                        return null;
                    }

                    // Otherwise, remove the invalids and append the missing cells
                    return {
                        row,
                        invalids,
                        add: columns - cells
                    };
                })
                .filter(Boolean);

            return invalidRows.size > 0 ? invalidRows : null;
        },

        /**
         * Updates by key every given nodes
         */
        normalize(change, node, rows: Node[]) {
            rows.forEach(({ row, invalids, add }) => {
                invalids.forEach(child => {
                    change.removeNodeByKey(child.key, { normalize: false });
                });

                Range(0, add).forEach(() => {
                    const cell = makeEmptyCell(opts);
                    change.insertNodeByKey(row.key, 0, cell, {
                        normalize: false
                    });
                });
            });

            return change;
        }
    };
}

function makeContentBlock(opts: Options): Block {
    return Block.create({
        type: opts.typeContent,
        nodes: List([Text.create('')])
    });
}

function makeEmptyCell(opts: Options): Block {
    return Block.create({
        type: opts.typeCell,
        nodes: List([makeContentBlock(opts)])
    });
}

function makeEmptyRow(opts: Options): Block {
    return Block.create({
        type: opts.typeRow,
        nodes: List([makeEmptyCell(opts)])
    });
}

export default validateNode;
