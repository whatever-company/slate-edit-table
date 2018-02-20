import expect from 'expect';
import fs from 'fs';
import path from 'path';
import Slate from 'slate';
import readMetadata from 'read-metadata';

import EditTable from '../lib';

function deserializeValue(json, schema) {
    return Slate.Value.fromJSON({ ...json, schema }, { normalize: false });
}

describe('slate-edit-table', () => {
    const tests = fs.readdirSync(__dirname);

    tests.forEach(test => {
        if (test[0] === '.' || path.extname(test).length > 0) return;

        it(test, () => {
            const dir = path.resolve(__dirname, test);
            const input = readMetadata.sync(path.resolve(dir, 'input.yaml'));
            const expectedPath = path.resolve(dir, 'expected.yaml');
            const expected =
                fs.existsSync(expectedPath) && readMetadata.sync(expectedPath);

            /* eslint-disable global-require, import/no-dynamic-require */
            const runChange = require(path.resolve(dir, 'change.js')).default;
            const pluginOptions =
                require(path.resolve(dir, 'change.js')).pluginOptions || {};
            /* eslint-enable */

            const plugin = EditTable(pluginOptions);
            const schema = Slate.Schema.create({
                plugins: [plugin]
            });

            const valueInput = deserializeValue(input, schema);

            const newChange = runChange(plugin, valueInput.change());

            if (expected) {
                const newDocJSon = newChange.value.toJSON();
                expect(newDocJSon).toEqual(deserializeValue(expected).toJSON());
            }
        });
    });
});
