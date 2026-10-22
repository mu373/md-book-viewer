import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { BOOKS_CONFIG } from '../config/books.config'

for (const scenario of ['missing book', 'missing chapter', 'empty books']) {
  test(`preserves the remote index when local input has ${scenario}`, () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'algolia-input-'))
    try {
      assert.ok(BOOKS_CONFIG.length > 0)
      for (const bookPath of BOOKS_CONFIG) {
        assert.ok(bookPath.startsWith('./books/'))
        const directory = path.join(cwd, bookPath)
        mkdirSync(directory, { recursive: true })
        writeFileSync(path.join(directory, 'book.json'), JSON.stringify({
          id: path.basename(directory), title: 'Test book',
          chapters: scenario === 'empty books' ? [] : [
            { id: 'chapter', title: 'Chapter', file: 'missing.md', order: 1 },
          ],
        }))
      }
      if (scenario === 'missing book') {
        rmSync(path.join(cwd, BOOKS_CONFIG[0], 'book.json'))
      }
      const result = spawnSync(process.execPath, [
        '--import', require.resolve('tsx'),
        path.join(__dirname, 'index-algolia.ts'),
      ], {
        cwd, encoding: 'utf8', timeout: 10000,
        env: { ...process.env, ALGOLIA_APP_ID: 'test', ALGOLIA_ADMIN_KEY: 'test' },
      })
      assert.equal(result.status, 1, result.stdout + result.stderr)
      assert.match(result.stderr, /ENOENT|No records to index/)
      assert.doesNotMatch(result.stdout, /Configuring index settings|Uploading records/)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
}
