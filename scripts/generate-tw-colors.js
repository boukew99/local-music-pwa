// TailwindCSS does not yet support ES modules, so we need to generate a CJS module
// so it can be imported synchronously.
import { build } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { importFromString } from 'module-from-string'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** @type {import('rollup').RollupOutput[]} */
const [{ output }] = await build({
	configFile: false,
	root: rootDir,
	build: {
		write: false,
		lib: {
			entry: path.resolve(rootDir, './src/lib/theme.ts'),
			formats: ['es'],
		},
	},
})

/** @type {import('../src/lib/theme')} */
const { getThemePaletteRgb, DEFAULT_THEME_ARGB } = await importFromString(output[0].code)

const [lightTokens, darkTokens] = await Promise.all([
	getThemePaletteRgb(DEFAULT_THEME_ARGB, false),
	getThemePaletteRgb(DEFAULT_THEME_ARGB, true),
])

let content = `
// Auto-generated by 'npm run generate-tw-colors'
// Do not modify this file directly.
module.exports = {
`.trimStart()
for (const name in lightTokens) {
	const lightValue = lightTokens[name]
	const darkValue = darkTokens[name]

	content += `  ${name}: { light: '${lightValue}', dark: '${darkValue}' },\n`
}
content += '}\n'

fs.writeFile('generated-tw-colors.cjs', content, 'utf8')
